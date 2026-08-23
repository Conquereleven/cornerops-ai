export const DEFAULT_AUTHENTICATED_PATH = '/overview';

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  return value;
}

export function callbackUrl(next: string) {
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', safeNextPath(next));
  return url.toString();
}
