import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CLIENT } from '@solidvs/server';

import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { Project, ProjectRepository } from '../domain/project.js';

/**
 * Infrastructure layer: the only place a module touches Prisma (ADR-0016; the lint keeps it here).
 * Runs with the application login, which reads and writes rows but has no DDL.
 */
@Injectable()
export class PrismaProjectRepository implements ProjectRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly db: PrismaClient) {}

  async list(): Promise<Project[]> {
    return this.db.project.findMany();
  }

  async findById(id: string): Promise<Project | undefined> {
    return (await this.db.project.findUnique({ where: { id } })) ?? undefined;
  }

  async add(project: Project): Promise<void> {
    await this.db.project.create({ data: project });
  }
}
