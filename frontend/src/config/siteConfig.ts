// Public identity and contact values. Every value is public by design and can
// be changed per environment through VITE_PUBLIC_* variables, so moving to a
// custom domain or a branded mailbox needs configuration, not a code change.
// Defaults are the Founder-approved public contact channels (frontend/AGENTS.md).
const value = (name: string, fallback = '') => (import.meta.env[name] as string | undefined)?.trim() || fallback;

const httpsUrl = (candidate: string) => {
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) ? url.toString().replace(/\/$/, '') : '';
  } catch { return ''; }
};

const whatsappNumber = value('VITE_PUBLIC_WHATSAPP_NUMBER', '+971 55 563 3651');

// A public-only build (npm run build:public) ships the informational site with
// no workspace code, no sign-in and no backend dependency.
export const publicOnly = import.meta.env.VITE_PUBLIC_ONLY === 'true';

export const siteConfig = {
  name: 'CornerTech AI',
  signInEnabled: !publicOnly,
  /** Canonical public origin. Empty until a domain is chosen; then canonical/OG URLs are emitted. */
  siteUrl: httpsUrl(value('VITE_PUBLIC_SITE_URL')),
  bookingUrl: httpsUrl(value('VITE_PUBLIC_BOOKING_URL', 'https://calendar.app.google/1KYnZsKuFbbGj2Ha8')),
  contactEmail: value('VITE_PUBLIC_CONTACT_EMAIL', 'joel.escudero12@gmail.com'),
  whatsappNumber,
  whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '',
  linkedinUrl: httpsUrl(value('VITE_PUBLIC_LINKEDIN_URL')),
  // Legal links stay absent until real documents exist. Nothing is fabricated.
  privacyUrl: httpsUrl(value('VITE_PUBLIC_PRIVACY_URL')),
  termsUrl: httpsUrl(value('VITE_PUBLIC_TERMS_URL')),
} as const;

export const canonicalUrl = (path = '/') => (siteConfig.siteUrl ? `${siteConfig.siteUrl}${path === '/' ? '/' : path}` : '');
