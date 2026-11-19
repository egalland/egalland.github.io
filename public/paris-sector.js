// Load metric geometry around a visitor-selected point, from the same IGN layers as the embedded map.
const RADIUS = 660;
const COUNT = 1000;
const LAYERS = ['batiment', 'troncon_de_route', 'surface_hydrographique', 'zone_de_vegetation'];
const CACHE_NAME = 'maille-city-ign-sectors-v1';
const CACHE_SCHEMA = 2;
const FRESH_FOR = 7 * 86400_000;
const CACHE_LIMIT = 10;
const inflight = new Map();
const memory = new Map();

const toMap = ([lon, lat]) => [(lon - 2.25) * 73190, (48.88 - lat) * 111320];
const fromMap = ([x, y]) => [2.25 + x / 73190, 48.88 - y / 111320];
const pathTypes = new Set(['Sentier', 'Escalier', 'Chemin', 'Piste cyclable']);
const motorTypes = new Set(['Autoroute', 'Bretelle', 'Type autoroutier']);
const uses = {'Résidentiel':'residential','Commercial et services':'commercial','Industriel':'industrial',
  'Religieux':'religious','Sportif':'sports','Agricole':'agricultural','Annexe':'annex'};

function rounded(points, ring=false) {
  const out = [];
  for (const pt of points) {
    const x=Math.round(pt[0]), y=Math.round(pt[1]), prev=out.at(-1);
    if (Number.isFinite(x) && Number.isFinite(y) && (!prev || prev[0]!==x || prev[1]!==y)) out.push([x,y]);
  }
  if (ring && out.length>1 && out[0][0]===out.at(-1)[0] && out[0][1]===out.at(-1)[1]) out.pop();
  return out;
}

function area(points) {
  let sum=0;
  for(let i=0,j=points.length-1;i<points.length;j=i++) sum+=points[j][0]*points[i][1]-points[i][0]*points[j][1];
  return Math.abs(sum)/2;
}

// Clip large polygons (notably the Seine) before inserting them into the local spatial indices.
function clipRing(points, bounds) {
  let clipped=points;
  for(const [axis, edge, sign] of [[0,bounds[0],1],[0,bounds[2],-1],[1,bounds[1],1],[1,bounds[3],-1]]) {
    const input=clipped; clipped=[];
    if (!input.length) break;
    let prev=input.at(-1);
    for(const curr of input) {
      const wasInside=(prev[axis]-edge)*sign>=0, inside=(curr[axis]-edge)*sign>=0;
      if(inside!==wasInside) {
        const t=(edge-prev[axis])/(curr[axis]-prev[axis]);
        clipped.push([prev[0]+t*(curr[0]-prev[0]),prev[1]+t*(curr[1]-prev[1])]);
      }
      if(inside) clipped.push(curr);
      prev=curr;
    }
  }
  return rounded(clipped,true);
}

// Keep disconnected portions of the same road as separate paths when it leaves/re-enters the sector.
function clipLine(points,b) {
  const parts=[]; let current=[];
  function finish() {const line=rounded(current);if(line.length>=2) parts.push(line);current=[];}
  for(let i=1;i<points.length;i++) {
    const a=points[i-1], z=points[i], dx=z[0]-a[0],dy=z[1]-a[1];
    let enter=0, exit=1;
    for(const [p,q] of [[-dx,a[0]-b[0]],[dx,b[2]-a[0]],[-dy,a[1]-b[1]],[dy,b[3]-a[1]]]) {
      if(p<0) enter=Math.max(enter,q/p);
      else if(p>0) exit=Math.min(exit,q/p);
      else if(q<0) {enter=2;break;}
    }
    if(exit<=enter) {finish();continue;}
    if(enter>0) finish();
    if(!current.length)current.push([a[0]+enter*dx,a[1]+enter*dy]);
    current.push([a[0]+exit*dx,a[1]+exit*dy]);
    if(exit<1)finish();
  }
  finish();return parts;
}

