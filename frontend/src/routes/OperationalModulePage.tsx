import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { moduleByKey, type ModuleKey } from '../config/moduleRegistry';
import { getCommercialSection, getControlTowerFrontend, type FrontendEnvelope } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { liveReadOnlyState, unavailableState, type FrontendDataState } from '../lib/dataState';

const sectionByModule:Partial<Record<ModuleKey,string>>={
  'cornermex-ops':'cornermex','flow-engine':'flows','work-queue':'work-queue','drafts':'drafts',
  approvals:'approvals','audit-log':'audit',security:'security',capabilities:'security',telegram:'telegram',
  'product-activation':'actions',integrations:'status','environment-doctor':'security',
  marketing:'status',campaigns:'work-queue',content:'drafts',brand:'status',assets:'cornermex',
  promotions:'approvals',audiences:'cornermex',calendar:'work-queue',analytics:'status',intelligence:'status',settings:'status',
};
const disabledModules=new Set<ModuleKey>(['product-activation','promotions']);
const configModules=new Set<ModuleKey>(['campaigns','analytics']);
const commercialSection:Partial<Record<ModuleKey,string>>={
  'commercial-overview':'founder-daily','commercial-accounts':'accounts',
  'commercial-opportunities':'opportunities','commercial-quotes':'quotes',
  'commercial-orders':'orders','commercial-payments':'payments',
  'commercial-fulfillment':'fulfillments','commercial-deliveries':'fulfillments',
  'commercial-exceptions':'exceptions','commercial-daily-close':'daily-closes',
};
const primitive=(value:unknown)=>['string','number','boolean'].includes(typeof value);

function DataSummary({data}:{data:Record<string,unknown>}){
  const entries=Object.entries(data).filter(([,value])=>primitive(value)||Array.isArray(value)).slice(0,18);
  if(!entries.length)return <div className="module-empty"><strong>No records available</strong><p>The API returned no safe summary fields for this module.</p></div>;
  return <div className="module-data-grid">{entries.map(([key,value])=><article className="panel module-data-card" key={key}><small>{key.replace(/([A-Z])/g,' $1')}</small><strong>{Array.isArray(value)?value.length:String(value)}</strong>{Array.isArray(value)&&value.length>0&&<p>{value.slice(0,3).map(item=>primitive(item)?String(item):primitive((item as Record<string,unknown>).status)?String((item as Record<string,unknown>).status):'record').join(' · ')}</p>}</article>)}</div>;
}

export function OperationalModulePage({moduleKey}:{moduleKey:ModuleKey}){
  const definition=moduleByKey[moduleKey];
  const [envelope,setEnvelope]=useState<FrontendEnvelope>();
  const [state,setState]=useState<FrontendDataState>(()=>unavailableState('NOT_LOADED'));
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const token=sessionStorage.getItem('cornerops-console-token')||'';
  const load=useCallback(async()=>{setLoading(true);try{const section=commercialSection[moduleKey];const result=section?await getCommercialSection(section,token):await getControlTowerFrontend(sectionByModule[moduleKey]||'status',token);setEnvelope(result);setState(disabledModules.has(moduleKey)?{...liveReadOnlyState('configuration'),status:'disabled',reasonCode:'CAPABILITY_DISABLED'}:configModules.has(moduleKey)?{...liveReadOnlyState('configuration'),status:'configuration_required',reasonCode:'MARKETING_PERSISTENCE_DEFERRED_V1_16'}:liveReadOnlyState(section?'internal_commercial_operations':moduleKey==='work-queue'?'internal_work_queue':moduleKey==='approvals'?'internal_approval_engine':moduleKey==='audit-log'?'internal_audit':'cornerops_api'));setError('');}catch(reason){setEnvelope(undefined);setState(unavailableState(reason instanceof Error&&/401|403/.test(reason.message)?'OPERATOR_AUTH_REQUIRED':'API_UNAVAILABLE'));setError(reason instanceof Error?reason.message:'Module unavailable.');}finally{setLoading(false);}},[moduleKey,token]);
  useEffect(()=>{void load()},[load]);
  const statusLabel=useMemo(()=>loading?'loading':state.status,[loading,state.status]);
  return <div className="module-page"><header className="page-title"><div><span className="eyebrow">{definition.group}</span><h1>{definition.label}</h1><p>{definition.description}</p></div><div className="module-header-actions"><StatusBadge tone={state.status==='live_read_only'?'green':state.status==='unavailable'||state.status==='error'?'red':'amber'}>{statusLabel}</StatusBadge><StatusBadge tone="blue">{state.source}</StatusBadge><button onClick={()=>void load()} disabled={loading}><RefreshCw size={14} className={loading?'spin':''}/>Refresh</button></div></header>
    <section className="panel module-boundary"><ShieldCheck size={18}/><div><strong>Read-only operational boundary</strong><p>Writes and external actions are blocked. This page never executes a capability.</p></div><StatusBadge tone="green">BLOCKED ACTIONS</StatusBadge></section>
    {error&&<section className="resource-error"><div><strong>{state.reasonCode}</strong><p>{error}</p>{state.reasonCode==='OPERATOR_AUTH_REQUIRED'&&<p>Connect the operator token in <Link to="/control-tower">Control Tower</Link>.</p>}</div><button onClick={()=>void load()}>Retry safe read</button></section>}
    {envelope&&<><div className="module-status-strip"><span>Source <strong>{envelope.sourceMode}</strong></span><span>Read only <strong>{String(envelope.readOnly)}</strong></span><span>Writes blocked <strong>{String(envelope.writesBlocked)}</strong></span><span>External sends blocked <strong>{String(envelope.externalSendsBlocked)}</strong></span><span>Approval required <strong>{String(envelope.approvalRequired)}</strong></span><span>Audit <strong>{envelope.auditId||'unavailable'}</strong></span></div>{(envelope.warnings?.length??0)>0&&<div className="dashboard-alert">{envelope.warnings.join(' · ')}</div>}<DataSummary data={envelope.data||{}}/></>}
  </div>;
}
