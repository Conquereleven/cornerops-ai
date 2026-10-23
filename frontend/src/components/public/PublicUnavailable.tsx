import { Link } from 'react-router-dom';

export function PublicUnavailable() {
  return <main className="ct-site ct-v2 ct-section"><div className="ct-width">
    <h1 tabIndex={-1}>Page unavailable</h1>
    <p>This is the CornerTech AI public website. Private workspace access is not available here.</p>
    <Link className="ct-button" to="/">Back to CornerTech AI</Link>
  </div></main>;
}
