import './build.mjs';
import {DatabaseSync} from 'node:sqlite';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import worker from './dist/server/index.js';
const db=new DatabaseSync(process.env.RELIQUAIRE_DB||'.preview.sqlite');
if(!db.prepare("SELECT name FROM sqlite_master WHERE name='players'").get())db.exec(readFileSync('drizzle/0000_castles.sql','utf8'));
const DB={
  prepare(sql){
    const query=db.prepare(sql);
    return {bind(...args){
      return {
        first:async()=>query.get(...args),
        all:async()=>({results:query.all(...args)}),
        run:async()=>({meta:query.run(...args)})
      };
    }};
  }
};
const port=Number(process.env.PORT||process.argv[process.argv.indexOf('--port')+1])||4173;
createServer(async(req,res)=>{try{const data=[];for await(const chunk of req)data.push(chunk);const request=new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,body:data.length?Buffer.concat(data):undefined});const response=await worker.fetch(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end()}}).listen(port,'0.0.0.0');
