import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import chairData from './assets/sheen-chair.json';
import type { Curiosity, Behavior } from './model';

export type Motion = Record<Behavior, number>;
export interface Artwork {
  root: T.Group;
  animate: (time: number, motion: Motion, still: boolean, look?: T.Vector2) => void;
}
const TAU = Math.PI * 2;
type Palette = ReturnType<typeof palette>;
const surfaceMaps = new Map<string, T.DataTexture>();

function surface(kind: 'patina' | 'linen' | 'walnut') {
  const existing = surfaceMaps.get(kind);
  if (existing) return existing;
  const size = 128, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const noise = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
    let value = 190 + Math.abs(noise) * 50;
    if (kind === 'linen') value = 150 + ((x % 4 < 2) !== (y % 4 < 2) ? 58 : 0) + Math.abs(noise) * 25;
    if (kind === 'walnut') value = 115 + Math.sin(x * .55 + Math.sin(y * .07) * 1.8) * 28 + Math.abs(noise) * 18;
    const i = (y * size + x) * 4;
    data[i] = value; data[i + 1] = kind === 'walnut' ? value * .62 : value;
    data[i + 2] = kind === 'walnut' ? value * .36 : value; data[i + 3] = 255;
  }
  const tex = new T.DataTexture(data, size, size, T.RGBAFormat);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.magFilter = T.LinearFilter; tex.minFilter = T.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true; tex.userData.shared = true;
  if (kind === 'walnut') tex.colorSpace = T.SRGBColorSpace;
  surfaceMaps.set(kind, tex);
  return tex;
}

function palette(color: string) {
  return {
    gold: new T.MeshPhysicalMaterial({color, metalness: .82, roughness: .3, roughnessMap: surface('patina'), clearcoat: .28, clearcoatRoughness: .3}),
    brass: new T.MeshStandardMaterial({color: '#d5af65', metalness: .85, roughness: .27}),
    dark: new T.MeshStandardMaterial({color: '#253631', metalness: .52, roughness: .42}),
    porcelain: new T.MeshPhysicalMaterial({color: '#eadfc5', roughness: .2, clearcoat: 1, clearcoatRoughness: .14, bumpMap: surface('patina'), bumpScale: .004}),
    ceramic: new T.MeshPhysicalMaterial({color, metalness: .12, roughness: .3, clearcoat: .85, clearcoatRoughness: .2}),
    cloth: new T.MeshPhysicalMaterial({color, roughness: .86, sheen: 1, sheenColor: new T.Color(color).lerp(new T.Color('#e5d9b5'), .45), sheenRoughness: .65, bumpMap: surface('linen'), bumpScale: .012, side: T.DoubleSide}),
    wood: new T.MeshPhysicalMaterial({color: '#876346', map: surface('walnut'), roughness: .32, clearcoat: .55, clearcoatRoughness: .3}),
    eye: new T.MeshPhysicalMaterial({color: '#d59639', metalness: .25, roughness: .12, clearcoat: 1}),
    black: new T.MeshPhysicalMaterial({color: '#0b1715', roughness: .1, clearcoat: 1}),
    glow: new T.MeshStandardMaterial({color: '#e7c975', emissive: '#c68d32', emissiveIntensity: .8, metalness: .3, roughness: .2}),
    green: new T.MeshPhysicalMaterial({color: '#64866c', roughness: .5, sheen: .45, sheenColor: new T.Color('#bfd19a'), side: T.DoubleSide}),
  };
}

