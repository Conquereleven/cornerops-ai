import { describe, expect, test } from 'vitest';
import { callbackUrl, safeNextPath } from './routeSecurity';

describe('safeNextPath', () => {
  test('keeps same-origin relative paths', () => {
    expect(safeNextPath('/app/sales')).toBe('/app/sales');
    expect(safeNextPath('/app/sales/accounts/abc?tab=1#top')).toBe('/app/sales/accounts/abc?tab=1#top');
  });

  test.each([
    null, undefined, '', 'https://evil.example/app', '//evil.example', '/\\evil.example', '\\\\evil.example',
    'javascript:alert(1)', 'app/sales', ' /app', '/app\n//evil.example', '/\t/evil.example', `/${'a'.repeat(600)}`,
    'http://localhost:3000@evil.example', 'data:text/html,x',
  ])('rejects %s', (value) => {
    expect(safeNextPath(value as string)).toBe('/app');
  });

  test('normalises dot segments without leaving the origin', () => {
    expect(safeNextPath('/app/../../login')).toBe('/login');
    expect(safeNextPath('/..//evil.example')).toBe('/app');
    expect(safeNextPath('/app/..//evil.example')).toBe('/app');
  });

  test('callback URL is always on this origin with a safe next', () => {
    const url = new URL(callbackUrl('https://evil.example'));
    expect(url.origin).toBe(window.location.origin);
    expect(url.pathname).toBe('/auth/callback');
    expect(url.searchParams.get('next')).toBe('/app');
  });
});
