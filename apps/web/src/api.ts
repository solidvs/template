import type { z } from 'zod';

let csrfToken: string | undefined;

/** Called once the session is known; every state-changing request carries the token. */
export function setCsrfToken(token: string): void {
  csrfToken = token;
}

/**
 * Sends the browser to sign in, returning here afterwards. The returned promise never settles: the
 * page is being replaced, so nothing after it should run.
 */
export function signIn(): Promise<never> {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  return new Promise<never>(() => undefined);
}

/**
 * Calls the API on the same origin and validates the answer against its contract. A response that
 * does not match the contract is an error, never silently used.
 */
export async function api<S extends z.ZodType>(
  schema: S,
  path: string,
  init: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown } = {},
): Promise<z.infer<S>> {
  const method = init.method ?? 'GET';
  const headers: Record<string, string> = { accept: 'application/json' };
  if (method !== 'GET') {
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
    headers['content-type'] = 'application/json';
  }
  const response = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  if (response.status === 401) return signIn();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status}`);
  return schema.parse(await response.json());
}
