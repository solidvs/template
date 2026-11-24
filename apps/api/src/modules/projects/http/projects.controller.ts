import { createProjectRequest, project as projectContract, projectsResponse, type Project as ProjectView, type ProjectsResponse } from '@example/contracts';
import { Body, ConflictException, Controller, Get, Inject, Post, UnprocessableEntityException } from '@nestjs/common';
import { CurrentSession, RequireRoles, type Session } from '@solidvs/server';

import { CreateProject, ListProjects, ProjectAlreadyExists, ProjectRuleError } from '../application/projects.js';
import type { Project } from '../domain/project.js';

const view = (project: Project): ProjectView => ({ id: project.id, name: project.name, createdAt: project.createdAt.toISOString() });

/** HTTP layer: requests in, use cases, responses validated against their contracts. */
@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(ListProjects) private readonly listProjects: ListProjects,
    @Inject(CreateProject) private readonly createProject: CreateProject,
  ) {}

  @Get()
  async list(): Promise<ProjectsResponse> {
    return projectsResponse.parse({ projects: (await this.listProjects.execute()).map(view) });
  }

  /** Changes data: administrators only, with the CSRF header (sent by the web app's api()). */
  @Post()
  @RequireRoles('admin')
  async create(@Body() body: unknown, @CurrentSession() session: Session): Promise<ProjectView> {
    const input = createProjectRequest.safeParse(body);
    if (!input.success) throw new UnprocessableEntityException(input.error.issues.map((issue) => issue.message));
    try {
      return projectContract.parse(view(await this.createProject.execute(input.data, session.principal.username)));
    } catch (error) {
      if (error instanceof ProjectAlreadyExists) throw new ConflictException('project already exists');
      if (error instanceof ProjectRuleError) throw new UnprocessableEntityException(error.message);
      throw error;
    }
  }
}
