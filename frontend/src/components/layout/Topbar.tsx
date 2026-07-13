import { Menu, Radio, Server, ShieldCheck } from 'lucide-react';
import { useHealth } from '../../hooks/useHealth';

export function Topbar({onMenu}:{onMenu:()=>void}){
  const {connected,latencyMs}=useHealth();
  return <header className="topbar"><button className="menu-button" onClick={onMenu} aria-label="Abrir navegación"><Menu size={20}/></button><div className="topbar-spacer"/><div className={`connection-pill ${connected?'':'connection-offline'}`}><span className={connected?'online-dot':'offline-dot'}/><Server size={15}/>{connected?'Backend conectado':'Backend no disponible'}</div><div className="connection-pill desktop-only"><Radio size={15}/>API <strong>{latencyMs===null?'—':`${latencyMs} ms`}</strong></div><div className="connection-pill"><ShieldCheck size={15}/>Writes blocked</div></header>;
}
