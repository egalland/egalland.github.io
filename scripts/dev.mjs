import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { handleApi } from '../worker/game-api.js';
import { handleGeo } from '../worker/geo-api.js';
import { localDatabase } from './local-db.mjs';

const env={DB:localDatabase()};
const contentType={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon','.gz':'application/octet-stream'};
const publicDir=new URL('../public/',import.meta.url);
const args=process.argv.slice(2);
const portFlag=args.indexOf('--port');
const port=Number(args.find(s=>s.startsWith('--port='))?.slice(7) ??
  (portFlag<0 ? undefined : args[portFlag+1]) ?? process.env.PORT ?? 5173);
if (!Number.isInteger(port) || port<1 || port>65535) throw Error('Port invalide');

const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const chunks=[];let size=0;
      for await (const chunk of req) {
        size+=chunk.length;
        if (size>32_000) {res.writeHead(413);res.end();return;}
        chunks.push(chunk);
      }
      const init={method:req.method,headers:req.headers};
      if (req.method!=='GET' && req.method!=='HEAD') init.body=Buffer.concat(chunks);
      const request=new Request(url,init);
      const result=url.pathname==='/api/geo/ign'?await handleGeo(request):await handleApi(request,env);
      res.writeHead(result.status,Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));return;
    }
    if (req.method!=='GET' && req.method!=='HEAD') {res.writeHead(405);res.end();return;}
    const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
    if (!/^[a-zA-Z0-9][\w.-]*$/.test(file)) {res.writeHead(404);res.end();return;}
    const bytes=await readFile(new URL(file,publicDir));
    res.writeHead(200,{'content-type':contentType[extname(file)]||'application/octet-stream',
      'cache-control':'no-store','x-content-type-options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:bytes);
  } catch(error) {
    const missing=error?.code==='ENOENT';
    if (!missing) console.error(error);
    if (!res.headersSent) res.writeHead(missing?404:500);
    res.end();
  }
});
server.listen(port,'0.0.0.0',()=>console.log('Maille City preview listening on http://localhost:'+port));