function part(parent:T.Object3D, geometry:T.BufferGeometry, material:T.Material, x=0,y=0,z=0) {
  const m = new T.Mesh(geometry, material); m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function ellipsoid(p:T.Object3D,m:T.Material,sx:number,sy:number,sz:number,x=0,y=0,z=0) {
  const radius=Math.max(sx,sy,sz),segments=radius<.035?[8,6]:radius<.12?[12,8]:[28,20];
  const mesh=part(p,new T.SphereGeometry(1,segments[0],segments[1]),m,x,y,z);mesh.scale.set(sx,sy,sz);return mesh;
}
function box(p:T.Object3D,m:T.Material,w:number,h:number,d:number,x=0,y=0,z=0,r=.035) {
  const dimension=Math.min(w,h,d);
  const geometry=dimension<.021?new T.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,dimension<.09?1:2,Math.min(r,w/3,h/3,d/3));
  return part(p,geometry,m,x,y,z);
}
function ring(p:T.Object3D,m:T.Material,r:number,t:number,x=0,y=0,z=0,arc=TAU) {
  return part(p,new T.TorusGeometry(r,t,8,72,arc),m,x,y,z);
}
function tube(p:T.Object3D,m:T.Material,points:number[][],radius=.018,segments=32,radial=7) {
  return part(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number]))),segments,radius,radial,false),m);
}
function turned(p:T.Object3D,m:T.Material,profile:number[][],segments=48) {
  return part(p,new T.LatheGeometry(profile.map(v=>new T.Vector2(v[0],v[1])),segments),m);
}
function curveMesh(p:T.Object3D,m:T.Material,points:number[][],radius:number,tip=.005,grooves=0) {
  const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v as [number,number,number])));
  const n=44,sides=14,geometry=new T.TubeGeometry(curve,n,radius,sides,false),a=geometry.attributes.position;
  for(let i=0;i<=n;i++) {
    const center=curve.getPointAt(i/n),factor=tip/radius+(1-tip/radius)*Math.pow(1-i/n,.64);
    for(let j=0;j<=sides;j++) {
      const q=new T.Vector3().fromBufferAttribute(a,i*(sides+1)+j).sub(center);
      q.multiplyScalar(factor*(1+grooves*Math.cos(j/sides*TAU*5))).add(center);
      a.setXYZ(i*(sides+1)+j,q.x,q.y,q.z);
    }
  }
  geometry.computeVertexNormals(); return part(p,geometry,m);
}

