import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';

// VITE_PUBLIC_ONLY is replaced at build time, so the unused branch — and with
// it the whole workspace and auth client — is left out of that bundle.
const load = import.meta.env.VITE_PUBLIC_ONLY === 'true' ? import('./PublicApp') : import('./App');

void load.then(({ default: Root }) => {
  createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
});
