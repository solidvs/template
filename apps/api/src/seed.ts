import 'reflect-metadata';

import { createDriverAdapter, databaseConfigSchema, databaseEngine, loadConfig } from '@solidvs/server';

import { PrismaClient } from './generated/prisma/client.js';

/**
 * Synthetic data for development and laboratory databases (control 5): never real people, never
 * production data. Runs with the application login; refuses any database that is not a
 * development one (`<system>_dev` or `<system>_lab`).
 */
const PROJECTS = [
  { id: 'fila-ti', name: 'Fila da TI' },
  { id: 'portal-vendas', name: 'Portal de vendas' },
  { id: 'intake', name: 'Solicitações' },
];

const config = loadConfig(databaseConfigSchema);
if (!/_(dev|lab)$/.test(config.DATABASE_NAME)) {
  console.error(`refusing to seed ${config.DATABASE_NAME}: synthetic data goes to development databases only`);
  process.exit(1);
}

const db = new PrismaClient({ adapter: await createDriverAdapter(databaseEngine(), config) });
try {
  for (const project of PROJECTS) {
    await db.project.upsert({
      where: { id: project.id },
      update: {},
      create: { ...project, createdAt: new Date(), createdBy: 'seed' },
    });
  }
  console.log(`seeded ${PROJECTS.length} synthetic projects into ${config.DATABASE_NAME}`);
} finally {
  await db.$disconnect();
}