// Closed, curved leaf / feather. A real lenticular surface rather than a cone.
function bladeGeometry(length:number,width:number,bend=.1,segments=15) {
  const pos:number[]=[],uv:number[]=[],idx:number[]=[];const cross=6;
  for(let side=0;side<2;side++) for(let i=0;i<=segments;i++) for(let j=0;j<=cross;j++) {
    const t=i/segments,u=j/cross*2-1,span=width*Math.pow(Math.sin(Math.PI*t),.7);
    pos.push(u*span,t*length,bend*t*t+(side===0?1:-1)*.028*(1-u*u)*Math.sin(Math.PI*t));uv.push(j/cross,t);
  }
  const layer=(segments+1)*(cross+1);
  for(let side=0;side<2;side++) for(let i=0;i<segments;i++) for(let j=0;j<cross;j++) {
    const a=side*layer+i*(cross+1)+j,b=a+cross+1;
    if(side===0)idx.push(a,a+1,b,b,a+1,b+1);else idx.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function leaf(p:T.Object3D,m:T.Material,length:number,width:number,x:number,y:number,z:number,angle:number) {
  const l=part(p,bladeGeometry(length,width),m,x,y,z);l.rotation.z=angle;return l;
}
function gear(p:T.Object3D,m:T.Material,radius:number,teeth:number,x:number,y:number,z:number) {
  const group=new T.Group();group.position.set(x,y,z);p.add(group);
  ring(group,m,radius,.025);ring(group,m,radius*.55,.014);
  for(let i=0;i<teeth;i++){const a=i*TAU/teeth;const tooth=box(group,m,.04,.06,.045,Math.cos(a)*radius,Math.sin(a)*radius,0,.006);tooth.rotation.z=a-Math.PI/2;}
  for(let i=0;i<5;i++){const a=i*TAU/5;const spoke=box(group,m,radius,.018,.035,Math.cos(a)*radius/2,Math.sin(a)*radius/2,0,.005);spoke.rotation.z=a;}
  ellipsoid(group,m,.045,.045,.035);return group;
}

// Batch repeated rigid ornaments by material. Articulation stays in explicit groups.
function fuse(group:T.Group) {
  group.updateMatrixWorld(true);
  const inv=new T.Matrix4().copy(group.matrixWorld).invert();
  const buckets=new Map<T.Material,T.BufferGeometry[]>(),original:T.Mesh[]=[];
  group.traverse(o=>{if(!(o instanceof T.Mesh)||Array.isArray(o.material))return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));
    if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
    for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);
    const list=buckets.get(o.material)||[];list.push(g);buckets.set(o.material,list);original.push(o);
  });
  const old=new Set<T.BufferGeometry>();original.forEach(o=>{old.add(o.geometry);o.removeFromParent();});old.forEach(g=>g.dispose());
  for(const [material,list] of buckets){const merged=mergeGeometries(list,false);list.forEach(g=>g.dispose());if(merged)part(group,merged,material);}
}
function decode<TArray extends Int16Array|Int8Array|Uint16Array>(base64:string,type:{new(buffer:ArrayBuffer):TArray}) {
  const raw=atob(base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new type(bytes.buffer);
}

function bird(root:T.Group,p:Palette) {
  const fixed=new T.Group();root.add(fixed);
  ellipsoid(fixed,p.gold,.28,.43,.37,0,.08,0).rotation.x=.2;
  ellipsoid(fixed,p.dark,.23,.26,.22,0,.17,.25);
  ring(fixed,p.brass,.19,.018,0,.18,.405);
  const gears=[gear(root,p.brass,.13,16,0,.18,.42),gear(root,p.gold,.075,12,.12,.04,.42)];
  ellipsoid(fixed,p.gold,.19,.22,.19,0,.6,.12);
  for(const sign of [-1,1]) {
    const eye=ellipsoid(fixed,p.eye,.069,.073,.04,sign*.16,.64,.23);eye.rotation.y=sign*.65;
    ellipsoid(fixed,p.black,.028,.04,.023,sign*.181,.64,.26);
    ring(fixed,p.brass,.081,.008,sign*.16,.64,.23).rotation.y=sign*.65;
    for(let i=0;i<6;i++) {const f=leaf(fixed,p.gold,.36,.055,sign*.12,.36-i*.06,-.16,sign*.4);f.rotation.x=-.8;}
    curveMesh(fixed,p.gold,[[sign*.12,-.25,0],[sign*.14,-.5,.04],[sign*.14,-.64,.12]],.035,.023);
    for(let toe=0;toe<3;toe++)curveMesh(fixed,p.brass,[[sign*.14,-.62,.10],[sign*.14+(toe-1)*.075,-.66,.24],[sign*.14+(toe-1)*.1,-.66,.32]],.016,.004);
  }
  curveMesh(fixed,p.brass,[[0,.62,.25],[0,.57,.39],[0,.52,.48]],.075,.002);
  curveMesh(fixed,p.gold,[[0,.53,.25],[0,.49,.36],[0,.515,.45]],.05,.002);
  for(let i=0;i<4;i++) {const f=leaf(fixed,p.gold,.35-i*.04,.05,(i-1.5)*.055,.73,.03,(i-1.5)*.2);f.rotation.x=-.45;}
  for(let i=0;i<5;i++) {const f=leaf(fixed,i%2?p.gold:p.brass,.72,.075,(i-2)*.075,-.18,-.24,(i-2)*.13);f.rotation.x=-2.25;}
  const wings:T.Group[]=[];
  for(const sign of [-1,1]) {
    const wing=new T.Group();root.add(wing);wing.position.set(sign*.21,.27,-.02);wings.push(wing);
    const frame=new T.Group();wing.add(frame);
    curveMesh(frame,p.brass,[[0,0,0],[sign*.35,.16,0],[sign*.73,.2,-.1],[sign*.95,.15,-.15]],.045,.012);
    for(let i=0;i<12;i++) {
      const x=sign*(.07+i*.071),y=.10-i*.021,z=-i*.013;
      const g=new T.Group();g.position.set(x,y,z);g.rotation.z=sign*(-.55-i*.055);g.rotation.x=Math.PI-.17;frame.add(g);
      const length=.58+.26*Math.sin(i/12*Math.PI);
      part(g,bladeGeometry(length,.077,.11),i%3===0?p.brass:p.gold);
      tube(g,p.dark,[[0,.04,.008],[0,length*.55,.05],[0,length*.94,.10]],.004,12,4);
      for(let k=1;k<6;k++){const at=k/7*length;const w=.06*Math.sin(at/length*Math.PI);tube(g,p.brass,[[-w,at-.027,.024],[0,at,.027],[w,at-.027,.024]],.0025,4,3);}
    }
    for(let i=0;i<8;i++){const f=leaf(frame,p.gold,.28,.055,sign*(.08+i*.085),.08,-.01,-sign*.6);f.rotation.x=2.8;}
    fuse(frame);
  }
  fuse(fixed);gears.forEach(fuse);
  return (t:number,a:Motion,still:boolean)=>{
    wings.forEach((w,i)=>w.rotation.z=(i===0?1:-1)*(.13+(still?a.flight*.35:Math.sin(t*(2+a.flight*9))*(.025+a.flight*.53))));
    gears.forEach((g,i)=>g.rotation.z=(still?0:t)*(i===0?1:-1)*(.15+a.flight));
  };
}

function relic(root:T.Group,p:Palette) {
  const base=new T.IcosahedronGeometry(.68,0),vertices=base.attributes.position;
  const shards:{group:T.Group;away:T.Vector3}[]=[];
  for(let face=0;face<vertices.count/3;face++) {
    const a=new T.Vector3().fromBufferAttribute(vertices,face*3),b=new T.Vector3().fromBufferAttribute(vertices,face*3+1),c=new T.Vector3().fromBufferAttribute(vertices,face*3+2);
    const center=a.clone().add(b).add(c).divideScalar(3),n=9;
    a.lerp(center,.05);b.lerp(center,.05);c.lerp(center,.05);
    const positions:number[]=[],indices:number[]=[],uv:number[]=[];
    const point=(i:number,j:number,r=.68)=>a.clone().multiplyScalar(1-i/n-j/n).addScaledVector(b,i/n).addScaledVector(c,j/n).normalize().multiplyScalar(r);
    const rows:number[][]=[];
    for(let i=0;i<=n;i++){rows[i]=[];for(let j=0;j<=n-i;j++){rows[i][j]=positions.length/3;const q=point(i,j);positions.push(q.x,q.y,q.z);uv.push(i/n,j/n);}}
    for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){indices.push(rows[i][j],rows[i+1][j],rows[i][j+1]);if(j<n-i-1)indices.push(rows[i+1][j],rows[i+1][j+1],rows[i][j+1]);}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    // Ensure every patch points outwards, independently of upstream face winding.
    const normal=new T.Vector3().fromBufferAttribute(geometry.attributes.normal,0);if(normal.dot(center)<0){const index=geometry.index!;for(let k=0;k<index.count;k+=3){const b=index.getX(k+1);index.setX(k+1,index.getX(k+2));index.setX(k+2,b);}geometry.computeVertexNormals();}
    const shard=new T.Group();root.add(shard);part(shard,geometry,p.porcelain);
    const inner=geometry.clone();inner.scale(.93,.93,.93);part(shard,inner,new T.MeshStandardMaterial({color:'#9b7d50',metalness:.45,roughness:.5,side:T.BackSide}));
    for(const [from,to] of [[a,b],[b,c],[c,a]]){const edge=[];for(let k=0;k<=10;k++){const q=from.clone().lerp(to,k/10).normalize().multiplyScalar(.683);edge.push(q.toArray());}tube(shard,p.brass,edge,.009,16,5);}
    const away=center.normalize().multiplyScalar(.12+(face%4)*.025);shard.position.copy(away);fuse(shard);shards.push({group:shard,away});
  }
  base.dispose();const fixed=new T.Group();root.add(fixed);
  ellipsoid(fixed,p.glow,.53,.53,.53);ring(fixed,p.gold,.9,.026).rotation.x=.65;ring(fixed,p.dark,.87,.017).rotation.y=1.05;
  for(let i=0;i<36;i++){const angle=i*TAU/36;ellipsoid(fixed,p.brass,.016,.016,.016,Math.sin(angle)*.9,Math.cos(angle)*.9,0);}
  fuse(fixed);
  return (t:number,a:Motion,still:boolean)=>shards.forEach(({group,away},i)=>{group.position.copy(away).multiplyScalar((1-a.rescue)*(1+(still?0:Math.sin(t*.75+i)*.05)));group.rotation.set(0,0,(1-a.rescue)*Math.sin(i*5)*.018);});
}

