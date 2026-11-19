import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { GET, write } from './dist/api.mjs';

process.umask(0o077);
const loginCode = randomBytes(24).toString('base64url');
const session = randomBytes(32).toString('base64url');
const safeEqual = (a,b) => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.glb':'model/gltf-binary','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const send = (res, status, body, type='text/plain; charset=utf-8') => {res.writeHead(status,{'Content-Type':type});res.end(body);};
let queue=Promise.resolve();
async function body(req) {
  const chunks=[]; let size=0;
  for await (const chunk of req) {
    size+=chunk.length;
    if (size>131072) throw new Error('Taille de requête dépassée.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
const server=http.createServer(async(req,res)=>{
  const port=server.address().port, origin='http://127.0.0.1:'+port;
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; frame-ancestors 'self'; base-uri 'none'");
  if(req.headers.host!=='127.0.0.1:'+port || (req.method==='POST' && req.headers.origin!==origin)) return send(res,403,'Origine locale requise.');
  try {
    const path=decodeURIComponent(new URL(req.url,origin).pathname);
    if(path==='/session' && req.method==='POST'){
      const {code}=JSON.parse(await body(req));
      if(!safeEqual(code,loginCode)) return send(res,403,'Code invalide.');
      res.setHeader('Set-Cookie','bodyos_session='+session+'; HttpOnly; SameSite=Strict; Path=/');
      return send(res,200,'OK');
    }
    if(path==='/api/bodyos'){
      const credential=req.headers.cookie?.split(/;\s*/).find(x=>x.startsWith('bodyos_session='))?.slice(15);
      if(!safeEqual(credential,session)) return send(res,401,'Ouvrez le lien affiché au démarrage.');
      if(!['GET','POST'].includes(req.method)) return send(res,405,'Méthode indisponible.');
      const input=req.method==='POST'?await body(req):null;
      const handle=()=>input===null?GET():write(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:input}));
      const pending=queue.then(handle);queue=pending.catch(()=>{});
      const response=await pending;
      return send(res,response.status,Buffer.from(await response.arrayBuffer()),'application/json; charset=utf-8');
    }
    if(req.method!=='GET' && req.method!=='HEAD') return send(res,405,'Méthode indisponible.');
    const atlas=path.startsWith('/bodyos-anatomy/'),root=resolve(atlas?'public/bodyos-anatomy':'dist');
    if(!atlas && !['/','/index.html','/app.js','/style.css'].includes(path)) return send(res,404,'Fichier introuvable.');
    const file=resolve(root,atlas?path.slice('/bodyos-anatomy/'.length):path==='/'?'index.html':path.slice(1));
    if(!file.startsWith(root+sep)) return send(res,404,'Fichier introuvable.');
    let content;try{content=await readFile(file);}catch{return send(res,404,'Fichier introuvable.');}
    return send(res,200,req.method==='HEAD'?'':content,mime[extname(file)]??'application/octet-stream');
  }catch{return send(res,400,'La requête locale n’a pas pu être traitée.');}
});
server.listen(Number(process.env.PORT??8787),'127.0.0.1',()=>{
  console.log('BodyOS local : http://127.0.0.1:'+server.address().port+'/#code='+loginCode);
});
