import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="app-shell"><Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="app-main"><Topbar onMenu={() => setMobileOpen(true)} /><main className="page"><Outlet /></main></div></div>;
}
