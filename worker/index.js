import { handleApi } from './game-api.js';
import { handleGeo } from './geo-api.js';
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname==='/api/geo/ign') return handleGeo(request);
    if (pathname.startsWith('/api/')) return handleApi(request, env);
    const asset = packedAssets[pathname === '/' ? '/index.html' : pathname];
    if (!asset) return new Response('Introuvable', {status:404});
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
    const headers = {'content-type':asset.type, 'cache-control':'no-cache',etag:asset.etag,'x-content-type-options':'nosniff','referrer-policy':'same-origin'};
    if (request.headers.get('if-none-match')===asset.etag) return new Response(null,{status:304,headers});
    if (request.method === 'HEAD') return new Response(null,{headers});
    return new Response(asset.text ?? Uint8Array.from(atob(asset.encoded), c=>c.charCodeAt(0)),{headers});
  }
};
