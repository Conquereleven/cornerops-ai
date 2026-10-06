export const DEFAULT_AUTHENTICATED_PATH = '/app';

// Only same-origin relative paths are accepted as post-login destinations.
export function safeNextPath(value: string | null | undefined) {
  if (
    !value
    || value.length > 512
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  try {
    const resolved = new URL(value, window.location.origin);
    if (resolved.origin !== window.location.origin) return DEFAULT_AUTHENTICATED_PATH;
    // Dot segments can collapse into a protocol-relative path; refuse that too.
    if (resolved.pathname.startsWith('//')) return DEFAULT_AUTHENTICATED_PATH;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }
}

export function callbackUrl(next: string) {
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', safeNextPath(next));
  return url.toString();
}
