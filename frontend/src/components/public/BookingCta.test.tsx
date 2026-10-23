import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const approvedWhatsapp = 'https://wa.me/971555633651';
const approvedEmail = 'mailto:joel.escudero12@gmail.com';

async function load(bookingUrl: string | undefined) {
  vi.resetModules();
  vi.stubEnv('VITE_PUBLIC_BOOKING_URL', bookingUrl);
  vi.stubEnv('VITE_PUBLIC_WHATSAPP_NUMBER', undefined);
  vi.stubEnv('VITE_PUBLIC_CONTACT_EMAIL', undefined);
  const { siteConfig } = await import('../../config/siteConfig');
  const { CompanyAndContact } = await import('./CornerTechSite');
  return { siteConfig, CompanyAndContact };
}

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.resetModules(); });

test.each([undefined, '', '   ', 'not-a-url', 'javascript:alert(1)', 'http://booking.example.com'])
('missing or invalid booking configuration %s stays disabled', async value => {
  const { siteConfig } = await load(value);
  expect(siteConfig.bookingUrl).toBe('');
  expect(siteConfig.whatsappUrl).toBe(approvedWhatsapp);
  expect(siteConfig.signInEnabled).toBe(false);
});

test.each([undefined, '', '   ', 'not-a-url', 'javascript:alert(1)', 'http://booking.example.com'])
('without usable booking configuration %s, project discussion is primary and WhatsApp is not duplicated', async value => {
  const { CompanyAndContact } = await load(value);
  const { container } = render(<MemoryRouter><CompanyAndContact /></MemoryRouter>);
  const contact = container.querySelector('#contact');
  expect(contact).not.toBeNull();
  const scope = within(contact as HTMLElement);
  const primary = scope.getByRole('link', { name: 'Discuss a project on WhatsApp (opens in a new tab)' });
  expect(primary).toHaveAttribute('href', approvedWhatsapp);
  expect(primary).toHaveClass('ct-primary');
  expect(scope.queryByRole('link', { name: 'Book a call (opens in a new tab)' })).not.toBeInTheDocument();
  const email = scope.getByRole('link', { name: 'Email us' });
  expect(email).toHaveAttribute('href', approvedEmail);
  expect(email).not.toHaveClass('ct-primary');
  expect(contact!.querySelectorAll('.ct-primary')).toHaveLength(1);
  expect(contact!.querySelectorAll(`a[href="${approvedWhatsapp}"]`)).toHaveLength(1);
  expect(scope.getAllByRole('link')).toHaveLength(2);
});

test('a future explicitly configured HTTPS booking URL restores booking while retaining distinct contact options', async () => {
  // Reserved example domain: validates configuration/rendering only; no external booking request.
  const verifiedForTest = 'https://booking.example.com/appointments';
  const { siteConfig, CompanyAndContact } = await load(`  ${verifiedForTest}  `);
  expect(siteConfig.bookingUrl).toBe(verifiedForTest);
  const { container } = render(<MemoryRouter><CompanyAndContact /></MemoryRouter>);
  const contact = container.querySelector('#contact') as HTMLElement;
  const scope = within(contact);
  const primary = scope.getByRole('link', { name: 'Book a call (opens in a new tab)' });
  expect(primary).toHaveAttribute('href', verifiedForTest);
  expect(primary).toHaveClass('ct-primary');
  expect(scope.queryByRole('link', { name: 'Discuss a project on WhatsApp (opens in a new tab)' })).not.toBeInTheDocument();
  expect(scope.getByRole('link', { name: 'Email us' })).toHaveAttribute('href', approvedEmail);
  expect(scope.getByRole('link', { name: 'WhatsApp (opens in a new tab)' })).toHaveAttribute('href', approvedWhatsapp);
  expect(contact.querySelectorAll('.ct-primary')).toHaveLength(1);
  expect(contact.querySelectorAll(`a[href="${approvedWhatsapp}"]`)).toHaveLength(1);
});
