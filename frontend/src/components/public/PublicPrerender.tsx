// Build-only entry. The browser graph must never import react-dom/server.
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PublicLanding } from '../../routes/PublicLanding';
import { PublicUnavailable } from './PublicUnavailable';
import { publicRoutes, publicMetadata } from './PublicRouteManifest';
import { siteConfig } from '../../config/siteConfig';

export function prerenderPublicPages() {
  if (siteConfig.siteUrl !== 'https://cornertech.ae') throw new Error('Unapproved canonical origin');
  return [...publicRoutes.map(route => ({ path: route.path, id: route.id })), { path: '/404', id: null }].map(route => ({
    ...publicMetadata(route.path),
    file: route.id === null ? '404.html' : route.path === '/' ? 'index.html' : route.path.slice(1) + '/index.html',
    markup: renderToString(<MemoryRouter initialEntries={[route.path]}>
      {route.id === null ? <PublicUnavailable /> : <PublicLanding page={route.id} />}
    </MemoryRouter>),
  }));
}
