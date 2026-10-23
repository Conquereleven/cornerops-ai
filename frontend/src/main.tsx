import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import PublicApp from './PublicApp';
import './styles/globals.css';

const container = document.getElementById('root')!;
const app = <StrictMode><PublicApp /></StrictMode>;
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
