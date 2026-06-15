import { Bell, ChevronDown, Menu, Radio, Server, Settings, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHealth } from '../../hooks/useHealth';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { connected, latencyMs } = useHealth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);

  return <header className="topbar">
    <button className="menu-button" onClick={onMenu} aria-label="Abrir navegación"><Menu size={20} /></button>
    <div className="topbar-spacer" />
    <div className={`connection-pill ${connected ? '' : 'connection-offline'}`}><span className={connected ? 'online-dot' : 'offline-dot'} /><Server size={15} /> {connected ? 'Backend conectado' : 'Backend desconectado'}</div>
    <div className="connection-pill desktop-only"><Radio size={15} /> API <strong>{latencyMs === null ? '—' : `${latencyMs} ms`}</strong></div>
    <div className="topbar-menu">
      <button className="icon-button" aria-label="Ver notificaciones" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((open) => !open); setOperatorOpen(false); }}><Bell size={18} /></button>
      {notificationsOpen && <div className="topbar-popover notification-popover"><span className="eyebrow">Operations feed</span><strong>Sin alertas críticas</strong><p>Los 5 workers principales están activos. La cola humana se mantiene dentro del objetivo.</p></div>}
    </div>
    <div className="topbar-menu">
      <button className="operator" aria-label="Abrir menú de Usuario 1" aria-expanded={operatorOpen} onClick={() => { setOperatorOpen((open) => !open); setNotificationsOpen(false); }}><span>U1</span><div><strong>Usuario 1</strong><small>Admin · Operaciones</small></div><ChevronDown size={15} /></button>
      {operatorOpen && <div className="topbar-popover operator-popover"><div><span className="operator-avatar">U1</span><p><strong>Usuario 1</strong><small>Administrador del workspace</small></p></div><Link to="/worker-settings" onClick={() => setOperatorOpen(false)}><SlidersHorizontal size={14} /> Configurar workers</Link><Link to="/settings" onClick={() => setOperatorOpen(false)}><Settings size={14} /> Ajustes del workspace</Link></div>}
    </div>
  </header>;
}
