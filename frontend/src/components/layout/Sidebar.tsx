import { Bot, Boxes, Building2, LayoutDashboard, MessageSquareText, PackageSearch, PlugZap, Settings, ShieldCheck, SlidersHorizontal, Tags, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLeads } from '../../hooks/useLeads';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/control-tower', label: 'Control Tower', icon: ShieldCheck },
  { to: '/chat', label: 'AI Chat Center', icon: MessageSquareText },
  { to: '/conversations', label: 'Conversations', icon: Bot },
  { to: '/orders', label: 'Orders', icon: PackageSearch },
  { to: '/products', label: 'Products', icon: Tags },
  { to: '/leads', label: 'B2B Leads', icon: Building2 },
  { to: '/worker-settings', label: 'Worker Settings', icon: SlidersHorizontal },
  { to: '/integrations', label: 'Integrations', icon: PlugZap },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: leads, loading, offline } = useLeads();
  const leadCount = Array.isArray(leads) ? leads.length : 0;
  const showLeadCount = !loading && !offline && leadCount > 0;

  return <>
    {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Cerrar navegación" />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <span className="brand-mark"><Boxes size={22} /></span>
        <div><strong>CórnerOps <em>AI</em></strong><small>24/7 AI Workers · UAE</small></div>
        <button className="mobile-close" onClick={onClose} aria-label="Cerrar menú"><X size={18} /></button>
      </div>
      <nav>{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => isActive ? 'nav-active' : ''}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'B2B Leads' && showLeadCount && <b>{leadCount}</b>}</NavLink>)}</nav>
      <div className="sidebar-footer">
        <div className="tenant"><span className="tenant-flag">UAE</span><div><strong>Cornermex UAE</strong><small>Operaciones</small></div></div>
        <div className="timezone"><span>GST</span><small>Asia/Dubai · UTC+4</small></div>
      </div>
    </aside>
  </>;
}
