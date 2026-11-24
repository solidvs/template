import type { INestApplication } from '@nestjs/common';
import type { FakeIdentityProvider } from '@solidvs/server/testing';
import request from 'supertest';

/** Platform keys of a test configuration; the identity provider is fake. */
export const TEST_CONFIG = {
  PUBLIC_URL: 'https://example.test',
  OIDC_ISSUER: 'https://id.example.test/realms/internal',
  OIDC_CLIENT_ID: 'example',
  OIDC_CLIENT_SECRET: 'test-only',
  LOG_LEVEL: 'fatal',
  RELEASE: 'r-1',
};

/** Signs a person in through the fake provider; returns the session cookie and CSRF token. */
export async function sessionOf(
  app: INestApplication,
  provider: FakeIdentityProvider,
  claims: Record<string, unknown>,
): Promise<{ cookie: string; csrf: string } | undefined> {
  provider.signInAs(claims);
  const login = await request(app.getHttpServer()).get('/api/auth/login');
  const loginCookie = (login.headers['set-cookie'] as unknown as string[])[0]!.split(';')[0]!;
  const callback = new URL(login.headers.location as string);
  const response = await request(app.getHttpServer()).get(`${callback.pathname}${callback.search}`).set('Cookie', loginCookie);
  const cookie = (response.headers['set-cookie'] as unknown as string[] | undefined)?.find((c) => c.startsWith('__Host-session='))?.split(';')[0];
  if (!cookie) return undefined;
  const me = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', cookie);
  return { cookie, csrf: me.body.csrfToken as string };
}
