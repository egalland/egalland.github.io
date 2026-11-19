import {areas} from './atlas-outlines.js';

const departments={'75':'Paris','92':'Hauts-de-Seine','93':'Seine-Saint-Denis','94':'Val-de-Marne'};
const colors={'75':'#c3a58f','92':'#7faaa1','93':'#a69eb3','94':'#a3a98a'};
const places=[
  {name:'Tour Eiffel',lon:2.29232,lat:48.85935},
  {name:'Notre-Dame de Paris',lon:2.34790,lat:48.85348},
  {name:'Sacré-Cœur',lon:2.34318,lat:48.88480}
];
const referenceTowns=[
  ['Nanterre','92050'],['Saint-Denis','93066'],['Aulnay','93005'],['Montreuil','93048'],['Noisy-le-Grand','93051'],['Créteil','94028'],['Antony','92002'],['Boulogne','92012']
];
const ns='http://www.w3.org/2000/svg', fullW=680, fullH=400;
const indexed=areas.map(area=>{
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const path of area.rings)for(const [x,y] of path){minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY);}
  return {...area,minX,minY,maxX,maxY};
});
const west=Math.min(...indexed.map(v=>v.minX)),east=Math.max(...indexed.map(v=>v.maxX)),south=Math.min(...indexed.map(v=>v.minY)),north=Math.max(...indexed.map(v=>v.maxY));
const ratio=Math.cos(48.85*Math.PI/180), scale=Math.min((fullW-60)/((east-west)*ratio),(fullH-25)/(north-south));
const centerLon=(east+west)/2,centerLat=(north+south)/2;
const xy=(lon,lat)=>[(lon-centerLon)*ratio*scale+fullW/2,(centerLat-lat)*scale+fullH/2];
const ll=(x,y)=>[centerLon+(x-fullW/2)/(ratio*scale),centerLat-(y-fullH/2)/scale];
const round=v=>Number(v.toFixed(5));
export function areaAt(lon,lat) {
  if(!Number.isFinite(lon)||!Number.isFinite(lat))return null;
  for(const area of indexed){
    if(lon<area.minX||lon>area.maxX||lat<area.minY||lat>area.maxY)continue;
    let inside=false;
    for(const path of area.rings)for(let i=0,j=path.length-1;i<path.length;j=i++){
      const [x1,y1]=path[i],[x2,y2]=path[j];
      if((y1>lat)!==(y2>lat) && lon<(x2-x1)*(lat-y1)/(y2-y1)+x1)inside=!inside;
    }
    if(inside)return area;
  }
  return null;
}
export function sectorURL(currentUrl,room,lon,lat,name) {
  if(!Number.isFinite(lon)||!Number.isFinite(lat))return null;
  const area=areaAt(round(lon),round(lat));if(!area)return null;
  const url=new URL(currentUrl);
  url.searchParams.delete('halte');url.searchParams.set('lon',lon.toFixed(5));url.searchParams.set('lat',lat.toFixed(5));
  url.searchParams.set('lieu',String(name||area.name).slice(0,90));
  if(room)url.searchParams.set('salon',room);
  return url.href;
}
export function historicURL(currentUrl,room,key) {
  const url=new URL(currentUrl);
  for(const k of ['lon','lat','lieu'])url.searchParams.delete(k);
  url.searchParams.set('halte',key);
  if(room)url.searchParams.set('salon',room);
  return url.href;
}
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;};
const sv=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [key,v] of Object.entries(attrs||{}))el.setAttribute(key,String(v));return el;};
const makeButton=(text,cls,action)=>{const b=node('button',cls,text);b.type='button';b.addEventListener('click',action);return b;};

