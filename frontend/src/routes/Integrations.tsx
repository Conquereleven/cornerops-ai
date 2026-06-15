import { BarChart3, Database, Mail, MessageCircle, Mic, Phone, PlugZap, ShoppingBag, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getIntegrations, updateIntegration } from '../lib/api';
import type { Integration } from '../lib/types';

const icons = {
  openai: Sparkles,
  supabase: Database,
  whatsapp: MessageCircle,
  twilio: Phone,
  whisper: Mic,
  shopify: ShoppingBag,
  email: Mail,
  analytics: BarChart3,
};

const labels = {
  connected: 'Connected',
  not_connected: 'Not connected',
  coming_soon: 'Coming soon',
};

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [busyId, setBusyId] = useState<string>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getIntegrations().then(setIntegrations).catch((requestError) => setError(requestError.message));
  }, []);

  const toggle = async (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      setNotice(`${integration.name} está en el roadmap y aún no acepta configuración.`);
      return;
    }
    setBusyId(integration.id);
    setError('');
    try {
      const updated = await updateIntegration(integration.id, {
        status: integration.status === 'connected' ? 'not_connected' : 'connected',
      });
      setIntegrations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${integration.name}: ${labels[updated.status]}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible actualizar la integración.');
    } finally {
      setBusyId(undefined);
    }
  };

  return <div>
    <div className="page-title"><div><span className="eyebrow">Ecosystem</span><h1>Integrations</h1><p>Canales y sistemas conectados a la operación.</p></div></div>
    {notice && <div className="form-notice">{notice}</div>}
    {error && <div className="dashboard-alert">{error}</div>}
    <div className="integration-grid">{integrations.map((integration) => {
      const Icon = icons[integration.id as keyof typeof icons] || PlugZap;
      return <article className="panel integration-card" key={integration.id}><span className="integration-icon"><Icon size={22} /></span><div><h2>{integration.name}</h2><p>{integration.description}</p></div><StatusBadge tone={integration.status === 'connected' ? 'green' : integration.status === 'not_connected' ? 'amber' : 'neutral'}>{labels[integration.status]}</StatusBadge><button disabled={busyId === integration.id} className="secondary-button" onClick={() => void toggle(integration)}><PlugZap size={15} /> {integration.status === 'coming_soon' ? 'Roadmap' : integration.status === 'connected' ? 'Disconnect' : 'Connect'}</button></article>;
    })}</div>
  </div>;
}
