/**
 * Domain layer: a project and its rules. Plain TypeScript, no framework, no I/O.
 */
export type Project = {
  /** Address of the project in the web app (/projetos/<id>): lowercase letters, digits, hyphens. */
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  /** Username of who created it. */
  readonly createdBy: string;
};

export class ProjectRuleError extends Error {}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function newProject(input: { id: string; name: string }, createdBy: string, now: Date): Project {
  const name = input.name.trim();
  if (!ID.test(input.id) || input.id.length > 60) throw new ProjectRuleError('id: lowercase letters, digits and hyphens, up to 60');
  if (name.length === 0 || name.length > 120) throw new ProjectRuleError('name: 1 to 120 characters');
  return { id: input.id, name, createdAt: now, createdBy };
}

/** What the application needs from storage; implemented in infrastructure/. */
export interface ProjectRepository {
  list(): Promise<Project[]>;
  findById(id: string): Promise<Project | undefined>;
  add(project: Project): Promise<void>;
}
