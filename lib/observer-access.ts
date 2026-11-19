/** The Sites ingress authenticates the visitor and overwrites its identity headers. */
export async function canObserve(request: Request, ownerHash: string | undefined, development = false) {
  const host = new URL(request.url).hostname.toLowerCase();
  if (development && ['localhost','127.0.0.1','[::1]'].includes(host)) return true;
  if (!ownerHash || !/^[0-9a-f]{64}$/i.test(ownerHash)) return false;
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  if (!email || email.length > 254) return false;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
  return actual === ownerHash.toLowerCase();
}
