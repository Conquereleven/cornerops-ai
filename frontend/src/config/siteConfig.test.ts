import { afterEach, describe, expect, test, vi } from 'vitest';

const load = async (env: Record<string, string>) => {
  vi.resetModules();
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value));
  return import('./siteConfig');
};

afterEach(() => vi.unstubAllEnvs());

describe('siteConfig', () => {
  test('works without any configuration and emits no canonical URL or legal links', async () => {
    const { canonicalUrl, siteConfig } = await load({});
    expect(siteConfig.siteUrl).toBe('');
    expect(canonicalUrl('/')).toBe('');
    expect(siteConfig.privacyUrl).toBe('');
    expect(siteConfig.termsUrl).toBe('');
    expect(siteConfig.bookingUrl).toMatch(/^https:\/\//);
    expect(siteConfig.whatsappUrl).toMatch(/^https:\/\/wa\.me\/\d+$/);
  });

  test('a domain and branded mailbox are configuration only', async () => {
    const { canonicalUrl, siteConfig } = await load({
      VITE_PUBLIC_SITE_URL: 'https://example.test/', VITE_PUBLIC_CONTACT_EMAIL: 'hello@example.test', VITE_PUBLIC_WHATSAPP_NUMBER: '+000 11 222 3333',
    });
    expect(siteConfig.siteUrl).toBe('https://example.test');
    expect(canonicalUrl('/')).toBe('https://example.test/');
    expect(siteConfig.contactEmail).toBe('hello@example.test');
    expect(siteConfig.whatsappUrl).toBe('https://wa.me/000112223333');
  });

  test('non-HTTPS or malformed URLs are dropped', async () => {
    const { siteConfig } = await load({ VITE_PUBLIC_SITE_URL: 'javascript:alert(1)', VITE_PUBLIC_PRIVACY_URL: 'http://insecure.example/privacy', VITE_PUBLIC_BOOKING_URL: 'not a url' });
    expect(siteConfig.siteUrl).toBe('');
    expect(siteConfig.privacyUrl).toBe('');
    expect(siteConfig.bookingUrl).toBe('');
  });
});
