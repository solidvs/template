import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Plugin } from 'vite';

type Notice = { name: string; version: string; license: string; texts: string[] };

const LICENSE_FILE = /^(licen[cs]e|notice|copying)(\.(md|txt))?$/i;

/** The directory of the package a bundled module belongs to, or null for the app's own code. */
function packageDir(id: string): string | null {
  const clean = id.replace(/\?.*$/, '').replace(/^\0/, '');
  const index = clean.lastIndexOf('/node_modules/');
  if (index < 0) return null;
  const rest = clean.slice(index + '/node_modules/'.length).split('/');
  const nameParts = rest[0]?.startsWith('@') ? rest.slice(0, 2) : rest.slice(0, 1);
  return join(clean.slice(0, index), 'node_modules', ...nameParts);
}

function read(dir: string): Notice | null {
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) return null;
  const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as { name: string; version: string; license?: string };
  const texts: string[] = [];
  for (const file of readdirSync(dir).filter((f) => LICENSE_FILE.test(f)).sort()) texts.push(readFileSync(join(dir, file), 'utf8').trim());
  const licenses = join(dir, 'licenses');
  if (existsSync(licenses)) for (const file of readdirSync(licenses).sort()) texts.push(readFileSync(join(licenses, file), 'utf8').trim());
  return { name: pkg.name, version: pkg.version, license: pkg.license ?? 'see text', texts };
}

/**
 * Emits THIRD-PARTY-NOTICES.txt beside the built files: name, version, license and full license text
 * of every package bundled into the web app, fonts included (ADR-0011, item 8).
 */
export function thirdPartyNotices(): Plugin {
  return {
    name: 'platform:third-party-notices',
    apply: 'build',
    generateBundle() {
      const notices = new Map<string, Notice>();
      for (const id of this.getModuleIds()) {
        const dir = packageDir(id);
        if (!dir || notices.has(dir)) continue;
        const notice = read(dir);
        if (notice) notices.set(dir, notice);
      }
      const sorted = [...notices.values()].sort((a, b) => a.name.localeCompare(b.name));
      const source = [
        'Third-party software bundled in this application',
        '',
        ...sorted.flatMap((n) => [`${'='.repeat(78)}`, `${n.name} ${n.version} (${n.license})`, '', ...n.texts.flatMap((t) => [t, ''])]),
      ].join('\n');
      this.emitFile({ type: 'asset', fileName: 'THIRD-PARTY-NOTICES.txt', source });
    },
  };
}
