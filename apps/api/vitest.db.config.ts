import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Tests against a real database (`pnpm db:lab`, `pnpm db:deploy`); not part of `pnpm test`.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: { include: ['src/**/*.db-test.ts'], environment: 'node', testTimeout: 30_000, fileParallelism: false },
});