export function mountAtlas(root,{position,visit}){
  const wraps=node('div','gp-atlas'),stage=node('div','gp-stage'),svg=sv('svg',{viewBox:'0 0 '+fullW+' '+fullH,role:'img','aria-label':'Carte de Paris et des trois départements de petite couronne. Choisis un point ou utilise la liste des communes.'});
  svg.classList.add('gp-map');
  const paths=new Map();
  for(const area of indexed){
    const d=area.rings.map(ring=>ring.map(([lon,lat],i)=>{const [x,y]=xy(lon,lat);return (i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}).join('')+'Z').join('');
    const path=sv('path',{d,fill:colors[area.dept],'fill-rule':'evenodd','vector-effect':'non-scaling-stroke',class:'gp-area'});svg.append(path);paths.set(area.code,path);
  }
  const names=sv('g',{class:'gp-map-labels','pointer-events':'none'});
  for(const [name,code] of referenceTowns){
    const a=indexed.find(v=>v.code===code);if(!a)continue;
    const [x,y]=xy(...a.center);
    names.append(sv('circle',{cx:x,cy:y,r:2.1}));
    const tx=sv('text',{x,y:y-4,'text-anchor':'middle'});tx.textContent=name;names.append(tx);
  }
  const [pcx,pcy]=xy(2.356,48.858);
  const paris=sv('text',{x:pcx,y:pcy+5,'text-anchor':'middle',class:'gp-paris'});paris.textContent='Paris';names.append(paris);svg.append(names);
  const pin=sv('g',{class:'gp-location','pointer-events':'none',visibility:'hidden'});
  pin.append(sv('circle',{cx:0,cy:0,r:7.1,class:'gp-ring'}),sv('circle',{cx:0,cy:0,r:3.35,class:'gp-dot'}));svg.append(pin);
  let zoom=1,cx=fullW/2,cy=fullH/2,choice=null,selectedCode=null,drag=null;
  const controls=node('div','gp-zoom');
  const minus=makeButton('−','',()=>setZoom(zoom/1.7)),plus=makeButton('+','',()=>setZoom(zoom*1.7));
  minus.setAttribute('aria-label','Dézoomer');plus.setAttribute('aria-label','Zoomer');controls.append(minus,plus);
  const compass=node('span','gp-north','N');compass.setAttribute('aria-hidden','true');
  stage.append(svg,compass,controls);wraps.append(stage);
  const near=node('div','gp-pois');
  for(const point of places){near.append(makeButton(point.name,'gp-poi',()=>selectPoint(point.lon,point.lat,point.name,true)));}
  wraps.append(near);
  const selectLabel=node('label','mc-field-label','Commune ou arrondissement');selectLabel.htmlFor='gp-town';
  const select=node('select','mc-input');select.id='gp-town';const blank=node('option','','Choisir un secteur sur la carte ou dans la liste');blank.value='';select.append(blank);
  for(const [dept,label] of Object.entries(departments)){
    const group=node('optgroup');group.label=dept+' · '+label;
    for(const a of indexed.filter(v=>v.dept===dept)){const opt=node('option','',a.name);opt.value=a.code;group.append(opt);}
    select.append(group);
  }
  select.addEventListener('change',()=>{const a=indexed.find(i=>i.code===select.value);if(a)selectPoint(...a.center,a.name,true);else clear('Choisis une commune pour y jouer.');});
  const selection=node('div','gp-selection'),where=node('div','gp-where'),title=node('strong','', 'Choisis un point sur la carte'),subtitle=node('small','','Paris et petite couronne');
  where.setAttribute('aria-live','polite');where.append(title,subtitle);
  const go=makeButton('Charger le secteur','mc-primary',()=>{if(choice&&areaAt(choice.lon,choice.lat))visit(choice);});go.disabled=true;
  selection.append(where,go);
  const fields=node('div','gp-fields');fields.append(selectLabel,select);wraps.append(fields,selection);
  const credit=node('p','mc-map-credit gp-credit');
  credit.append(document.createTextNode('Les rues et bâtiments du secteur choisi sont chargés depuis l’IGN. Contours '));
  for(const [i,[text,url]] of [['API Découpage administratif','https://geo.api.gouv.fr/decoupage-administratif/communes'],['Paris Data','https://opendata.paris.fr/explore/dataset/arrondissements/']].entries()){
    if(i)credit.append(document.createTextNode(' et '));
    const a=node('a','',text);a.href=url;a.rel='noopener';a.target='_blank';credit.append(a);
  }
  credit.append(document.createTextNode('.'));wraps.append(credit);root.append(wraps);
  function updateBox(){
    const w=fullW/zoom,h=fullH/zoom;
    cx=Math.min(fullW-w/2,Math.max(w/2,cx));cy=Math.min(fullH-h/2,Math.max(h/2,cy));
    svg.setAttribute('viewBox',[cx-w/2,cy-h/2,w,h].join(' '));minus.disabled=zoom<=1.01;plus.disabled=zoom>=9;
    svg.classList.toggle('gp-can-pan',zoom>1);
    if(choice){const [x,y]=xy(choice.lon,choice.lat);pin.setAttribute('transform','translate('+x+' '+y+') scale('+(1/Math.sqrt(zoom))+')');}
  }
  function setZoom(next){
    const to=Math.max(1,Math.min(9,next));if(to>zoom && choice)[cx,cy]=xy(choice.lon,choice.lat);
    zoom=to;updateBox();
  }
  function clear(hint){
    if(selectedCode)paths.get(selectedCode)?.classList.remove('selected');
    choice=null;selectedCode=null;select.value='';go.disabled=true;pin.setAttribute('visibility','hidden');
    title.textContent=hint;subtitle.textContent='Paris · Hauts-de-Seine · Seine-Saint-Denis · Val-de-Marne';
  }
  function selectPoint(lon,lat,label,center){
    const area=areaAt(round(lon),round(lat));if(!area){clear('Choisis un point dans la zone colorée.');return false;}
    if(selectedCode)paths.get(selectedCode)?.classList.remove('selected');
    selectedCode=area.code;paths.get(area.code)?.classList.add('selected');select.value=area.code;
    choice={lon:round(lon),lat:round(lat),name:label||area.name};title.textContent=choice.name;
    subtitle.textContent=departments[area.dept]+' · '+choice.lat.toFixed(4)+'° N, '+choice.lon.toFixed(4)+'° E';
    go.disabled=false;pin.setAttribute('visibility','visible');
    if(center && zoom>1)[cx,cy]=xy(lon,lat);updateBox();return true;
  }
  function local(e){
    const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    const matrix=svg.getScreenCTM();return matrix?pt.matrixTransform(matrix.inverse()):null;
  }
  svg.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    const matrix=svg.getScreenCTM();if(!matrix)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx,cy,sx:matrix.a,sy:matrix.d,moved:false};
    svg.setPointerCapture?.(e.pointerId);
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.hypot(dx,dy)>5)drag.moved=true;
    if(drag.moved&&zoom>1){cx=drag.cx-dx/drag.sx;cy=drag.cy-dy/drag.sy;updateBox();}
  });
  svg.addEventListener('pointerup',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const click=!drag.moved;drag=null;
    if(click){const p=local(e);if(p)selectPoint(...ll(p.x,p.y));}
  });
  svg.addEventListener('pointercancel',()=>{drag=null;});
  if(Number.isFinite(position?.x)&&Number.isFinite(position?.y)){
    const lon=2.25+position.x/73190,lat=48.88-position.y/111320;
    const [x,y]=xy(lon,lat);
    const me=sv('g',{class:'gp-me','pointer-events':'none',transform:'translate('+x+' '+y+')'});
    const caption=sv('title');caption.textContent='Votre position';me.append(caption,sv('circle',{r:4.4}));svg.insertBefore(me,pin);
  }
  updateBox();
}