function armchair(root:T.Group,p:Palette) {
  const chair=new T.Group();root.add(chair);
  for(const data of chairData.meshes) {
    const positions=decode(data.positions,Int16Array),normals=decode(data.normals,Int8Array),indices=decode(data.indices,Uint16Array);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(Float32Array.from(positions,n=>n/32767),3));
    g.setAttribute('normal',new T.Float32BufferAttribute(Float32Array.from(normals,n=>n/127),3));g.setIndex(new T.BufferAttribute(indices,1));
    // Triplanar-like simple UV projection for the local cloth and walnut microstructure.
    const uv=new Float32Array(positions.length/3*2);for(let i=0;i<positions.length/3;i++){uv[i*2]=positions[i*3]/32767*3;uv[i*2+1]=(positions[i*3+1]+positions[i*3+2]) /32767*3;}
    g.setAttribute('uv',new T.BufferAttribute(uv,2));part(chair,g,data.name.endsWith('fabric')?p.cloth:data.name.endsWith('wood')?p.wood:p.brass);
  }
  const bounds=new T.Box3().setFromObject(chair),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const scale=1.75/size.y;chair.scale.setScalar(scale);chair.position.set(-center.x*scale,-.84-bounds.min.y*scale,-center.z*scale);
  return ()=>{};
}

