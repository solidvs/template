import { newProject, ProjectRuleError, type Project, type ProjectRepository } from '../domain/project.js';

/** The audit trail as the use cases see it; the platform's AuditTrail fits it. */
export interface AuditRecorder {
  record(event: { actor: string; action: string; subjectType: string; subjectId?: string; details?: Record<string, unknown> }): Promise<void>;
}

export class ProjectAlreadyExists extends Error {}

/**
 * Application layer: one use case per class. Depends on the domain only; storage and the audit
 * trail arrive through the constructor.
 */
export class ListProjects {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(): Promise<Project[]> {
    return (await this.projects.list()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}

export class CreateProject {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly audit: AuditRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Every change of data leaves an audit event (A.8.15). */
  async execute(input: { id: string; name: string }, actor: string): Promise<Project> {
    const project = newProject(input, actor, this.now());
    if (await this.projects.findById(project.id)) throw new ProjectAlreadyExists(project.id);
    await this.projects.add(project);
    await this.audit.record({ actor, action: 'project.created', subjectType: 'project', subjectId: project.id, details: { name: project.name } });
    return project;
  }
}

export { ProjectRuleError };
