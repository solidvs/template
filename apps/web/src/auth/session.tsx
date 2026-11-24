import { meResponse, type MeResponse } from '@example/contracts';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { z } from 'zod';

import { api, setCsrfToken } from '../api';

const SessionContext = createContext<MeResponse | null>(null);

/** Loads who is signed in; without a session the API answers 401 and the browser goes to sign in. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  useEffect(() => {
    api(meResponse, '/api/auth/me').then((value) => {
      setCsrfToken(value.csrfToken);
      setMe(value);
    });
  }, []);
  if (!me) return null;
  return <SessionContext.Provider value={me}>{children}</SessionContext.Provider>;
}

export function useSession(): MeResponse {
  const me = useContext(SessionContext);
  if (!me) throw new Error('useSession outside SessionProvider');
  return me;
}

/** Ends the session here and at the identity provider. */
export async function signOut(): Promise<void> {
  const { redirectUrl } = await api(z.object({ redirectUrl: z.string() }), '/api/auth/logout', { method: 'POST' });
  window.location.assign(redirectUrl);
}
