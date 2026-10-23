// Public identity and contact values. Every value is public by design and can
// be changed per environment through VITE_PUBLIC_* variables, so moving to a
// custom domain or a branded mailbox needs configuration, not a code change.
// Defaults are the Founder-approved public contact channels.
const value = (name: string, fallback = '') => (import.meta.env[name] as string | undefined)?.trim() || fallback;

const httpsUrl = (candidate: string) => {
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) ? url.toString().replace(/\/$/, '') : '';
  } catch { return ''; }
};

const whatsappNumber = value('VITE_PUBLIC_WHATSAPP_NUMBER', '+971 55 563 3651');

// Public launch does not activate private authentication.

export const siteConfig = {
  name: 'CornerTech AI',
  signInEnabled: false,
  /** Canonical public origin. Founder-confirmed purchased domain, verified in AEServer. */
  siteUrl: httpsUrl(value('VITE_PUBLIC_SITE_URL', 'https://cornertech.ae')),
  // Booking is opt-in: configure only a separately verified public appointment URL.
  bookingUrl: httpsUrl(value('VITE_PUBLIC_BOOKING_URL')),
  contactEmail: value('VITE_PUBLIC_CONTACT_EMAIL', 'joel@cornertech.ae'),
  whatsappNumber,
  whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '',
  linkedinUrl: httpsUrl(value('VITE_PUBLIC_LINKEDIN_URL')),
  // Legal links stay absent until real documents exist. Nothing is fabricated.
  privacyUrl: httpsUrl(value('VITE_PUBLIC_PRIVACY_URL')),
  termsUrl: httpsUrl(value('VITE_PUBLIC_TERMS_URL')),
} as const;

export const canonicalUrl = (path = '/') => (siteConfig.siteUrl ? `${siteConfig.siteUrl}${path === '/' ? '/' : path}` : '');
