import { PlatformProvider } from '@solidvs/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { Layout } from './app/Layout';
import { SessionProvider } from './auth/session';
import { Home } from './pages/Home';
import { NoAccess } from './pages/NoAccess';
import { Project } from './pages/Project';
import { Projects } from './pages/Projects';

const router = createBrowserRouter([
  { path: '/sem-acesso', element: <NoAccess /> },
  {
    element: (
      <SessionProvider>
        <Layout />
      </SessionProvider>
    ),
    children: [
      { path: '/', element: <Home /> },
      { path: '/projetos', element: <Projects /> },
      { path: '/projetos/:projectId/:tab?', element: <Project /> },
    ],
  },
]);

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <PlatformProvider>
      <RouterProvider router={router} />
    </PlatformProvider>
  </StrictMode>,
);
