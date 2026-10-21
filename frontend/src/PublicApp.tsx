import { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { PublicLanding } from './routes/PublicLanding';

function Unavailable() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return <main className="ct-site ct-section"><div className="ct-width">
    <h1>Page unavailable</h1>
    <p>This is the CornerTech AI public website. Private workspace access is not available here.</p>
    <Link className="ct-button" to="/">Back to CornerTech AI</Link>
  </div></main>;
}

// Release A has no private module imports, authentication client or API calls.
// Existing backend routes and the separate legacy App source remain unchanged.
export default function PublicApp() {
  useEffect(() => {
    // Client-side companion redirect keeps the existing backend untouched.
    // Railway must separately verify and provision TLS for both hostnames.
    if (window.location.hostname === 'www.cornertech.ae') {
      window.location.replace(`https://cornertech.ae${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
  }, []);
  return <BrowserRouter><Routes>
    <Route path="/" element={<PublicLanding />} />
    <Route path="*" element={<Unavailable />} />
  </Routes></BrowserRouter>;
}
