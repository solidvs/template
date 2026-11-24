import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configurePlatformApp, DATABASE_CLIENT, databaseConfigSchema, loadConfig } from '@solidvs/server';
import { FakeIdentityProvider } from '@solidvs/server/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { configSchema } from './config.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { sessionOf, TEST_CONFIG } from './testing.js';

/**
 * The system against a real database (ADR-0016), with the application login of CONFIG_FILE:
 *   pnpm db:lab && pnpm db:deploy && CONFIG_FILE=../../config.local.json pnpm test:db
 * The data module refuses to start unless migrations were applied and the login has no DDL.
 */
describe('system over HTTP, real database', () => {
  let app: INestApplication;
  let provider: FakeIdentityProvider;
  const id = `db-test-${Date.now()}`;

  beforeAll(async () => {
    provider = new FakeIdentityProvider();
    const database = loadConfig(databaseConfigSchema);
    const config = configSchema.parse({ ...TEST_CONFIG, ...database });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule.forRoot(config, { identityProvider: provider })] }).compile();
    app = moduleRef.createNestApplication();
    configurePlatformApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates a project, lists it and leaves an audit event', async () => {
    const admin = await sessionOf(app, provider, { sub: 'u3', preferred_username: 'carla', department: 'TI', groups: ['GRP-Example-Admins'] });
    await request(app.getHttpServer()).post('/api/projects').set('Cookie', admin!.cookie).set('x-csrf-token', admin!.csrf).send({ id, name: 'Projeto de teste' }).expect(201);
    const list = await request(app.getHttpServer()).get('/api/projects').set('Cookie', admin!.cookie).expect(200);
    expect(list.body.projects).toContainEqual(expect.objectContaining({ id, name: 'Projeto de teste' }));

    const db = app.get<PrismaClient>(DATABASE_CLIENT);
    expect(await db.auditEvent.findMany({ where: { subjectId: id } })).toEqual([expect.objectContaining({ actor: 'carla', action: 'project.created' })]);
  });

  it('the running service cannot change the audit trail', async () => {
    const db = app.get<PrismaClient>(DATABASE_CLIENT);
    await expect(db.auditEvent.updateMany({ data: { actor: 'mallory' } })).rejects.toThrow();
    await expect(db.auditEvent.deleteMany({})).rejects.toThrow();
  });
});