function curtainGeometry(sign:number) {
  const g=new T.PlaneGeometry(.66,1.66,22,26),a=g.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setZ(i,Math.sin((x+.33)/.66*Math.PI*8)*.035+.018*Math.cos(y*6));a.setY(i,y-.026*Math.cos(x*8)*Math.pow((.83-y)/1.66,2));}g.computeVertexNormals();return g;
}
function zipper(root:T.Group,p:Palette,includeFrame=true) {
  const fixed=new T.Group();root.add(fixed);
  const leaves:T.Group[]=[];
  if(includeFrame) {
    for(let layer=0;layer<3;layer++)for(const sign of [-1,1]){
      box(fixed,layer===1?p.dark:p.brass,.08,1.98+layer*.08,.09,sign*(.74+layer*.07),0,-layer*.035,.015);
      box(fixed,layer===1?p.dark:p.brass,1.55+layer*.14,.08,.09,0,sign*(.95+layer*.04),-layer*.035,.015);
    }
    for(const sx of [-1,1])for(const sy of [-1,1]){
      for(let k=0;k<2;k++){const pts=[];for(let i=0;i<=35;i++){const a=i/35*TAU*1.35,r=.12*(1-i/40);pts.push([sx*(.64+k*.12+Math.cos(a)*r),sy*(.85+Math.sin(a)*r),.08]);}tube(fixed,p.gold,pts,.016,36,6);}
      for(let i=0;i<3;i++){const f=leaf(fixed,p.brass,.19,.045,sx*.71,sy*.82,.11,sx*sy*(.6+i*.4));if(sy<0)f.rotation.z+=Math.PI;}
    }
    box(fixed,p.dark,1.4,1.8,.08,0,0,-.2,.03);
    const sky=new T.Group();sky.position.z=-.08;root.add(sky);ring(sky,p.glow,.5,.01).rotation.x=.3;ring(sky,p.brass,.35,.014).rotation.y=.5;
    ellipsoid(sky,p.glow,.12,.12,.04);for(let i=0;i<45;i++){const angle=i*2.399,r=.12+Math.sqrt(i/45)*.48;ellipsoid(sky,i%4?p.brass:p.glow,.008,.008,.008,Math.cos(angle)*r,Math.sin(angle)*r,.01);}
    fuse(sky);
  }
  for(const sign of [-1,1]){
    const panel=new T.Group();panel.position.set(sign*.34,0,.17);root.add(panel);leaves.push(panel);
    const body=part(panel,curtainGeometry(sign),p.cloth);body.name='velvet';
    for(let i=0;i<22;i++){box(panel,p.brass,.07,.031,.04,-sign*.316,-.77+i*.071,.05,.008);ellipsoid(panel,p.gold,.012,.012,.012,sign*.29,-.77+i*.071,.06);}
    tube(panel,p.brass,[[sign*.29,-.8,.04],[sign*.29,0,.04],[sign*.29,.8,.04]],.008,12,5);fuse(panel);
  }
  const pull=new T.Group();root.add(pull);pull.position.set(0,.7,.24);box(pull,p.brass,.12,.15,.07);ring(pull,p.gold,.075,.015,0,-.1,.06).scale.y=1.5;
  fuse(fixed);fuse(pull);
  return (_t:number,a:Motion)=>{leaves.forEach((panel,i)=>{const s=i===0?-1:1;panel.position.x=s*(.34+a.zip*.59);panel.scale.x=1-a.zip*.75;panel.rotation.y=-s*a.zip*.15;});pull.position.y=.7-a.zip*1.45;pull.visible=a.zip<.97;};
}

