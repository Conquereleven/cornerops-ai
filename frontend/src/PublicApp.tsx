import { useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { PublicLanding } from './routes/PublicLanding';
import { publicRoutes, publicMetadata, publicRobots } from './components/public/PublicRouteManifest';
import { PublicUnavailable } from './components/public/PublicUnavailable';

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
    const metadata = publicMetadata(location.pathname);
    const previousTitle = document.title;
    document.title = metadata.title;
    const undo: Array<() => void> = [];
    const setTag = (selector: string, tag: 'meta' | 'link', attributes: Record<string, string>) => {
      const existing = document.querySelector<HTMLElement>(selector);
      const previous = existing ? Array.from(existing.attributes, attr => [attr.name, attr.value] as const) : null;
      const node = existing || document.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
      if (!existing) document.head.appendChild(node);
      undo.push(() => {
        if (!previous) { node.remove(); return; }
        for (const name of node.getAttributeNames()) node.removeAttribute(name);
        for (const [name, value] of previous) node.setAttribute(name, value);
      });
    };
    setTag('meta[name="description"]', 'meta', { name: 'description', content: metadata.description });
    setTag('meta[name="robots"]', 'meta', { name: 'robots', content: publicRobots(location.pathname, window.location.hostname) });
    for (const [property, content] of [['og:title', metadata.title], ['og:description', metadata.description]]) {
      setTag(`meta[property="${property}"]`, 'meta', { property, content });
    }
    if (metadata.indexable) {
      const canonical = 'https://cornertech.ae' + metadata.path;
      setTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: canonical });
      setTag('meta[property="og:url"]', 'meta', { property: 'og:url', content: canonical });
    } else {
      for (const selector of ['link[rel="canonical"]', 'meta[property="og:url"]']) {
        const node = document.querySelector(selector);
        if (node) { node.remove(); undo.push(() => { document.head.appendChild(node); }); }
      }
    }
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
      undo.reverse().forEach(restore => restore());
      document.title = previousTitle;
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
      <Route path="*" element={<PublicUnavailable />} />
    </Routes>
  </BrowserRouter>;
}
