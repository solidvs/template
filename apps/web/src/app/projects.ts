import { projectsResponse } from '@example/contracts';
import type { ProjectLink } from '@solidvs/ui';
import { useEffect, useState } from 'react';

import { api } from '../api';

/** Projects come from the API (`GET /api/projects`, stored in the system's database). */
export function useProjects(): ProjectLink[] | undefined {
  const [projects, setProjects] = useState<ProjectLink[]>();
  useEffect(() => {
    api(projectsResponse, '/api/projects').then((value) =>
      setProjects(value.projects.map((project) => ({ id: project.id, name: project.name, href: `/projetos/${project.id}` }))),
    );
  }, []);
  return projects;
}

const RECENT_KEY = 'recent-projects';

/** Recent projects are a per-browser convenience; storage may be unavailable. */
export function recentProjects(): ProjectLink[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]') as unknown;
    return (Array.isArray(stored) ? stored : [])
      .filter((p): p is ProjectLink => typeof p?.id === 'string' && typeof p?.name === 'string' && typeof p?.href === 'string')
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function rememberProject(project: ProjectLink): void {
  try {
    const others = recentProjects().filter((p) => p.id !== project.id);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify([project, ...others].slice(0, 5)));
  } catch {
    // Recent projects are optional.
  }
}