function projectFeatures(collections,bounds,center) {
  const buildings=[],streets=[],water=[],green=[];
  let observedHeight=0, estimatedHeight=0, undergroundRoadsOmitted=0;
  for(const [layer,features] of collections) {
    for(const feature of features) {
      const p=feature.properties || {},g=feature.geometry;
      if(!g || (p.etat_de_l_objet && p.etat_de_l_objet!=='En service'))continue;
      const baseId=String(p.cleabs || feature.id || '').replace(/^[A-Z]+0*/, '');
      if(!baseId)continue;
      if(layer==='troncon_de_route') {
        const level=Number(p.position_par_rapport_au_sol) || 0;
        if(level<0) {undergroundRoadsOmitted++;continue;}
        const importance=Number(p.importance)||6, path=pathTypes.has(p.nature);
        const kind=path?'path':motorTypes.has(p.nature)?'motorway':importance<=3?'primary':importance===4?'secondary':'residential';
        const w=Number(p.largeur_de_chaussee)>=.5?Number(p.largeur_de_chaussee):path?2.4:Math.max(4,(Number(p.nombre_de_voies)||(importance<=4?2:1))*3.35);
        const name=p.nom_voie_ban_gauche||p.nom_voie_ban_droite||p.nom_collaboratif_gauche||p.nom_collaboratif_droite||'';
        const oneway=p.sens_de_circulation==='Sens direct'?1:p.sens_de_circulation==='Sens inverse'?-1:0;
        const paths=g.type==='MultiLineString'?g.coordinates:g.type==='LineString'?[g.coordinates]:[];
        let index=0;
        for(const line of paths) for(const polyline of clipLine(line.map(toMap),bounds)) {
          const id=index?baseId+'-'+index:baseId;index++;
          streets.push({id,path:polyline,w,kind,name,level,bridge:level>0,oneway});
        }
        continue;
      }
      const polygons=g.type==='MultiPolygon'?g.coordinates:g.type==='Polygon'?[g.coordinates]:[];
      for(let i=0;i<polygons.length;i++) {
        const polygon=polygons[i];
        const rings=polygon.map(r=>layer==='batiment'?rounded(r.map(toMap),true):clipRing(r.map(toMap),bounds));
        const [poly,...inner]=rings;
        if(!poly || poly.length<3 || area(poly)<(layer==='batiment'?5:1))continue;
        const holes=inner.filter(r=>r.length>=3 && area(r)>=1);
        if(layer==='batiment'){
          const rawHeight=Number(p.hauteur),known=rawHeight>=.8&&rawHeight<=350;
          const h=known?rawHeight:Math.max(2.5,(Number(p.nombre_d_etages)||(p.usage_1==='Résidentiel'?4:2))*3);
          buildings.push({id:i?baseId+'-'+i:baseId,poly,holes,h,kind:uses[p.usage_1]||'mixed',observedHeight:known});
          if(known)observedHeight++;else estimatedHeight++;
        }else if(layer==='surface_hydrographique')water.push({poly,holes});
        else green.push({poly,holes,kind:p.nature||'Végétation'});
      }
    }
  }
  const [minX,minY,maxX,maxY]=bounds;
  // The world can use the sector axis for sampling. Keep both endpoints inside the playable area.
  const axis=[[center[0]-RADIUS*.7,center[1]],[center[0]+RADIUS*.7,center[1]]];
  if(!buildings.length&&!streets.length&&!water.length&&!green.length)throw Error('Aucune géométrie IGN disponible dans ce secteur.');
  return {buildings,streets,water,green,metadata:{
    source:'IGN • BD TOPO®',attribution:'© IGN, BD TOPO® · Licence Ouverte 2.0',
    url:'https://cartes.gouv.fr/rechercher-une-donnee/dataset/IGNF_BD-TOPO',
    license:'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',extracted:new Date().toISOString().slice(0,10),
    projection:'XY en mètres. Origine 2.25° E, 48.88° N, x vers l’est et y vers le sud.',
    radius:RADIUS,axis,mapAxis:axis,bounds,boundary:[[minX,minY],[maxX,minY],[maxX,maxY],[minX,maxY]],
    observedHeight,estimatedHeight,undergroundRoadsOmitted,
    counts:{buildings:buildings.length,streets:streets.length,water:water.length,green:green.length}
  }};
}

