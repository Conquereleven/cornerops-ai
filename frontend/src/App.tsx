import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AppShell } from './components/layout/AppShell';
import { moduleRegistry, type ModuleKey } from './config/moduleRegistry';
import { AuthorizedSellers } from './routes/AuthorizedSellers';
import { ChatCenter } from './routes/ChatCenter';
import { Conversations } from './routes/Conversations';
import { ControlTower } from './routes/ControlTower';
import { Dashboard } from './routes/Dashboard';
import { Integrations } from './routes/Integrations';
import { Leads } from './routes/Leads';
import { LoginGateway } from './routes/LoginGateway';
import { OperationalModulePage } from './routes/OperationalModulePage';
import { Orders } from './routes/Orders';
import { Products } from './routes/Products';
import { PublicLanding } from './routes/PublicLanding';
import { SellerCatalog, SellerComparison, SellerInventory, AuthorizedSellerDetail } from './routes/SellerOperations';
import { Settings } from './routes/Settings';
import { WorkerSettings } from './routes/WorkerSettings';

const dedicated:Partial<Record<ModuleKey,ReactElement>>={
  overview:<Dashboard/>, 'control-tower':<ControlTower/>, 'ai-chat':<ChatCenter/>,
  orders:<Orders/>,products:<Products/>,'b2b-leads':<Leads/>,conversations:<Conversations/>,
  'authorized-sellers':<AuthorizedSellers/>,'seller-catalog':<SellerCatalog/>,'seller-inventory':<SellerInventory/>,'seller-comparison':<SellerComparison/>,
  'worker-settings':<WorkerSettings/>,integrations:<Integrations/>,settings:<Settings/>,
};

export default function App(){
  return <BrowserRouter><Routes>
    <Route path="/" element={<PublicLanding/>}/>
    <Route path="/login" element={<LoginGateway/>}/>
    <Route path="/app" element={<Navigate to="/overview" replace/>}/>
    <Route element={<AppShell/>}>
      {moduleRegistry.map(item=><Route key={item.key} path={item.route} element={dedicated[item.key]||<OperationalModulePage moduleKey={item.key}/>}/>)}
      <Route path="/authorized-sellers/:sellerId" element={<AuthorizedSellerDetail/>}/>
      {moduleRegistry.flatMap(item=>(item.aliases||[]).map(alias=><Route key={alias} path={alias} element={<Navigate to={item.route} replace/>}/>))}
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>;
}
