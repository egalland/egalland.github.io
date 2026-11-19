import {selectSectorTerrain} from './terrain-height.js';
import {bundledSectors} from './sector-crossing.js';
// One coordinate system for the embedded historic axis and every on-demand neighbourhood.
const offlineMaps='maille-city-bundled-sectors-v1';
async function offlinePreset(key){
  const url='/sector-'+key+'.gz';
  let cache;
  try{if(globalThis.caches)cache=await caches.open(offlineMaps);}
  catch{/* The browser can still download the archive directly. */}
  const saved=await cache?.match(url).catch(()=>null);
  if(saved)return saved;
  const response=await fetch(url);
  if(!response.ok)throw Error('Secteur indisponible');
  if(cache)try{await cache.put(url,response.clone());}catch{}
  return response;
}
async function readPreset(key) {
  const response=await offlinePreset(key);
  const unzipped=response.body.pipeThrough(new DecompressionStream('gzip'));
  const d=await new Response(unzipped).json();
  return {
    metadata:{...d.metadata,sector:{...d.metadata.sector,preset:key}},
    buildings:d.buildings.map(([id,poly,h,kind,holes,observed])=>({id,poly,h,kind,holes:holes||[],observedHeight:!!observed})),
    streets:d.streets.map(([id,path,w,kind,name,level,oneway=0])=>({id,path,w,kind,name,level,bridge:level>0,oneway})),
    water:d.water.map(([poly,holes])=>({poly,holes})),
    green:d.green.map(([poly,holes,kind])=>({poly,holes,kind}))
  };
}
async function loadData(lon,lat,name){
  if(!Number.isFinite(lon)||!Number.isFinite(lat))throw Error('Coordonnées géographiques invalides.');
  const preset=bundledSectors.find(p=>Math.abs(p.lon-lon)<.00002&&Math.abs(p.lat-lat)<.00002);
  if(preset && typeof DecompressionStream!=='undefined'){
    try{return await readPreset(preset.key);}catch{/* A live IGN extraction can replace a missing archive. */}
  }
  const {loadSector}=await import('./paris-sector.js');
  return loadSector(lon,lat,name);
}
export async function preloadTravelSector({key,lon,lat,name}){
  if(key==='core'){
    // Warm the static module without changing the current terrain.
    await import('./paris-core.js');
    return;
  }
  await loadData(lon,lat,name);
}
async function selectData(){
  const q=typeof location==='undefined'?null:new URLSearchParams(location.search);
  if(!q?.has('lon')||!q.has('lat'))return import('./paris-core.js');
  const lon=Number(q.get('lon')),lat=Number(q.get('lat'));
  const name=String(q.get('lieu')||'Grand Paris').slice(0,70);
  const info=typeof document==='undefined'?null:document.getElementById('loadingText');
  if(info)info.textContent='Chargement de '+name+'…';
  return loadData(lon,lat,name);
}
const data=await selectData();
selectSectorTerrain(data.relief);
export const {buildings,streets,water,green,metadata}=data;
