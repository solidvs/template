import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configurePlatformApp } from '@solidvs/server';
import { FakeIdentityProvider, RecordingAuditTrail, TestDataModule } from '@solidvs/server/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { configSchema } from './config.js';
import type { Project, ProjectRepository } from './modules/projects/domain/project.js';
import { PROJECT_REPOSITORY } from './modules/projects/projects.module.js';
import { sessionOf, TEST_CONFIG } from './testing.js';

class InMemoryProjects implements ProjectRepository {
  readonly rows = new Map<string, Project>();
  async list(): Promise<Project[]> {
    return [...this.rows.values()];
  }
  async findById(id: string): Promise<Project | undefined> {
    return this.rows.get(id);
  }
  async add(project: Project): Promise<void> {
    this.rows.set(project.id, project);
  }
}

const IT = { sub: 'u1', preferred_username: 'ana', department: 'TI', groups: [] };
const IT_ADMIN = { ...IT, sub: 'u3', preferred_username: 'carla', groups: ['GRP-Example-Admins'] };

/**
 * The system over HTTP with a fake identity provider and no database: what any system created from
 * the template must keep true. Add one test like these for every route; the database itself is
 * covered by `pnpm test:db`.
 */
describe('system over HTTP', () => {
  let app: INestApplication;
  let provider: FakeIdentityProvider;
  let projects: InMemoryProjects;
  let audit: RecordingAuditTrail;

  beforeEach(async () => {
    provider = new FakeIdentityProvider();
    projects = new InMemoryProjects();
    audit = new RecordingAuditTrail();
    const config = configSchema.parse({
      ...TEST_CONFIG,
      DATABASE_HOST: 'unused.test',
      DATABASE_NAME: 'example_test',
      DATABASE_USER: 'unused',
      DATABASE_PASSWORD: 'unused',
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(config, { identityProvider: provider, database: TestDataModule.forRoot(audit) })],
    })
      .overrideProvider(PROJECT_REPOSITORY)
      .useValue(projects)
      .compile();
    app = moduleRef.createNestApplication();
    configurePlatformApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('answers the platform healthcheck without a session', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200, { status: 'ok' });
  });

  it('requires a session for everything else', async () => {
    await request(app.getHttpServer()).get('/api/about').expect(401);
    await request(app.getHttpServer()).get('/api/projects').expect(401);
  });

  it('lets the IT department in and answers according to the contract', async () => {
    const session = await sessionOf(app, provider, IT);
    await request(app.getHttpServer()).get('/api/about').set('Cookie', session!.cookie).expect(200, { system: 'example', name: 'Sistema de exemplo', release: 'r-1' });
  });

  it('keeps other departments out', async () => {
    expect(await sessionOf(app, provider, { sub: 'u2', preferred_username: 'bruno', department: 'Vendas', groups: [] })).toBeUndefined();
  });

  it('lists projects by name', async () => {
    await projects.add({ id: 'b', name: 'Beta', createdAt: new Date('2026-11-24T10:00:00Z'), createdBy: 'seed' });
    await projects.add({ id: 'a', name: 'Alfa', createdAt: new Date('2026-11-24T11:00:00Z'), createdBy: 'seed' });
    const session = await sessionOf(app, provider, IT);
    const response = await request(app.getHttpServer()).get('/api/projects').set('Cookie', session!.cookie).expect(200);
    expect(response.body.projects.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
  });

  it('creates a project only for administrators, with the CSRF header, and audits it', async () => {
    const server = app.getHttpServer();
    const member = await sessionOf(app, provider, IT);
    await request(server).post('/api/projects').set('Cookie', member!.cookie).set('x-csrf-token', member!.csrf).send({ id: 'novo', name: 'Novo' }).expect(403);

    const admin = await sessionOf(app, provider, IT_ADMIN);
    await request(server).post('/api/projects').set('Cookie', admin!.cookie).send({ id: 'novo', name: 'Novo' }).expect(403);
    await request(server).post('/api/projects').set('Cookie', admin!.cookie).set('x-csrf-token', admin!.csrf).send({ id: 'Novo!', name: 'Novo' }).expect(422);
    const created = await request(server).post('/api/projects').set('Cookie', admin!.cookie).set('x-csrf-token', admin!.csrf).send({ id: 'novo', name: ' Novo ' }).expect(201);
    expect(created.body).toMatchObject({ id: 'novo', name: 'Novo' });
    await request(server).post('/api/projects').set('Cookie', admin!.cookie).set('x-csrf-token', admin!.csrf).send({ id: 'novo', name: 'Outro' }).expect(409);
    expect(audit.events).toEqual([{ actor: 'carla', action: 'project.created', subjectType: 'project', subjectId: 'novo', details: { name: 'Novo' } }]);
  });
});
