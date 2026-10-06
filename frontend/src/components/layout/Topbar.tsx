import { LogOut, Menu, Radio, Server, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useHealth } from '../../hooks/useHealth';

export function Topbar({onMenu}:{onMenu:()=>void}){
  const {connected,latencyMs}=useHealth();
  const {signOut,workspace}=useAuth();
  const navigate=useNavigate();
  const [signingOut,setSigningOut]=useState(false);
  const logout=async()=>{setSigningOut(true);try{await signOut();navigate('/login',{replace:true});}catch{/* The session stays protected if sign-out fails. */}finally{setSigningOut(false);}};
  return <header className="topbar"><button className="menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20}/></button><div className="topbar-spacer"/><div className={`connection-pill ${connected?'':'connection-offline'}`}><span className={connected?'online-dot':'offline-dot'}/><Server size={15}/>{connected?'Backend connected':'Backend unavailable'}</div><div className="connection-pill desktop-only"><Radio size={15}/>API <strong>{latencyMs===null?'—':`${latencyMs} ms`}</strong></div><div className="connection-pill desktop-only"><ShieldCheck size={15}/>{workspace.active?.name??'—'} · <strong>{workspace.active?.role??'no access'}</strong></div><button className="icon-button" type="button" aria-label="Sign out" disabled={signingOut} onClick={()=>void logout()}><LogOut size={16}/></button></header>;
}
