import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Boundary rules of the standard stack (stack proposal, section 3):
 * - apps/web reaches the interface components only through @solidvs/ui (ADR-0011);
 * - API modules: domain depends on nothing; application depends on domain only;
 *   frameworks and I/O live in infrastructure/ and http/;
 * - Prisma (the package and the generated client) lives in infrastructure/, plus the files that
 *   build the client: database.ts, seed.ts and database tests (ADR-0016).
 */
const PRISMA = {
  group: ['@prisma/*', 'prisma', '**/generated/prisma', '**/generated/prisma/*'],
  message: 'Prisma lives in modules/<module>/infrastructure/ (ADR-0016): reach data through a repository.',
};
const layer = (files, forbidden, message) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns: [{ group: forbidden, message }, PRISMA] }] },
});

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/public/**', '**/generated/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.node } } },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@base-ui/*', '@dnd-kit/*'], message: 'Use @solidvs/ui: it is the only door to interface components (ADR-0011).' }] },
      ],
    },
  },
  {
    files: ['apps/api/src/**/*.ts'],
    ignores: ['apps/api/src/modules/*/infrastructure/**', 'apps/api/src/database.ts', 'apps/api/src/seed.ts', 'apps/api/src/**/*.db-test.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [PRISMA] }] },
  },
  layer(
    ['apps/api/src/modules/*/domain/**'],
    ['../application/*', '../infrastructure/*', '../http/*', '@nestjs/*', 'express', 'node:*'],
    'Domain code is plain TypeScript: no framework, no I/O, no outer layer.',
  ),
  layer(
    ['apps/api/src/modules/*/application/**'],
    ['../infrastructure/*', '../http/*', 'express'],
    'Application code depends on the domain only; adapters arrive through the constructor.',
  ),
);