function guardian(root:T.Group,p:Palette) {
  const body=new T.Group();root.add(body);ellipsoid(body,p.ceramic,.46,.53,.35,0,-.12,0);
  ellipsoid(body,p.porcelain,.29,.35,.06,0,-.12,.32);
  for(let row=0;row<5;row++)for(let i=0;i<9;i++){
    const a=(i/8)*Math.PI+.2;const feather=leaf(body,i%3?p.ceramic:p.gold,.18,.06,Math.cos(a)*.42,.12-row*.1,-Math.sin(a)*.29,.5*Math.cos(a));feather.rotation.x=-.35;
  }
  for(const s of [-1,1]){
    ellipsoid(body,p.gold,.18,.08,.25,s*.3,-.68,.16);
    for(let j=0;j<3;j++)curveMesh(body,p.porcelain,[[s*.3+(j-1)*.075,-.67,.3],[s*.3+(j-1)*.09,-.67,.4],[s*.3+(j-1)*.1,-.7,.44]],.025,.002);
    curveMesh(body,p.ceramic,[[s*.38,-.15,0],[s*.59,-.29,.03],[s*.55,-.45,.15]],.1,.035);
  }
  const head=new T.Group();head.position.y=.4;root.add(head);
  ellipsoid(head,p.ceramic,.5,.38,.32);
  const pupils:T.Group[]=[],lids:T.Mesh[]=[];
  for(const s of [-1,1]){
    curveMesh(head,p.ceramic,[[s*.32,.12,0],[s*.49,.38,-.08],[s*.45,.58,-.02]],.13,.007);
    ellipsoid(head,p.porcelain,.205,.22,.075,s*.22,.03,.29);
    ring(head,p.gold,.207,.018,s*.22,.03,.31).scale.y=1.08;
    const pupil=new T.Group();pupil.position.set(s*.22,.03,.36);head.add(pupil);pupils.push(pupil);
    ellipsoid(pupil,p.eye,.105,.12,.035);ellipsoid(pupil,p.black,.048,.078,.025,0,0,.03);ellipsoid(pupil,p.porcelain,.022,.025,.009,-.025,.042,.054);
    const lid=ellipsoid(head,p.ceramic,.218,.025,.09,s*.22,.22,.32);lids.push(lid);lid.rotation.z=-s*.16;
    tube(head,p.gold,[[s*.05,.27,.32],[s*.21,.3,.34],[s*.42,.23,.29]],.04,15,8);
  }
  curveMesh(head,p.brass,[[0,.02,.29],[.025,-.08,.45],[0,-.13,.4]],.06,.003);
  tube(head,p.dark,[[-.16,-.21,.25],[0,-.235,.30],[.16,-.19,.25]],.018,16,6);
  for(let i=0;i<3;i++)box(head,p.porcelain,.039,.075,.05,(i-1)*.06,-.23,.29,.008);
  const hat=new T.Group();hat.position.set(.09,.35,-.03);hat.rotation.z=-.2;head.add(hat);
  ring(hat,p.brass,.23,.025).rotation.x=Math.PI/2;turned(hat,p.gold,[[.22,0],[.2,.06],[.21,.13],[.17,.18]]);
  for(let i=0;i<7;i++){const a=i*TAU/7;curveMesh(hat,p.brass,[[Math.sin(a)*.2,.12,Math.cos(a)*.2],[Math.sin(a)*.24,.3,Math.cos(a)*.24],[Math.sin(a)*.20,.36,Math.cos(a)*.20]],.025,.008);}
  const chain=[];for(let i=0;i<21;i++){const a=i/20*Math.PI;chain.push([Math.cos(a)*.27,-.02-Math.sin(a)*.25,.34]);}tube(body,p.brass,chain,.009,30,6);
  ring(body,p.brass,.065,.015,0,-.3,.38);ellipsoid(body,p.eye,.047,.047,.018,0,-.3,.39);
  // Only the rigid shell is batched: the face keeps its articulated pupils/lids.
  fuse(body);fuse(hat);
  return (t:number,a:Motion,still:boolean,look?:T.Vector2)=>{
    head.rotation.z=still?a.silly*.1:Math.sin(t*1.1)*.035+a.silly*Math.sin(t*4.5)*.18;
    const blink=still?0:Math.pow(Math.max(0,Math.cos(t*.6)),55);
    lids.forEach(l=>{l.scale.y=.025+blink*.18;l.position.y=.22-blink*.16;});
    pupils.forEach((q,i)=>{q.position.x=(i===0?-.22:.22)+(look?.x||0)*.025+(still?0:a.silly*Math.sin(t*3+i)*.03);q.position.y=.03+(look?.y||0)*.02;});
  };
}

