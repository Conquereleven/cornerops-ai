import { Bot, Headphones, PackageSearch, Phone, Save, ShoppingBag, TestTube2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getWorkers, sendChatMessage, updateWorker } from '../lib/api';
import type { WorkerConfig, WorkerName } from '../lib/types';

const icons = {
  supportWorker: Headphones,
  salesWorker: ShoppingBag,
  ordersWorker: PackageSearch,
  b2bWorker: Users,
  humanHandoffWorker: Bot,
  ivrWorker: Phone,
};

const testMessages: Record<WorkerName, string> = {
  supportWorker: 'Hola, necesito ayuda general',
  salesWorker: '¿Tienen Tajín disponible?',
  ordersWorker: '¿Cuál es el estado de mi orden #123?',
  b2bWorker: 'Quiero precios de mayoreo para mi restaurante',
  humanHandoffWorker: 'Quiero hablar con una persona',
  ivrWorker: 'Prueba de IVR',
};

export function WorkerSettings() {
  const [workers, setWorkers] = useState<WorkerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getWorkers()
      .then(setWorkers)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const patchLocal = (workerId: WorkerName, changes: Partial<WorkerConfig>) => {
    setWorkers((current) => current.map((worker) => worker.id === workerId ? { ...worker, ...changes } : worker));
  };

  const persist = async (worker: WorkerConfig, changes: Partial<WorkerConfig>) => {
    setBusyId(worker.id);
    setError('');
    try {
      const updated = await updateWorker(worker.id, changes);
      patchLocal(worker.id, updated);
      setNotice(`${worker.name} actualizado.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible actualizar el worker.');
    } finally {
      setBusyId(undefined);
    }
  };

  const testWorker = async (worker: WorkerConfig) => {
    setBusyId(worker.id);
    setError('');
    try {
      const result = await sendChatMessage({ userId: 'worker-test', message: testMessages[worker.id] });
      setNotice(`Prueba completada: ${result.worker} respondió en ${String(result.metadata.latencyMs || 0)} ms.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'La prueba no pudo completarse.');
    } finally {
      setBusyId(undefined);
    }
  };

  return <div>
    <div className="page-title"><div><span className="eyebrow">Configuration</span><h1>Worker Settings</h1><p>Prompts, modelos y disponibilidad conectados al backend.</p></div>{loading && <StatusBadge>Sincronizando</StatusBadge>}</div>
    {notice && <div className="form-notice">{notice}</div>}
    {error && <div className="dashboard-alert">{error}</div>}
    <div className="settings-grid">{workers.map((worker) => {
      const Icon = icons[worker.id] || Bot;
      return <article className="panel worker-config" key={worker.id}>
        <div className="config-title"><span className={`worker-orb ${!worker.enabled ? 'worker-muted' : ''}`}><Icon size={18} /></span><div><h2>{worker.name}</h2><p>{worker.description}</p></div><button aria-label={`${worker.enabled ? 'Desactivar' : 'Activar'} ${worker.name}`} className={`toggle ${worker.enabled ? 'toggle-on' : ''}`} disabled={busyId === worker.id} onClick={() => void persist(worker, { enabled: !worker.enabled })}><span /></button></div>
        <div className="config-row"><span>Estado</span><StatusBadge tone={worker.status === 'active' ? 'green' : worker.status === 'placeholder' ? 'amber' : 'neutral'}>{worker.status}</StatusBadge></div>
        <label className="config-select">Modelo<select value={worker.model} onChange={(event) => patchLocal(worker.id, { model: event.target.value })}><option value="gpt-4o-mini">gpt-4o-mini</option><option value="gpt-4o">gpt-4o</option><option value="rules">rules</option><option value="not-configured">not-configured</option></select></label>
        <label className="prompt-field">Prompt del worker<textarea value={worker.prompt} onChange={(event) => patchLocal(worker.id, { prompt: event.target.value })} /></label>
        <div className="button-row"><button className="secondary-button" disabled={busyId === worker.id} onClick={() => void testWorker(worker)}><TestTube2 size={14} /> Probar</button><button className="primary-button" disabled={busyId === worker.id} onClick={() => void persist(worker, { model: worker.model, prompt: worker.prompt })}><Save size={14} /> Guardar</button></div>
      </article>;
    })}</div>
  </div>;
}
