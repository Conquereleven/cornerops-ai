import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // The private workspace is never indexable and has its own document title.
  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    document.title = 'CornerTech AI — Workspace';
    return () => { robots.remove(); document.title = previousTitle; };
  }, []);
  return <div className="app-shell"><Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="app-main"><Topbar onMenu={() => setMobileOpen(true)} /><main className="page"><Outlet /></main></div></div>;
}
