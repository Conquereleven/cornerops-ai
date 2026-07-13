import { Link } from 'react-router-dom';
import { OperationalModulePage } from './OperationalModulePage';

const preservedCapabilities=[
  {key:'Founder Beta Readiness',label:'Founder Beta Readiness',to:'/environment-doctor'},
  {key:'ApprovalCenter',label:'Approval Center',to:'/approvals'},
  {key:'AuditViewer',label:'Audit Viewer',to:'/audit-log'},
  {key:'Security Dashboard',label:'Security Dashboard',to:'/security'},
  {key:'OperatorAskPanel',label:'Operator Ask',to:'/ai-chat'},
  {key:'Controlled actions',label:'Controlled actions',to:'/product-activation'},
];
export function ControlTower(){return <><OperationalModulePage moduleKey="control-tower"/><section className="panel control-tower-links"><h2>First-class governance modules</h2><p>Control Tower is the executive summary; durable capabilities remain independently addressable.</p><div><Link to="/work-queue">Work Queue</Link>{preservedCapabilities.map(item=><Link key={item.key} to={item.to}>{item.label}</Link>)}<Link to="/telegram">Telegram</Link></div></section></>}
