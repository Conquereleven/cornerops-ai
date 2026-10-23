import { useEffect, useRef } from 'react';
import { V2Frame, V2Home, V2Commerce, V2Solutions } from '../components/public/WebsiteV2';
import { publicNavigation, type PublicPageId } from '../components/public/PublicRouteManifest';
import { siteConfig } from '../config/siteConfig';
import '../styles/cornertech.css';

export function PublicLanding({ page = 'home' }: { page?: PublicPageId }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (root.current) root.current.dataset.motion = preference?.matches ? 'reduced' : 'ready';
    };
    update();
    preference?.addEventListener('change', update);
    return () => preference?.removeEventListener('change', update);
  }, []);
  return <div className="co-public" ref={root}>
    <V2Frame nav={publicNavigation}>
      {page === 'home' ? <V2Home contact={siteConfig} /> : page === 'commerce' ? <V2Commerce /> : <V2Solutions />}
    </V2Frame>
  </div>;
}
