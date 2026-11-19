// Only the four public IGN vector layers used to construct a local game sector are exposed.
const fieldsByLayer = new Map([
  ['batiment','geometrie,cleabs,usage_1,nature,hauteur,nombre_d_etages,etat_de_l_objet'],
  ['troncon_de_route','geometrie,cleabs,nature,etat_de_l_objet,importance,nom_voie_ban_gauche,nom_voie_ban_droite,nom_collaboratif_gauche,nom_collaboratif_droite,largeur_de_chaussee,nombre_de_voies,position_par_rapport_au_sol,prive'],
  ['surface_hydrographique','geometrie,cleabs,nature,persistance'],
  ['zone_de_vegetation','geometrie,cleabs,nature']
]);
export async function handleGeo(request, fetchIGN=fetch) {
  if(request.method!=='GET') return new Response(null,{status:405,headers:{allow:'GET'}});
  const q=new URL(request.url).searchParams, layer=q.get('layer');
  const rawBounds=(q.get('bbox')||'').split(',');
  if(!fieldsByLayer.has(layer)||rawBounds.length!==4||rawBounds.some(v=>!/^\d+(?:\.\d+)?$/.test(v))) return new Response('Secteur incorrect',{status:400});
  const [w,s,e,n]=rawBounds.map(Number), start=Number(q.get('start')||0);
  if(w<2.04||e>2.68||s<48.61||n>49.06||e<=w||n<=s||e-w>.023||n-s>.015||
     !Number.isInteger(start)||start<0||start>19000||start%1000) return new Response('Secteur hors limites',{status:400});
  const upstream=new URL('https://data.geopf.fr/wfs/ows');
  upstream.search=new URLSearchParams({SERVICE:'WFS',VERSION:'2.0.0',REQUEST:'GetFeature',TYPENAMES:'BDTOPO_V3:'+layer,
    SRSNAME:'CRS:84',BBOX:[w,s,e,n,'CRS:84'].join(','),COUNT:'1000',STARTINDEX:String(start),SORTBY:'cleabs',
    PROPERTYNAME:fieldsByLayer.get(layer),OUTPUTFORMAT:'application/json'});
  try {
    const result=await fetchIGN(upstream.href,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(18000),
      cf:{cacheEverything:true,cacheTtl:86400}});
    if(!result.ok||!result.headers.get('content-type')?.toLowerCase().includes('json')) return new Response('Données IGN temporairement indisponibles',{status:503});
    return new Response(result.body,{headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=86400','x-content-type-options':'nosniff'}});
  }catch{return new Response('Service IGN temporairement indisponible',{status:503});}
}
