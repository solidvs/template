import {
  Avatar,
  Box,
  ChartBarIcon,
  DecisionIcon,
  DeploymentIcon,
  LinkIcon,
  PageIcon,
  ProjectPage,
  ScreenIcon,
  SettingsIcon,
  Text,
  type ProjectView,
} from '@solidvs/ui';
import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';

import { rememberProject, useProjects } from '../app/projects';

function Placeholder({ children }: { children: string }) {
  return (
    <Box paddingBlock="space.24">
      <Text color="text.muted">{children}</Text>
    </Box>
  );
}

const TABS: Omit<ProjectView, 'content'>[] = [
  { id: 'resumo', label: 'Resumo', icon: ChartBarIcon },
  { id: 'ambientes', label: 'Ambientes', icon: ScreenIcon },
  { id: 'deploys', label: 'Deploys', icon: DeploymentIcon },
  { id: 'decisoes', label: 'Decisões', icon: DecisionIcon },
  { id: 'procedimentos', label: 'Procedimentos', icon: PageIcon },
  { id: 'dependencias', label: 'Dependências', icon: LinkIcon },
  { id: 'configuracoes', label: 'Configurações', icon: SettingsIcon },
];

/** A project, with its views as tabs. Each tab has its own URL: /projetos/<id>/<tab>. */
export function Project() {
  const { projectId, tab } = useParams();
  const navigate = useNavigate();
  const projects = useProjects();
  const project = projects?.find((p) => p.id === projectId);
  useEffect(() => {
    if (project) rememberProject(project);
  }, [project]);

  if (!projects) return null;
  if (!project) return <Navigate to="/projetos" replace />;
  const selected = TABS.some((t) => t.id === tab) ? tab! : 'resumo';
  const views: ProjectView[] = TABS.map((t) => ({ ...t, content: <Placeholder>{`${t.label} de ${project.name}`}</Placeholder> }));

  return (
    <ProjectPage
      spaceLabel="Projetos"
      title={project.name}
      avatar={<Avatar size="small" appearance="square" name={project.name} />}
      views={views}
      selectedViewId={selected}
      onViewChange={(viewId) => navigate(`/projetos/${project.id}/${viewId}`)}
      members={[]}
    />
  );
}
