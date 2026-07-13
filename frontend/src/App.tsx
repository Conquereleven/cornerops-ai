import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ChatCenter } from './routes/ChatCenter';
import { Conversations } from './routes/Conversations';
import { Dashboard } from './routes/Dashboard';
import { Integrations } from './routes/Integrations';
import { Leads } from './routes/Leads';
import { Orders } from './routes/Orders';
import { Products } from './routes/Products';
import { Settings } from './routes/Settings';
import { WorkerSettings } from './routes/WorkerSettings';
import { ControlTower } from './routes/ControlTower';
import { AuthorizedSellers } from './routes/AuthorizedSellers';
import { AuthorizedSellerDetail,SellerCatalog,SellerComparison,SellerInventory } from './routes/SellerOperations';

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route path="/" element={<Dashboard />} /><Route path="/control-tower" element={<ControlTower />} /><Route path="/authorized-sellers" element={<AuthorizedSellers />} /><Route path="/authorized-sellers/:sellerId" element={<AuthorizedSellerDetail />} /><Route path="/seller-catalog" element={<SellerCatalog />} /><Route path="/seller-inventory" element={<SellerInventory />} /><Route path="/seller-comparison" element={<SellerComparison />} /><Route path="/chat" element={<ChatCenter />} /><Route path="/conversations" element={<Conversations />} /><Route path="/orders" element={<Orders />} /><Route path="/products" element={<Products />} /><Route path="/leads" element={<Leads />} /><Route path="/worker-settings" element={<WorkerSettings />} /><Route path="/integrations" element={<Integrations />} /><Route path="/settings" element={<Settings />} /></Route></Routes></BrowserRouter>;
}
