import { AppShell, HomeIcon, ProjectsMenuItem, SideNavMenu } from '@solidvs/ui';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';

import { signOut, useSession } from '../auth/session';
import { recentProjects } from './projects';

/** The shell of every page behind sign-in: top nav, side nav with "Projetos", main area. */
export function Layout() {
  const me = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  return (
    <AppShell
      userName={me.user.name}
      sideNav={
        <>
          <SideNavMenu
            sections={[{ id: 'main', items: [{ id: 'home', label: 'Início', href: '/', icon: HomeIcon }] }]}
            {...(location.pathname === '/' ? { selectedId: 'home' } : {})}
            navigate={navigate}
          />
          <ProjectsMenuItem href="/projetos" recent={recentProjects()} {...(projectId ? { selectedProjectId: projectId } : {})} navigate={navigate} />
        </>
      }
      sideNavFooter={
        <SideNavMenu
          sections={[{ id: 'account', items: [{ id: 'sign-out', label: 'Sair', href: '/' }] }]}
          navigate={() => {
            void signOut();
          }}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}
