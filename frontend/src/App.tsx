import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuthentication, RequireWorkspaceAccess } from './auth/AuthBoundaries';
import { AppShell } from './components/layout/AppShell';
import { moduleRegistry, type ModuleKey } from './config/moduleRegistry';
import { AccessPending } from './routes/AccessPending';
import { AuthorizedSellers } from './routes/AuthorizedSellers';
import { AuthCallback } from './routes/AuthCallback';
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
import { AuthorizedSellerDetail, SellerCatalog, SellerComparison, SellerInventory } from './routes/SellerOperations';
import { Settings } from './routes/Settings';
import { WorkerSettings } from './routes/WorkerSettings';

const dedicated:Partial<Record<ModuleKey,ReactElement>>={
  overview:<Dashboard/>, 'control-tower':<ControlTower/>, 'ai-chat':<ChatCenter/>,
  orders:<Orders/>,products:<Products/>,'b2b-leads':<Leads/>,conversations:<Conversations/>,
  'authorized-sellers':<AuthorizedSellers/>,'seller-catalog':<SellerCatalog/>,'seller-inventory':<SellerInventory/>,'seller-comparison':<SellerComparison/>,
  'worker-settings':<WorkerSettings/>,integrations:<Integrations/>,settings:<Settings/>,
};

export default function App({ authClient }: { authClient?: SupabaseClient | null }){
  return <AuthProvider client={authClient}><BrowserRouter><Routes>
    <Route path="/" element={<PublicLanding/>}/>
    <Route path="/login" element={<LoginGateway/>}/>
    <Route path="/auth/callback" element={<AuthCallback/>}/>
    <Route element={<RequireAuthentication/>}>
      <Route path="/access-pending" element={<AccessPending/>}/>
      <Route element={<RequireWorkspaceAccess/>}>
        <Route path="/app" element={<Navigate to="/overview" replace/>}/>
        <Route element={<AppShell/>}>
          {moduleRegistry.map(item=><Route key={item.key} path={item.route} element={dedicated[item.key]||<OperationalModulePage moduleKey={item.key}/>}/>) }
          <Route path="/authorized-sellers/:sellerId" element={<AuthorizedSellerDetail/>}/>
          {moduleRegistry.flatMap(item=>(item.aliases||[]).map(alias=><Route key={alias} path={alias} element={<Navigate to={item.route} replace/>}/>))}
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter></AuthProvider>;
}