function astrolabe(root:T.Group,p:Palette) {
  const fixed=new T.Group();root.add(fixed);
  turned(fixed,p.dark,[[0,-.84],[.42,-.84],[.44,-.8],[.44,-.74],[.35,-.7],[.32,-.64],[0,-.64]]);
  turned(fixed,p.gold,[[.3,-.7],[.31,-.65],[.18,-.6],[.1,-.47],[.075,-.25],[.14,-.15],[.18,-.1]]);
  for(let i=0;i<12;i++){const a=i*TAU/12;tube(fixed,p.brass,[[Math.cos(a)*.11,-.53,Math.sin(a)*.11],[Math.cos(a)*.085,-.3,Math.sin(a)*.085],[Math.cos(a)*.13,-.16,Math.sin(a)*.13]],.012,15,5);}
  for(const s of [-1,1]){
    tube(fixed,p.gold,[[s*.18,-.55,0],[s*.48,-.32,0],[s*.64,.12,0],[s*.56,.48,0]],.034,32,8);
    for(let i=0;i<9;i++){const a=i/9*1.8,x=s*(.22+Math.sin(a)*.35),y=-.48+i*.095;leaf(fixed,p.brass,.18,.05,x,y,.02,-s*(.8+i*.05));leaf(fixed,p.gold,.14,.04,x,y,-.025,-s*2.1);}
  }
  const cosmos=new T.Group();cosmos.position.y=.32;root.add(cosmos);
  const rings:T.Group[]=[];
  for(let j=0;j<3;j++){
    const orbit=new T.Group();cosmos.add(orbit);orbit.rotation.set(j*.55,j*.8,.25);rings.push(orbit);
    ring(orbit,j===1?p.gold:p.brass,.64-j*.07,.018);
    for(let i=0;i<48;i++){const a=i*TAU/48;const tick=box(orbit,p.brass,.008,i%4===0?.06:.025,.017,Math.cos(a)*(.64-j*.07),Math.sin(a)*(.64-j*.07),0,.002);tick.rotation.z=a-Math.PI/2;}
    ellipsoid(orbit,p.porcelain,.055,.055,.055,.64-j*.07,0,0);fuse(orbit);
  }
  ellipsoid(cosmos,p.dark,.26,.26,.26);ring(cosmos,p.brass,.265,.006).rotation.x=Math.PI/2;
  for(let i=0;i<36;i++){const a=i*2.399,y=1-2*i/35,r=Math.sqrt(1-y*y),x=Math.cos(a)*r,z=Math.sin(a)*r;ellipsoid(cosmos,p.glow,.009,.009,.009,x*.264,y*.264,z*.264);}
  for(let i=0;i<12;i++){const a=i*TAU/12;curveMesh(fixed,p.brass,[[Math.sin(a)*.12,.96,0],[Math.sin(a)*.23,.96+Math.cos(a)*.12,0],[Math.sin(a)*.27,1.02+Math.cos(a)*.12,0]],.012,.003);}
  fuse(fixed);
  return (t:number,a:Motion,still:boolean)=>rings.forEach((r,i)=>{r.rotation.y=i*.8+(still?a.trophy*.2:t*(.06+a.trophy*.25)*(i%2?1:-1));});
}

function sanctuary(root:T.Group,p:Palette) {
  const fixed=new T.Group();root.add(fixed);
  turned(fixed,p.dark,[[0,-.82],[.43,-.82],[.48,-.75],[.46,-.69],[.39,-.64],[0,-.64]]);
  ring(fixed,p.brass,.45,.018,0,-.69,0).rotation.x=Math.PI/2;
  for(const s of [-1,1])curveMesh(fixed,p.porcelain,[[s*.48,-.7,-.03],[s*.71,-.23,-.06],[s*.67,.4,-.06],[s*.45,.85,-.03],[s*.13,1.02,0]],.13,.002,.025);
  for(let i=0;i<9;i++){const a=i*TAU/9;curveMesh(fixed,p.wood,[[0,-.56,0],[Math.sin(a)*.17,-.67,Math.cos(a)*.17],[Math.sin(a)*.37,-.69,Math.cos(a)*.37]],.027,.004);}
  ellipsoid(fixed,p.gold,.16,.22,.13,0,-.49,0);
  tube(fixed,p.green,[[0,-.5,0],[-.06,-.15,.03],[.02,.2,0],[0,.49,0]],.025,36,8);
  for(const s of [-1,1])for(let j=0;j<2;j++){
    const group=new T.Group();group.position.set(0,-.16+j*.29,0);group.rotation.z=-s*(.85+j*.22);group.rotation.y=s*.4;fixed.add(group);
    part(group,bladeGeometry(.44,.14,.09),p.green);
    tube(group,p.brass,[[0,0,.016],[0,.2,.04],[0,.42,.09]],.004,18,4);
    for(let v=1;v<6;v++){const y=v*.06,w=.13*Math.sin(y/.44*Math.PI);for(const sign of [-1,1])tube(group,p.gold,[[0,y,.03],[sign*w*.5,y+.02,.045],[sign*w,y+.03,.04]],.0025,6,3);}
  }
  const flower=new T.Group();flower.position.y=.47;root.add(flower);
  for(let layer=0;layer<2;layer++)for(let i=0;i<7;i++){
    const petal=new T.Group();petal.rotation.y=i*TAU/7+layer*.4;flower.add(petal);const l=leaf(petal,layer?p.porcelain:p.gold,.27-layer*.04,.07,0,0,0,0);l.rotation.x=1.05-layer*.4;
  }
  for(let i=0;i<9;i++){const a=i*TAU/9;tube(flower,p.brass,[[0,0,0],[Math.sin(a)*.06,.13,Math.cos(a)*.06]],.005,6,4);ellipsoid(flower,p.glow,.016,.022,.016,Math.sin(a)*.06,.13,Math.cos(a)*.06);}
  fuse(fixed);fuse(flower);
  return (t:number,a:Motion,still:boolean)=>{flower.rotation.y=still?0:Math.sin(t*.35)*.12;flower.scale.setScalar(1+a.defense*.12);};
}

