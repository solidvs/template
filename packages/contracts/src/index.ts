import { z } from 'zod';

/**
 * Response contracts of the API. The API validates what it sends against these schemas and the web
 * app validates what it receives: a response that does not match is an error on both sides.
 */

/** `GET /api/auth/me`: who is signed in (shape defined by @solidvs/server). */
export const meResponse = z.object({
  user: z.object({
    username: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    department: z.string().nullable(),
  }),
  roles: z.array(z.string()),
  access: z.object({ by: z.enum(['department', 'group']), value: z.string() }),
  csrfToken: z.string(),
});
export type MeResponse = z.infer<typeof meResponse>;

/** `GET /api/about`: identification of the running system. */
export const aboutResponse = z.object({
  system: z.string(),
  name: z.string(),
  release: z.string(),
});
export type AboutResponse = z.infer<typeof aboutResponse>;

/** A project of this system (the template's example module, backed by the database). */
export const project = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});
export type Project = z.infer<typeof project>;

/** `GET /api/projects`: every project, by name. */
export const projectsResponse = z.object({ projects: z.array(project) });
export type ProjectsResponse = z.infer<typeof projectsResponse>;

/** `POST /api/projects`: body. The id becomes the project's address: /projetos/<id>. */
export const createProjectRequest = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'letras minúsculas, números e hífens').max(60),
  name: z.string().trim().min(1).max(120),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequest>;
