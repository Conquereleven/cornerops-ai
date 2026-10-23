import { websiteV2Content } from '../../config/publicContent';

export const publicRoutes = [
  { id: 'home', path: '/', copy: websiteV2Content.routes.home },
  { id: 'commerce', path: '/products/commerce', copy: websiteV2Content.routes.commerce },
  { id: 'solutions', path: '/solutions', copy: websiteV2Content.routes.solutions },
] as const;
export type PublicPageId = typeof publicRoutes[number]['id'];
export const publicNavigation = [
  { label: websiteV2Content.navigation.commerce, href: '/products/commerce' },
  { label: websiteV2Content.navigation.solutions, href: '/solutions' },
  { label: websiteV2Content.navigation.company, href: '/#company' },
  { label: websiteV2Content.navigation.contact, href: '/#contact' },
];

export function publicMetadata(pathname: string) {
  const route = publicRoutes.find(item => item.path === (pathname.replace(/\/+$/, '') || '/'));
  return route ? { ...route.copy, path: route.path, indexable: true } : {
    title: 'Page unavailable | CornerTech AI',
    description: 'The requested page is not available on the CornerTech AI public website.',
    path: '', indexable: false,
  };
}

export function publicRobots(pathname: string, hostname: string) {
  return publicMetadata(pathname).indexable && ['cornertech.ae', 'www.cornertech.ae'].includes(hostname)
    ? 'index, follow' : 'noindex, nofollow';
}
