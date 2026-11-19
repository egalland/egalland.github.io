const json=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/state'){
   if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
   return json(seed);

  }
  let asset=assets[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('Introuvable',{status:404});
  return new Response(Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers:{'content-type':asset.mime,'cache-control':'private, no-cache','x-content-type-options':'nosniff'}});
 }
}
