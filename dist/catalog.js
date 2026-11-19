export const WEIGHTS = [
  {name:'Dentelle', gauge:[34,44], needles:'1,5–2,25', short:'Lace'},
  {name:'Très fine', gauge:[30,40], needles:'2,25–3,25', short:'Fingering'},
  {name:'Fine', gauge:[25,34], needles:'3,25–3,75', short:'Sport'},
  {name:'Légère', gauge:[22,30], needles:'3,75–4,5', short:'DK'},
  {name:'Moyenne', gauge:[19,26], needles:'4,5–5,5', short:'Aran'},
  {name:'Épaisse', gauge:[15,21], needles:'5,5–8', short:'Chunky'},
  {name:'Très épaisse', gauge:[10,14], needles:'8–12,75', short:'Super bulky'},
  {name:'Géante', gauge:[6,9], needles:'12,75 et +', short:'Jumbo'}
];
export const YARN_EXAMPLES = [
  {name:'Mérinos DK',fiber:'merinos',weight:3,grams:50,meters:125},
  {name:'Laine à chaussettes',fiber:'melange',weight:1,grams:100,meters:400},
  {name:'Alpaga fin',fiber:'alpaga',weight:2,grams:50,meters:165},
  {name:'Mohair et soie',fiber:'mohair',weight:0,grams:25,meters:210},
  {name:'Coton',fiber:'coton',weight:3,grams:50,meters:110},
  {name:'Grosse laine',fiber:'laine',weight:5,grams:100,meters:85}
];
export const COLORS = [
 ['Écru','#e8dfc9'],['Avoine','#cdbda1'],['Camel','#ae8261'],['Cacao','#644a3c'],
 ['Argile','#ad654a'],['Brique','#963f36'],['Grenat','#652d43'],['Bruyère','#a87d93'],
 ['Pêche','#e1a890'],['Mimosa','#e3c464'],['Miel','#c39345'],['Olive','#797e47'],
 ['Sauge','#9aa88c'],['Pin','#385345'],['Sapin','#243e38'],['Glacier','#abc6c4'],
 ['Denim','#627b94'],['Encre','#33465c'],['Prune','#644866'],['Ardoise','#707778'],
 ['Craie','#f4f0e7'],['Perle','#c4c1bb'],['Gris chiné','#8e8981'],['Charbon','#343636']
];
export const STITCHES = {stockinette:'Jersey',garter:'Point mousse',seed:'Point de riz',rib:'Côtes'};
export const FIBERS = {laine:'Laine',merinos:'Mérinos',alpaga:'Alpaga',mohair:'Mohair',coton:'Coton',lin:'Lin',acrylique:'Acrylique',melange:'Mélange',autre:'Autre fibre'};
export const FORMS = {rectangle:'Rectangle',triangle:'Triangle',tube:'Tube',disque:'Disque'};
export const SIZES = ['XS','S','M','L','XL','XXL'];
const upper = {chest:104,length:62,sleeve:44,upperArm:36,cuff:19,neck:44,armhole:23,hem:100};
const types = [
 ['pull','Pull','Vêtements',upper],['gilet','Gilet','Vêtements',{...upper,chest:108,hem:104}],
 ['debardeur','Débardeur','Vêtements',{chest:98,length:55,neck:47,armhole:22,hem:96}],
 ['robe','Robe','Vêtements',{...upper,length:94,hem:122}],
 ['poncho','Poncho','Vêtements',{width:125,length:65,neck:46}],
 ['jupe','Jupe','Vêtements',{waist:76,hem:116,length:59}],
 ['brassiere','Brassière bébé','Vêtements',{chest:48,length:26,sleeve:17,upperArm:18,cuff:12,neck:27,armhole:11,hem:47}],
 ['bonnet','Bonnet','Accessoires',{circumference:52,length:22,brim:5}],
 ['echarpe','Écharpe','Accessoires',{width:24,length:155}],
 ['snood','Snood','Accessoires',{circumference:60,length:27}],
 ['chale','Châle','Accessoires',{width:145,length:65}],
 ['chaussettes','Chaussettes','Accessoires',{circumference:21,foot:24,leg:17}],
 ['chaussons','Chaussons','Accessoires',{circumference:22,foot:24,leg:6}],
 ['mitaines','Mitaines','Accessoires',{circumference:19,length:19,thumb:5}],
 ['moufles','Moufles','Accessoires',{circumference:20,length:25,thumb:7}],
 ['bandeau','Bandeau','Accessoires',{circumference:50,width:9}],
 ['sac','Sac','Accessoires',{width:32,length:34,depth:8,handle:45}],
 ['couverture','Couverture','Maison',{width:100,length:140}],
 ['coussin','Coussin','Maison',{width:45,length:45,depth:7}],
 ['lavette','Lavette','Maison',{width:23,length:23}],
 ['libre','Ouvrage libre','Forme libre',{width:40,length:45}]
];
export const CATALOG=Object.fromEntries(types.map(([id,name,group,measures])=>[id,{id,name,group,measures}]));
export const GROUPS=['Vêtements','Accessoires','Maison','Forme libre'];
export const HAS_COLLAR = new Set(['pull','gilet','debardeur','robe','brassiere']);
const labels={chest:'Tour de poitrine du vêtement',length:'Longueur',sleeve:'Longueur de manche depuis l’aisselle',upperArm:'Tour de haut de manche',cuff:'Tour de poignet',neck:'Tour d’encolure',armhole:'Hauteur d’emmanchure',hem:'Tour du bas',waist:'Tour de taille',width:'Largeur',circumference:'Circonférence',brim:'Hauteur du revers',foot:'Longueur du pied',leg:'Hauteur de tige',thumb:'Longueur du pouce',depth:'Épaisseur',handle:'Longueur d’une anse'};
export function measureLabel(key,kind,form){
  if(key==='width'&&kind==='libre'&&form==='disque')return 'Diamètre';
  if(key==='width'&&kind==='libre'&&form==='tube')return 'Circonférence';
  if(key==='width'&&kind==='chale')return 'Envergure';
  if(key==='length'&&['chale','bonnet','coussin','sac'].includes(kind))return 'Hauteur';
  if(key==='length'&&kind==='poncho')return 'Hauteur épaule–pointe';
  if(key==='length'&&HAS_COLLAR.has(kind))return 'Hauteur épaule–bas';
  if(key==='depth'&&kind==='sac')return 'Profondeur du fond';
  return labels[key]||key;
}
export function limitsFor(kind,key){
  if(key==='length'||key==='width')return [3,kind==='couverture'||kind==='libre'||kind==='echarpe'?400:240];
  if(key==='chest'||key==='hem'||key==='waist'||key==='circumference')return [5,260];
  if(key==='brim'||key==='depth'||key==='thumb')return [0.5,50];
  return [2,140];
}
export function validateMeasures(kind,m){
  for(const key of Object.keys(CATALOG[kind].measures)){
    const [min,max]=limitsFor(kind,key);
    if(!Number.isFinite(m[key])||m[key]<min||m[key]>max)return measureLabel(key,kind)+' doit être compris entre '+min+' et '+max+' cm.';
  }
  if(m.chest&&m.neck>m.chest*.74)return 'Pour cette coupe, réduisez le tour d’encolure à '+Math.floor(m.chest*.74*10)/10+' cm au maximum.';
  if(m.armhole&&m.armhole>m.length*.74)return 'Pour cette coupe, réduisez la hauteur d’emmanchure à '+Math.floor(m.length*.74*10)/10+' cm au maximum.';
  if(m.upperArm&&m.cuff>m.upperArm)return 'Le tour de poignet doit tenir dans le tour du haut de manche.';
  if(m.brim&&m.brim>=m.length)return 'Le revers doit être plus court que le bonnet.';
  if(kind==='poncho'&&m.neck/Math.PI>=m.width)return 'L’ouverture du col doit tenir dans la largeur du poncho.';
  return '';
}
export function sizeMeasures(kind,size){
  const base=CATALOG[kind].measures;
  const idx=SIZES.indexOf(size);
  if(idx<0)return {...base};
  const n=idx-2;
  return Object.fromEntries(Object.entries(base).map(([k,v])=>{
    const change=({chest:8,hem:8,waist:7,length:2,upperArm:2,cuff:.8,sleeve:1,neck:1.5,armhole:1,width:5})[k]||0;
    return [k,Math.round((v+n*change)*10)/10];
  }));
}
export function defaultMeasureHint(kind){
  if(['pull','gilet','debardeur','robe','brassiere','jupe'].includes(kind))return 'Relevez les mesures sur un vêtement qui vous va, en incluant l’aisance souhaitée.';
  if(['moufles','mitaines','chaussons','chaussettes'].includes(kind))return 'Indiquez les mesures finies d’une pièce. Le projet comprend la paire.';
  return 'Indiquez les dimensions finies de votre ouvrage en centimètres.';
}
export function fabricArea(p){
  const m=p.measures;
  const pair=['chaussettes','chaussons','mitaines','moufles'].includes(p.kind);
  let area;
  if(HAS_COLLAR.has(p.kind)){
    const body=(m.chest+m.hem)/2*m.length;
    const neckCut=m.neck*m.armhole*.13;
    const arms=m.sleeve ? (m.upperArm+m.cuff)*m.sleeve : 0;
    const edges=p.collar==='high'?m.neck*10:m.neck*2.5;
    area=body-neckCut+arms+edges+(p.kind==='gilet'?m.length*5:0);
  }else{
    const values={
      jupe:(m.waist+m.hem)/2*m.length,poncho:m.width*m.length*1.37-m.neck*m.neck/(4*Math.PI),
      bonnet:m.circumference*(m.length*.85+m.brim),echarpe:m.width*m.length,snood:m.circumference*m.length,
      chale:m.width*m.length/2,bandeau:m.circumference*m.width,couverture:m.width*m.length,
      coussin:2*m.width*m.length+2*m.depth*(m.width+m.length),lavette:m.width*m.length,
      sac:2*(m.width+m.depth)*m.length+m.width*m.depth+2*m.handle*3,
      chaussettes:2*m.circumference*(m.foot+m.leg)*.98,chaussons:2*m.circumference*(m.foot*.85+m.leg*.55),
      mitaines:2*m.circumference*(m.length+m.thumb*.32),moufles:2*m.circumference*(m.length*.94+m.thumb*.34),
      libre:p.form==='disque'?Math.PI*m.width*m.width/4:m.width*m.length*(p.form==='triangle'?.5:1)
    };
    area=values[p.kind];
  }
  return {cm2:Math.max(1,area),pair};
}
