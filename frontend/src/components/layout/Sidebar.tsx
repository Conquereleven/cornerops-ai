import { Boxes, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { modulesByGroup } from '../../config/moduleRegistry';

export function Sidebar({open,onClose}:{open:boolean;onClose:()=>void}){
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  return <>{open&&<button className="sidebar-scrim" onClick={onClose} aria-label="Cerrar navegación"/>}<aside className={`sidebar ${open?'sidebar-open':''}`}><div className="brand"><span className="brand-mark"><Boxes size={22}/></span><div><strong>CórnerOps <em>AI</em></strong><small>Unified Command Center</small></div><button className="mobile-close" onClick={onClose} aria-label="Cerrar menú"><X size={18}/></button></div><nav aria-label="Canonical modules">{modulesByGroup.map(({group,modules})=><section className="nav-group" key={group}><button className="nav-group-toggle" aria-expanded={!collapsed[group]} onClick={()=>setCollapsed(value=>({...value,[group]:!value[group]}))}><span>{group}</span><ChevronDown size={13}/></button>{!collapsed[group]&&<div>{modules.map(({route,label,icon:Icon})=><NavLink key={route} to={route} onClick={onClose} className={({isActive})=>isActive?'nav-active':''}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></NavLink>)}</div>}</section>)}</nav><div className="sidebar-footer"><div className="tenant"><span className="tenant-flag">UAE</span><div><strong>CornerMex UAE</strong><small>Read-only operations</small></div></div><div className="timezone"><span>GST</span><small>Asia/Dubai · UTC+4</small></div></div></aside></>;
}
