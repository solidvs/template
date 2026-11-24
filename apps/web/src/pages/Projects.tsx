import { Avatar, Box, Heading, Inline, Stack, Text } from '@solidvs/ui';
import { Link } from 'react-router';

import { useProjects } from '../app/projects';

/** "Mais projetos": every project. */
export function Projects() {
  const projects = useProjects();
  if (!projects) return null;
  return (
    <Box padding="space.24">
      <Stack space="space.16">
        <Heading size="large" as="h1">
          Projetos
        </Heading>
        <Stack space="space.8">
          {projects.map((project) => (
            <Inline key={project.id} space="space.8" alignBlock="center">
              <Avatar size="small" appearance="square" name={project.name} />
              <Link to={project.href}>
                <Text>{project.name}</Text>
              </Link>
            </Inline>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
