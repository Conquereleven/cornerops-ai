import { useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { PublicLanding } from './routes/PublicLanding';
import { publicRoutes } from './components/public/PublicRouteManifest';

function Unavailable() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return <main className="ct-site ct-section"><div className="ct-width">
    <h1 tabIndex={-1}>Page unavailable</h1>
    <p>This is the CornerTech AI public website. Private workspace access is not available here.</p>
    <Link className="ct-button" to="/">Back to CornerTech AI</Link>
  </div></main>;
}

function PublicRouteEffects() {
  const location = useLocation();
  const navigation = useNavigationType();
  const positions = useRef(new Map<string, number>());
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous || 'auto'; };
  }, []);
  useLayoutEffect(() => {
    // Capture scroll while this history entry is active. Cleanup occurs after
    // the next route DOM may shrink; reading scrollY there loses the old offset.
    const save = () => positions.current.set(location.key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [location.key]);
  useLayoutEffect(() => {
    const pathname = location.pathname.replace(/\/+$/, '') || '/';
    const route = publicRoutes.find(item => item.path === pathname);
    if (!route) return;
    document.title = route.copy.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const oldDescription = description?.content;
    if (description) description.content = route.copy.description;
    // Sprint02 is a review candidate. Publication/initial-HTML SEO remains gated.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    const target = ['#company', '#contact'].includes(location.hash)
      ? document.querySelector<HTMLElement>(`${location.hash} h2`) : null;
    const saved = positions.current.get(location.key);
    if (navigation === 'POP' && saved !== undefined) {
      window.scrollTo(0, saved);
      document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
    } else if (target) {
      target.scrollIntoView?.({ block: 'start', behavior: 'instant' });
      target.focus({ preventScroll: true });
    } else {
      window.scrollTo(0, 0);
      document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
    }
    return () => {
      robots.remove();
      if (description && oldDescription !== undefined) description.content = oldDescription;
    };
  }, [location.key, location.pathname, location.hash, navigation]);
  return null;
}

export default function PublicApp() {
  useEffect(() => {
    if (window.location.hostname === 'www.cornertech.ae') {
      window.location.replace(`https://cornertech.ae${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
  }, []);
  return <BrowserRouter>
    <PublicRouteEffects />
    <Routes>
      {publicRoutes.map(route => <Route key={route.id} path={route.path} element={<PublicLanding page={route.id} />} />)}
      <Route path="*" element={<Unavailable />} />
    </Routes>
  </BrowserRouter>;
}