function ribbon(root:T.Group,p:Palette) {
  const N=112,W=12,positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let layer=0;layer<2;layer++)for(let i=0;i<=N;i++)for(let j=0;j<=W;j++){positions.push(0,0,0);uv.push(i/N,j/W);}
  const row=W+1,layerSize=(N+1)*row;
  for(let layer=0;layer<2;layer++)for(let i=0;i<N;i++)for(let j=0;j<W;j++){
    const a=layer*layerSize+i*row+j,b=a+row;
    if(layer===0)indices.push(a,b,a+1,b,b+1,a+1);else indices.push(a,a+1,b,b,a+1,b+1);
  }
  for(let i=0;i<N;i++)for(const j of [0,W]){const a=i*row+j,b=a+row;indices.push(a,a+layerSize,b,b,a+layerSize,b+layerSize);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  const ribbon=part(root,geometry,p.gold);ribbon.frustumCulled=false;
  const fixed=new T.Group();root.add(fixed);turned(fixed,p.dark,[[0,-.84],[.29,-.84],[.31,-.8],[.26,-.74],[0,-.74]]);ring(fixed,p.brass,.29,.018,0,-.78,0).rotation.x=Math.PI/2;fuse(fixed);
  let previous=NaN;
  return (t:number,a:Motion,still:boolean)=>{
    const bend=a.bend*(still?.65:.65+Math.sin(t*1.3)*.2);if(Math.abs(previous-bend)<.0001)return;previous=bend;
    const attr=geometry.attributes.position;
    for(let layer=0;layer<2;layer++)for(let i=0;i<=N;i++)for(let j=0;j<=W;j++){
      const u=i/N*TAU,side=j/W*2-1,width=.18+.055*Math.cos(u*3),twist=u+Math.sin(u)*.3+bend*Math.sin(u*2);
      const x=.55*Math.sin(u)+side*width*Math.cos(twist),y=.77*Math.cos(u)+.035*Math.sin(u*3),z=.27*Math.sin(2*u)+side*width*Math.sin(twist)+(layer===0?1:-1)*.013;
      const h=(y+.8)/1.6;
      attr.setXYZ(layer*layerSize+i*row+j,x+bend*h*h*.48,y*(1-bend*.12),z+bend*Math.sin(h*Math.PI)*.14);
    }
    attr.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  };
}

export function createArtwork(item:Curiosity):Artwork {
  const root=new T.Group();root.name='artwork-'+item.shape;
  const p=palette(item.color);
  const builders={bird,orb:relic,chair:armchair,portal:(r:T.Group,p:Palette)=>zipper(r,p),creature:guardian,trophy:astrolabe,seed:sanctuary,ribbon};
  const animation=builders[item.shape](root,p);
  const overlay=item.behaviors.includes('zip')&&item.shape!=='portal'?zipper(root,p,false):undefined;
  if(item.image&&typeof document!=='undefined'){
    const texture=new T.TextureLoader().load(item.image);texture.colorSpace=T.SRGBColorSpace;
    const frame=new T.Group();root.add(frame);
    const secretFrame=item.behaviors.includes('zip');frame.position.set(secretFrame?0:.75,secretFrame?0:-.42,secretFrame?.09:.43);
    const w=secretFrame?1.19:.42,h=secretFrame?1.48:.51;box(frame,p.brass,w+.05,h+.05,.035,0,0,0,.01);part(frame,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture}),0,0,.025);
  }
  // Generic reassembly preserves entire articulated assemblies.
  const assemblies=root.children.map((child,i)=>({child,rest:child.position.clone(),offset:new T.Vector3(Math.sin(i*2.4)*.16,Math.cos(i*1.7)*.1,Math.sin(i*3.1)*.13)}));
  const zero:Motion={rescue:0,flight:0,salon:0,zip:0,silly:0,trophy:0,defense:0,bend:0};
  const animate=(t:number,a:Motion,still:boolean,look?:T.Vector2)=>{
    if(item.behaviors.includes('rescue')&&item.shape!=='orb')assemblies.forEach(({child,rest,offset})=>child.position.copy(rest).addScaledVector(offset,1-a.rescue));
    animation(t,a,still,look);overlay?.(t,a);
  };
  animate(0,zero,true);
  return {root,animate};
}

export function geometryStats(root:T.Object3D){
  let meshes=0,triangles=0,vertices=0;const materials=new Set<T.Material>();
  root.traverse(o=>{if(o instanceof T.Mesh){meshes++;vertices+=o.geometry.attributes.position.count;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
  return {meshes,triangles,vertices,materials:materials.size};
}
