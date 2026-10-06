import { Boxes, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { navigationFor } from '../../config/moduleRegistry';

export function Sidebar({open,onClose}:{open:boolean;onClose:()=>void}){
  const {workspace}=useAuth();
  const active=workspace.active;
  // The incubator starts collapsed so company operations lead the navigation.
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({incubator:true});
  const sections=navigationFor(active?.role);
  return <>{open&&<button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation"/>}<aside className={`sidebar ${open?'sidebar-open':''}`}><div className="brand"><span className="brand-mark"><Boxes size={22}/></span><div><strong>CornerOps <em>AI</em></strong><small>Command Center</small></div><button className="mobile-close" onClick={onClose} aria-label="Close menu"><X size={18}/></button></div><nav aria-label="Workspace navigation">{sections.map(({surface,group,modules})=><section className="nav-group" key={surface}><button className="nav-group-toggle" aria-expanded={!collapsed[surface]} onClick={()=>setCollapsed(value=>({...value,[surface]:!value[surface]}))}><span>{group}</span><ChevronDown size={13}/></button>{!collapsed[surface]&&<div>{modules.map(({route,label,icon:Icon,key})=><NavLink key={key} to={route} end={key==='commerce-overview'} onClick={onClose} className={({isActive})=>isActive?'nav-active':''}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></NavLink>)}</div>}</section>)}</nav><div className="sidebar-footer"><div className="tenant"><span className="tenant-flag tenant-flag-workspace">WS</span><div><strong>{active?.name??'No workspace'}</strong><small>{active?`${active.role} access`:'Not a member'}</small></div></div></div></aside></>;
}
