import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { API_BASE_URL, getSettings, updateSettings } from '../lib/api';
import type { WorkspaceSettings } from '../lib/types';

const emptySettings: WorkspaceSettings = {
  productName: '',
  businessName: '',
  region: '',
  languages: [],
  futureLanguages: [],
  developmentMode: false,
  operatorName: '',
};

export function Settings() {
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const patch = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      setSettings(await updateSettings(settings));
      setNotice('Configuración guardada en el backend.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return <div>
    <div className="page-title"><div><span className="eyebrow">Workspace</span><h1>Settings</h1><p>Configuración general del Command Center.</p></div>{loading && <StatusBadge>Sincronizando</StatusBadge>}</div>
    {notice && <div className="form-notice">{notice}</div>}
    {error && <div className="dashboard-alert">{error}</div>}
    <section className="panel settings-form"><div className="form-grid">
      <label>Nombre del producto<input value={settings.productName} onChange={(event) => patch('productName', event.target.value)} /></label>
      <label>Negocio<input value={settings.businessName} onChange={(event) => patch('businessName', event.target.value)} /></label>
      <label>Región<input value={settings.region} onChange={(event) => patch('region', event.target.value)} /></label>
      <label>API Base URL<input value={API_BASE_URL || window.location.origin} readOnly /></label>
      <label>Idiomas soportados<input value={settings.languages.join(', ')} onChange={(event) => patch('languages', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} /></label>
      <label>Idiomas próximos<input value={settings.futureLanguages.join(', ')} onChange={(event) => patch('futureLanguages', event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} /></label>
      <label>Founder / Operator<input value={settings.operatorName} onChange={(event) => patch('operatorName', event.target.value)} /></label>
    </div><label className="setting-check"><input type="checkbox" checked={settings.developmentMode} onChange={(event) => patch('developmentMode', event.target.checked)} /> Modo desarrollo activo</label><button className="primary-button" disabled={saving || loading} onClick={() => void save()}><Save size={15} /> {saving ? 'Guardando…' : 'Guardar configuración'}</button></section>
  </div>;
}
