import { DataModule, type DatabaseConfig } from '@solidvs/server';

import { PrismaClient } from './generated/prisma/client.js';

/**
 * The system's database (ADR-0016): the Prisma client generated from prisma/schema.prisma for the
 * engine of this build (DATABASE_ENGINE), the application login from the configuration file, and
 * the audit trail. Prisma is seen only here, in the seed and in the modules' infrastructure/.
 */
export function databaseModule(config: DatabaseConfig) {
  return DataModule.forRoot({ config, createClient: (adapter) => new PrismaClient({ adapter }) });
}