const FIELDS = {
  batiment:'geometrie,cleabs,usage_1,nature,hauteur,nombre_d_etages,etat_de_l_objet',
  troncon_de_route:'geometrie,cleabs,nature,etat_de_l_objet,importance,nom_voie_ban_gauche,nom_voie_ban_droite,nom_collaboratif_gauche,nom_collaboratif_droite,largeur_de_chaussee,nombre_de_voies,position_par_rapport_au_sol,prive,sens_de_circulation',
  surface_hydrographique:'geometrie,cleabs,nature,persistance',
  zone_de_vegetation:'geometrie,cleabs,nature'
};
function directURL(layer,bbox,start,format='application/json') {
  const params=new URLSearchParams({SERVICE:'WFS',VERSION:'2.0.0',REQUEST:'GetFeature',TYPENAMES:'BDTOPO_V3:'+layer,
    SRSNAME:'CRS:84',BBOX:bbox+',CRS:84',COUNT:String(COUNT),STARTINDEX:String(start),SORTBY:'cleabs',
    PROPERTYNAME:FIELDS[layer],OUTPUTFORMAT:format});
  return 'https://data.geopf.fr/wfs/ows?'+params;
}
async function pageAt(url,signal) {
  const response=await fetch(url,{signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Le service cartographique de l’IGN est indisponible ('+response.status+').');
  const page=await response.json();
  if(page.type!=='FeatureCollection'||!Array.isArray(page.features))throw Error('Réponse géographique IGN incomplète.');
  return page;
}
async function fetchLayer(layer,bbox,signal) {
  let direct=false;
  const seen=new Set(),features=[];
  for(let start=0;start<20000;start+=COUNT) {
    const params=new URLSearchParams({layer,bbox,start:String(start)});
    if(layer==='troncon_de_route')params.set('v',String(CACHE_SCHEMA));
    let page;
    if(!direct) {
      const request=new AbortController(),cancel=()=>request.abort();
      signal.addEventListener('abort',cancel,{once:true});
      if(signal.aborted)cancel();
      const timeout=setTimeout(cancel,14_000);
      try{page=await pageAt('/api/geo/ign?'+params,request.signal);}
      catch(error){if(signal.aborted)throw error;direct=true;}
      finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
    }
    if(direct) {
      try{page=await pageAt(directURL(layer,bbox,start),signal);}
      catch(error){
        if(signal.aborted)throw error;
        // Both aliases return GeoJSON. Retry the equivalent WFS representation if an upstream cached response is malformed.
        page=await pageAt(directURL(layer,bbox,start,'json'),signal);
      }
    }
    let added=0;
    for(const f of page.features) {
      const id=f.properties?.cleabs || f.id;
      if(!id||seen.has(id))continue;
      seen.add(id);features.push(f);added++;
    }
    const matched=Number(page.numberMatched ?? page.totalFeatures);
    if(page.features.length<COUNT || (Number.isFinite(matched) && start+page.features.length>=matched))return [layer,features];
    if(!added)throw Error('La pagination IGN n’a pas avancé.');
  }
  throw Error('Le secteur demandé dépasse la limite de données.');
}

async function cacheRead(key) {
  if(!globalThis.caches || !globalThis.location)return null;
  try{
    const cache=await caches.open(CACHE_NAME);
    const response=await cache.match(new URL('/__maille_geo__/'+key,location.origin));
    return response?await response.json():null;
  }catch{return null;}
}

async function cacheWrite(key,entry) {
  if(!globalThis.caches || !globalThis.location)return;
  try{
    const cache=await caches.open(CACHE_NAME),url=new URL('/__maille_geo__/'+key,location.origin);
    await cache.put(url,new Response(JSON.stringify(entry),{headers:{'content-type':'application/json'}}));
    const keys=await cache.keys();
    if(keys.length>CACHE_LIMIT)await Promise.all(keys.slice(0,keys.length-CACHE_LIMIT).map(k=>cache.delete(k)));
  }catch{/* A storage quota or privacy setting does not stop play. */}
}

async function readOrLoad(key,bounds,center) {
  const cached=memory.get(key)||await cacheRead(key);
  if(cached?.schema===CACHE_SCHEMA&&Date.now()-cached.saved<FRESH_FOR)return cached.data;
  const sw=fromMap([bounds[0],bounds[3]]),ne=fromMap([bounds[2],bounds[1]]);
  const bbox=[...sw,...ne].map(n=>n.toFixed(7)).join(',');
  const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),60_000);
  try{
    const pages=await Promise.all(LAYERS.map(layer=>fetchLayer(layer,bbox,controller.signal)));
    const data=projectFeatures(pages,bounds,center),entry={saved:Date.now(),schema:CACHE_SCHEMA,data};
    if(memory.size>=3)memory.delete(memory.keys().next().value);
    memory.set(key,entry);
    void cacheWrite(key,entry);
    return data;
  }catch(error){
    controller.abort();
    if(cached)return {...cached.data,metadata:{...cached.data.metadata,stale:true}};
    if(error?.name==='AbortError')throw Error('Le chargement du secteur IGN a dépassé une minute.');
    throw error;
  }finally{clearTimeout(deadline);}
}

export async function loadSector(lon,lat,name='') {
  lon=Number(lon);lat=Number(lat);
  if(!Number.isFinite(lon)||!Number.isFinite(lat)||lon<2.05||lon>2.67||lat<48.62||lat>49.05)
    throw Error('Choisis un secteur de Paris ou de la petite couronne.');
  const center=rounded([toMap([lon,lat])])[0], [x,y]=center;
  const bounds=[x-RADIUS,y-RADIUS,x+RADIUS,y+RADIUS];
  const key=center.join('_');
  if(!inflight.has(key))inflight.set(key,readOrLoad(key,bounds,center).finally(()=>inflight.delete(key)));
  const data=await inflight.get(key);
  return {...data,metadata:{...data.metadata,sector:{name:String(name||'Secteur francilien').slice(0,100),lon,lat,x,y}}};
}
