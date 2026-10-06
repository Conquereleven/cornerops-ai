import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedWorkspaceRoute, RequireAuthentication, RequireRole } from './auth/AuthBoundaries';
import { AppShell } from './components/layout/AppShell';
import { moduleRegistry, modulePath, type ModuleKey } from './config/moduleRegistry';
import { AccessPending } from './routes/AccessPending';
import { AuthCallback } from './routes/AuthCallback';
import { AuthorizedSellers } from './routes/AuthorizedSellers';
import { ChatCenter } from './routes/ChatCenter';
import { CompanyOverview } from './routes/CompanyOverview';
import { Conversations } from './routes/Conversations';
import { ControlTower } from './routes/ControlTower';
import { Dashboard } from './routes/Dashboard';
import { Integrations } from './routes/Integrations';
import { Leads } from './routes/Leads';
import { LoginGateway } from './routes/LoginGateway';
import { AppNotFound, NotFound } from './routes/NotFound';
import { OperationalModulePage } from './routes/OperationalModulePage';
import { Orders } from './routes/Orders';
import { Products } from './routes/Products';
import { PublicLanding } from './routes/PublicLanding';
import { Sales } from './routes/Sales';
import { SalesAccount } from './routes/SalesAccount';
import { AuthorizedSellerDetail, SellerCatalog, SellerComparison, SellerInventory } from './routes/SellerOperations';
import { Settings } from './routes/Settings';
import { WorkerSettings } from './routes/WorkerSettings';

const dedicated:Partial<Record<ModuleKey,ReactElement>>={
  overview:<CompanyOverview/>, sales:<Sales/>, 'control-tower':<ControlTower/>, 'ai-chat':<ChatCenter/>,
  'commerce-overview':<Dashboard/>, orders:<Orders/>,products:<Products/>,'b2b-leads':<Leads/>,conversations:<Conversations/>,
  'authorized-sellers':<AuthorizedSellers/>,'seller-catalog':<SellerCatalog/>,'seller-inventory':<SellerInventory/>,'seller-comparison':<SellerComparison/>,
  'worker-settings':<WorkerSettings/>,integrations:<Integrations/>,settings:<Settings/>,
};

// Pre-consolidation URLs keep working, but only as redirects that sit inside
// the same guard as the canonical /app route.
function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}
function LegacySellerRedirect() {
  const { sellerId = '' } = useParams();
  return <Navigate to={`${modulePath('authorized-sellers')}/${encodeURIComponent(sellerId)}`} replace />;
}

export default function App({ authClient }: { authClient?: SupabaseClient | null }){
  return <AuthProvider client={authClient}><BrowserRouter><Routes>
    {/* Public */}
    <Route path="/" element={<PublicLanding/>}/>
    <Route path="/login" element={<LoginGateway/>}/>
    <Route path="/auth/callback" element={<AuthCallback/>}/>
    {/* Identity only */}
    <Route element={<RequireAuthentication/>}>
      <Route path="/access-pending" element={<AccessPending/>}/>
    </Route>
    {/* Private workspace: identity + server-verified membership */}
    <Route element={<ProtectedWorkspaceRoute/>}>
      <Route path="/app" element={<Navigate to={modulePath('overview')} replace/>}/>
      <Route element={<AppShell/>}>
        {moduleRegistry.map(item=><Route key={item.key} path={item.route} element={<RequireRole role={item.minRole}>{dedicated[item.key]||<OperationalModulePage moduleKey={item.key}/>}</RequireRole>}/>)}
        <Route path={`${modulePath('sales')}/accounts/:accountId`} element={<SalesAccount/>}/>
        <Route path={`${modulePath('authorized-sellers')}/:sellerId`} element={<AuthorizedSellerDetail/>}/>
        <Route path="/app/*" element={<AppNotFound/>}/>
      </Route>
      {moduleRegistry.flatMap(item=>item.legacyRoutes.map(legacy=><Route key={legacy} path={legacy} element={<LegacyRedirect to={item.route}/>}/>))}
      <Route path="/authorized-sellers/:sellerId" element={<LegacySellerRedirect/>}/>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes></BrowserRouter></AuthProvider>;
}
