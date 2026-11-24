import { Box, Heading, Stack, Text } from '@solidvs/ui';

/** Where the API sends people the access rule refuses. Shown without a session. */
export function NoAccess() {
  return (
    <Box padding="space.48">
      <Stack space="space.16">
        <Heading size="large" as="h1">
          Você não tem acesso a este sistema
        </Heading>
        <Text color="text.muted">Se precisar dele, peça acesso à equipe de TI.</Text>
      </Stack>
    </Box>
  );
}
