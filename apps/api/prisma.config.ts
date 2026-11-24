import { existsSync } from 'node:fs';

import { databaseConfigSchema, databaseEngine, loadConfig, prismaCliUrl } from '@solidvs/server/data';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI of this system (ADR-0016). The engine comes from DATABASE_ENGINE (the build's choice,
 * PostgreSQL by default); each engine has its schema and its migrations folder. The connection,
 * needed only to apply migrations, is built from the configuration file of the migration step
 * (CONFIG_FILE, or /run/secrets/config in the migration image), never from a URL in a file.
 */
const engine = databaseEngine();
const configFile = process.env.CONFIG_FILE ?? (existsSync('/run/secrets/config') ? '/run/secrets/config' : undefined);

export default defineConfig({
  schema: engine === 'postgresql' ? 'prisma/schema.prisma' : 'prisma/sqlserver/schema.prisma',
  migrations: { path: `prisma/migrations/${engine}` },
  ...(configFile ? { datasource: { url: prismaCliUrl(engine, loadConfig(databaseConfigSchema, { path: configFile })) } } : {}),
});
