import { aboutResponse, type AboutResponse } from '@example/contracts';
import { Box, Heading, Lozenge, Stack, Text, token } from '@solidvs/ui';
import { useEffect, useState } from 'react';

import { api } from '../api';
import { useSession } from '../auth/session';

const REASON = { department: 'departamento', group: 'grupo' } as const;

/** Start page: who is signed in, why they may enter, and which release is running. */
export function Home() {
  const me = useSession();
  const [about, setAbout] = useState<AboutResponse | null>(null);
  useEffect(() => {
    api(aboutResponse, '/api/about').then(setAbout);
  }, []);

  return (
    <Box padding="space.24">
      <Stack space="space.16">
        <Heading size="large" as="h1">
          Olá, {me.user.name}
        </Heading>
        <Text color="text.muted">
          Você entrou por {REASON[me.access.by]} <strong>{me.access.value}</strong>
          {me.roles.length > 0 ? `, com o papel ${me.roles.join(', ')}` : ''}.
        </Text>
        {about && (
          <Box
            padding="space.16"
            backgroundColor="surface.raised"
            style={{ borderRadius: token('radius.8'), boxShadow: token('shadow.raised') }}
          >
            <Stack space="space.8">
              <Heading size="xsmall" as="h2">
                {about.name}
              </Heading>
              <Text size="small" color="text.faint">
                Sistema {about.system} · versão <Lozenge>{about.release}</Lozenge>
              </Text>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
