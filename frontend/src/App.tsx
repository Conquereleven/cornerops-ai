import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, type ReactElement } from 'react';
import { AppShell } from './components/layout/AppShell';
import { moduleRegistry, type ModuleKey } from './config/moduleRegistry';
import { AuthorizedSellers } from './routes/AuthorizedSellers';
import { ChatCenter } from './routes/ChatCenter';
import { Conversations } from './routes/Conversations';
import { ControlTower } from './routes/ControlTower';
import { Dashboard } from './routes/Dashboard';
import { Integrations } from './routes/Integrations';
import { Leads } from './routes/Leads';
import { OperationalModulePage } from './routes/OperationalModulePage';
import { Orders } from './routes/Orders';
import { Products } from './routes/Products';
import { SellerCatalog, SellerComparison, SellerInventory, AuthorizedSellerDetail } from './routes/SellerOperations';
import { Settings } from './routes/Settings';
import { WorkerSettings } from './routes/WorkerSettings';

const dedicated:Partial<Record<ModuleKey,ReactElement>>={
  overview:<Dashboard/>, 'control-tower':<ControlTower/>, 'ai-chat':<ChatCenter/>,
  orders:<Orders/>,products:<Products/>,'b2b-leads':<Leads/>,conversations:<Conversations/>,
  'authorized-sellers':<AuthorizedSellers/>,'seller-catalog':<SellerCatalog/>,'seller-inventory':<SellerInventory/>,'seller-comparison':<SellerComparison/>,
  'worker-settings':<WorkerSettings/>,integrations:<Integrations/>,settings:<Settings/>,
};
// CO-UX-1.1 CornerGlass: DEVELOPMENT-ONLY design preview. The dynamic import lives inside the
// `import.meta.env.DEV` branch, so a production build (DEV === false) dead-code-eliminates it and
// emits no CornerGlass JS/CSS chunk. It is also rendered OUTSIDE AppShell and absent from
// moduleRegistry. No production/backend flag is involved.
const CornerGlassPreview=import.meta.env.DEV?lazy(()=>import('./routes/CornerGlassPreview')):null;
export default function App(){return <BrowserRouter><Routes>{import.meta.env.DEV&&CornerGlassPreview?<Route path="/design/cornerglass-preview" element={<Suspense fallback={<div style={{padding:24,color:'#8190a0'}}>Loading CornerGlass preview…</div>}><CornerGlassPreview/></Suspense>}/>:null}<Route element={<AppShell/>}>{moduleRegistry.map(item=><Route key={item.key} path={item.route} element={dedicated[item.key]||<OperationalModulePage moduleKey={item.key}/>}/>)}<Route path="/authorized-sellers/:sellerId" element={<AuthorizedSellerDetail/>}/>{moduleRegistry.flatMap(item=>(item.aliases||[]).map(alias=><Route key={alias} path={alias} element={<Navigate to={item.route} replace/>}/>))}<Route path="*" element={<Navigate to="/overview" replace/>}/></Route></Routes></BrowserRouter>}
