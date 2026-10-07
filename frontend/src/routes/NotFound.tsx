import { Link } from 'react-router-dom';
import '../styles/public.css';

// Public 404. It reveals nothing about private routes.
export function NotFound() {
  return <main className="co-public co-auth-state" aria-labelledby="not-found-title">
    <span className="co-public-eyebrow">404</span>
    <h1 id="not-found-title">Page not found</h1>
    <p>The page you asked for does not exist or has moved.</p>
    <Link className="co-public-secondary" to="/">Back to Corner Tech AI</Link>
  </main>;
}

export function AppNotFound() {
  return <div className="module-page"><header className="page-title"><div><span className="eyebrow">Corner Tech AI</span><h1>Page not found</h1><p>This workspace has no page at this address.</p></div></header><section className="panel module-empty"><Link to="/app/overview">Go to Overview</Link></section></div>;
}
