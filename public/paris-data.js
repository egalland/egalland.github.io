import {selectSectorTerrain} from './terrain-height.js';
// One coordinate system for the embedded historic axis and every on-demand neighbourhood.
const presets=[
  ['eiffel',2.29232,48.85935],['notre-dame',2.34790,48.85348],['sacre-coeur',2.34318,48.88480]
];
async function readPreset(key) {
  const response=await fetch('/sector-'+key+'.gz');
  if(!response.ok)throw Error('Secteur indisponible');
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
async function selectData(){
  const q=typeof location==='undefined'?null:new URLSearchParams(location.search);
  if(!q?.has('lon')||!q.has('lat'))return import('./paris-core.js');
  const lon=Number(q.get('lon')),lat=Number(q.get('lat'));
  if(!Number.isFinite(lon)||!Number.isFinite(lat))throw Error('Coordonnées géographiques invalides.');
  const name=String(q.get('lieu')||'Grand Paris').slice(0,70);
  const info=typeof document==='undefined'?null:document.getElementById('loadingText');
  if(info)info.textContent='Chargement de '+name+'…';
  const preset=presets.find(([,x,y])=>Math.abs(x-lon)<.00002&&Math.abs(y-lat)<.00002);
  if(preset && typeof DecompressionStream!=='undefined'){
    try{return await readPreset(preset[0]);}catch{/* A live IGN extraction can replace a missing archive. */}
  }
  const {loadSector}=await import('./paris-sector.js');
  return loadSector(lon,lat,name);
}
const data=await selectData();
selectSectorTerrain(data.relief);
export const {buildings,streets,water,green,metadata}=data;
