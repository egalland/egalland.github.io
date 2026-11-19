import { env } from "cloudflare:workers";
import { FeedError } from "./rss";

const apiRoot = "https://api.letterboxd.com/api/v0/";
const bindings = env as {
  LETTERBOXD_CLIENT_ID?: string;
  LETTERBOXD_CLIENT_SECRET?: string;
};

export function letterboxdConfigured(): boolean {
  return Boolean(bindings.LETTERBOXD_CLIENT_ID && bindings.LETTERBOXD_CLIENT_SECRET);
}

type AccessToken = { value: string; refreshAt: number };
// Store only completed tokens. Pending fetches belong to the Worker request that started them.
let cachedToken: AccessToken | undefined;

function denied() {
  return new FeedError(503, "api_access_denied", "Letterboxd refuse l’accès de ce site à l’historique complet.");
}

function invalidResponse() {
  return new FeedError(502, "invalid_api_response", "Letterboxd a renvoyé une réponse illisible. Réessayez dans un moment.");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw invalidResponse();
  }
}

function checkStatus(response: Response) {
  if (response.ok) return;
  if (response.status === 429) throw new FeedError(429, "rate_limited", "Letterboxd reçoit trop de demandes. Réessayez dans un moment.");
  if (response.status === 401 || response.status === 403) throw denied();
  if (response.status === 404 || response.status === 410) throw new FeedError(404, "not_found", "Ce profil est introuvable ou inaccessible via l’API Letterboxd.");
  throw new FeedError(502, "upstream_error", "L’API Letterboxd est temporairement indisponible.");
}

async function getToken(signal: AbortSignal): Promise<AccessToken> {
  const clientId = bindings.LETTERBOXD_CLIENT_ID;
  const secret = bindings.LETTERBOXD_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new FeedError(503, "api_unconfigured", "L’accès à l’historique complet par pseudo n’est pas activé sur ce site.");
  }
  if (cachedToken && Date.now() < cachedToken.refreshAt) return cachedToken;
  const response = await fetch(apiRoot + "auth/token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: secret }),
    redirect: "error",
    signal,
  });
  if (response.status === 400) throw denied();
  checkStatus(response);
  const data = await readJson(response);
  if (!data || typeof data !== "object" || !("access_token" in data) ||
      typeof data.access_token !== "string" || !data.access_token || /[\r\n]/.test(data.access_token) ||
      !("expires_in" in data) || typeof data.expires_in !== "number" ||
      !Number.isFinite(data.expires_in) || data.expires_in <= 0) throw invalidResponse();
  const lifetime = data.expires_in * 1000;
  cachedToken = { value: data.access_token, refreshAt: Date.now() + lifetime - Math.min(30_000, lifetime / 10) };
  return cachedToken;
}

export async function letterboxdGet(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<unknown> {
  const endpoint = path.replace(/^\//, "");
  if (!/^(?:search|films|log-entries|member\/[A-Za-z0-9]+)$/.test(endpoint)) throw invalidResponse();
  const url = new URL(endpoint, apiRoot);
  url.search = params.toString();
  const timeout = AbortSignal.timeout(18_000);
  const effectiveSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const send = (token: AccessToken) => fetch(url, {
    headers: { Accept: "application/json", Authorization: "Bearer " + token.value },
    redirect: "error",
    signal: effectiveSignal,
  });
  try {
    let token = await getToken(effectiveSignal);
    let response = await send(token);
    // An upstream revocation can precede expires_in. Retry once for this read.
    if (response.status === 401) {
      await response.body?.cancel();
      if (cachedToken === token) cachedToken = undefined;
      token = await getToken(effectiveSignal);
      response = await send(token);
    }
    checkStatus(response);
    return await readJson(response);
  } catch (error) {
    if (effectiveSignal.aborted) throw new FeedError(504, "timeout", "La lecture de l’historique a été interrompue.");
    if (error instanceof FeedError) throw error;
    throw new FeedError(502, "network", "Impossible de joindre l’API Letterboxd.");
  }
}
