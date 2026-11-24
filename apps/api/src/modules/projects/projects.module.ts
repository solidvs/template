import { Module } from '@nestjs/common';
import { AuditTrail } from '@solidvs/server';

import { CreateProject, ListProjects } from './application/projects.js';
import type { ProjectRepository } from './domain/project.js';
import { ProjectsController } from './http/projects.controller.js';
import { PrismaProjectRepository } from './infrastructure/prisma-project-repository.js';

/** Injection token of the module's repository; tests replace it with an in-memory one. */
export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');

@Module({
  controllers: [ProjectsController],
  providers: [
    { provide: PROJECT_REPOSITORY, useClass: PrismaProjectRepository },
    { provide: ListProjects, inject: [PROJECT_REPOSITORY], useFactory: (projects: ProjectRepository) => new ListProjects(projects) },
    {
      provide: CreateProject,
      inject: [PROJECT_REPOSITORY, AuditTrail],
      useFactory: (projects: ProjectRepository, audit: AuditTrail) => new CreateProject(projects, audit),
    },
  ],
})
export class ProjectsModule {}
