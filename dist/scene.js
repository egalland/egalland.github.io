import * as THREE from './vendor/three.module.js';
import {buildGarment,GARMENT_KINDS} from './model-garments.js';
import {buildObject} from './model-objects.js';
import {makeFabric} from './fabric.js';
import {SoftwareRenderer} from './software.js';
import {buildRaglanPull} from './raglan-model.js';
import {pullGuide,pullSheet,pullCoverage,placementOnPull} from './pull-guide.js';

export function buildPiece(project,low=false){
  if(project.kind==='pull'){
    const guide=pullGuide(project);
    if(guide.pieces.length&&!guide.construction.error)return buildRaglanPull(project,guide.construction,low);
  }
  const isGarment=Array.from(GARMENT_KINDS).includes(project.kind);
  return isGarment?buildGarment(project,low):buildObject(project,low);
}
const weightsByMesh=new WeakMap(),fabricByModel=new WeakMap();
// Weight each cell by the physical area of the triangles using it. A front
// panel, a back panel and the ends of a tapered sleeve use different UV areas.
export function meshCellAreas(mesh,nx,ny,transform=mesh.matrixWorld){
  const cached=weightsByMesh.get(mesh);
  if(cached?.nx===nx&&cached.ny===ny)return cached;
  const g=mesh.geometry,pos=g.attributes.position,uv=g.attributes.uv,idx=g.index;
  const weights=new Float64Array(nx*ny),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const limit=idx?idx.count:pos.count, cells=[];
  let area=0;
  for(let t=0;t<limit;t+=3){
    const ia=idx?idx.getX(t):t,ib=idx?idx.getX(t+1):t+1,ic=idx?idx.getX(t+2):t+2;
    a.fromBufferAttribute(pos,ia).applyMatrix4(transform);
    b.fromBufferAttribute(pos,ib).applyMatrix4(transform);
    c.fromBufferAttribute(pos,ic).applyMatrix4(transform);
    const size=b.sub(a).cross(c.sub(a)).length()*.5;
    if(size<1e-12)continue;
    area+=size;cells.length=0;
    const ax=uv.getX(ia)*nx,bx=uv.getX(ib)*nx,cx=uv.getX(ic)*nx;
    const ay=(1-uv.getY(ia))*ny,by=(1-uv.getY(ib))*ny,cy=(1-uv.getY(ic))*ny;
    const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
    if(Math.abs(det)>1e-10){
      const left=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),right=Math.min(nx-1,Math.floor(Math.max(ax,bx,cx)-.5));
      const top=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),bottom=Math.min(ny-1,Math.floor(Math.max(ay,by,cy)-.5));
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
        const l=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/det;
        const m=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/det;
        if(l>=-1e-7&&m>=-1e-7&&l+m<=1.0000001)cells.push(y*nx+x);
      }
    }
    if(!cells.length){
      const x=Math.min(nx-1,Math.max(0,Math.floor((ax+bx+cx)/3))),y=Math.min(ny-1,Math.max(0,Math.floor((ay+by+cy)/3)));
      cells.push(y*nx+x);
    }
    const perCell=size/cells.length;
    for(const i of cells)weights[i]+=perCell;
  }
  const result={nx,ny,area,weights};weightsByMesh.set(mesh,result);return result;
}
export function dress(root,p,maxSide=1200){
  root.updateMatrixWorld(true);
  const fromWorld=root.matrixWorld.clone().invert();
  const sheets=new Map(),shares=p.yarns.map(()=>0),patterned=p.yarns.map(()=>0),previous=new Set();
  const last=fabricByModel.get(root)||new Map();
  const guide=pullGuide(p),physicalCoverage=pullCoverage(p,guide);
  const yarnKey=JSON.stringify([maxSide,p.stitch,p.gauge.stitches,p.gauge.rows,p.yarns.map(y=>[y.id,y.color,y.weight,y.fiber,y.heldWith])]);
  const motifKey=JSON.stringify([p.grid,p.motif]);
  let total=0;
  root.traverse(mesh=>{
    const k=mesh.userData.knit;if(!mesh.isMesh||!k)return;
    const piece=guide?.byId.get(k.pullPiece);
    const editable=k.part!=='rib'&&k.part!=='trim'&&(p.motif.layout==='repeat'||p.motif.layout==='yoke'||p.motif.surface===k.surface);
    const key=piece?JSON.stringify([piece.id,k.inside,p.pullDesign.base[piece.id],p.pullDesign.edits[piece.id]])+yarnKey+motifKey:
      JSON.stringify([k.part,k.surface,k.widthCm,k.heightCm,k.style,k.accent,k.inside,k.circular])+yarnKey+(editable?motifKey:'');
    let sheet=sheets.get(key)||last.get(key);
    if(!sheet){
      const fabric=makeFabric(p,k,maxSide,piece?pullSheet(p,guide,piece):null),map=new THREE.CanvasTexture(fabric.canvas);
      map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
      const material=new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.018,color:k.inside?0xb5afa6:0xffffff,roughness:.97,metalness:0,side:THREE.DoubleSide});
      sheet={...fabric,material};
    }
    sheets.set(key,sheet);
    if(mesh.material!==sheet.material)previous.add(mesh.material);
    mesh.material=sheet.material;
    if(k.inside||physicalCoverage)return;
    const {area,weights}=meshCellAreas(mesh,sheet.nx,sheet.ny,fromWorld.clone().multiply(mesh.matrixWorld));total+=area;
    if(!editable){shares[Number.isInteger(k.accent)?Math.min(k.accent,shares.length-1):0]+=area;return;}
    for(let i=0;i<weights.length;i++){
      const cell=sheet.cells[i],color=cell&127;
      shares[color]+=weights[i];if(cell&128)patterned[color]+=weights[i];
    }
  });
  const live=new Set(Array.from(sheets.values(),s=>s.material));
  for(const mat of previous)if(!live.has(mat)){mat?.map?.dispose();mat?.dispose();}
  fabricByModel.set(root,sheets);
  return physicalCoverage||{shares:shares.map(v=>v/Math.max(total,.001)),patterned:patterned.map(v=>v/Math.max(total,.001))};
}
function disposeModel(root){
  if(!root)return;
  const materials=new Set(),geometries=new Set();
  root.traverse(obj=>{if(obj.isMesh){geometries.add(obj.geometry);materials.add(obj.material);}});
  for(const mat of materials){mat?.map?.dispose();mat?.dispose();}for(const geo of geometries)geo.dispose();
}
export class AtelierScene{
  constructor(canvas,onPlace,onCoverage){
    this.canvas=canvas;this.onPlace=onPlace;this.onCoverage=onCoverage;
    this.turn=-.23;this.tilt=.055;this.zoom=1;this.mode='rotate';this.scheduled=false;
    const options={alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'};
    let gl=null,gpu;
    try{gl=canvas.getContext('webgl2',options);if(gl)gpu=new THREE.WebGLRenderer({...options,canvas,context:gl});}catch{}
    if(!gpu&&gl){const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);this.canvas=canvas=replacement;}
    this.renderer=gpu||new SoftwareRenderer(canvas);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    if(gpu){this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;}
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.05,50);
    this.camera.position.set(0,0,8);this.camera.lookAt(0,0,0);
    this.scene.add(new THREE.HemisphereLight(0xfff8ec,0x777e71,1.65));
    const key=new THREE.DirectionalLight(0xfff5e8,2.15);key.position.set(-4,6,5);this.scene.add(key);
    const edge=new THREE.DirectionalLight(0xe4ebed,1.0);edge.position.set(3,3,-2);this.scene.add(edge);
    this.pivot=new THREE.Group();this.scene.add(this.pivot);
    this.ray=new THREE.Raycaster();this.input();
    this.resizeWatch=new ResizeObserver(()=>this.resize());this.resizeWatch.observe(canvas.parentElement);
  }
  setProject(p,editing=false){
    const phone=window.matchMedia('(max-width:740px)').matches;
    const textureSize=editing?512:phone?(this.renderer.isSoftware?768:1100):(this.renderer.isSoftware?1024:1600);
    const shape=JSON.stringify([p.kind,p.form,p.measures,p.collar,p.kind==='pull'?[p.gauge.stitches,p.gauge.rows,p.stitch]:null]);
    const look=JSON.stringify([textureSize,p.grid,p.motif,p.stitch,p.gauge,p.kind==='pull'?p.pullDesign:null,p.yarns.map(y=>[y.color,y.fiber,y.weight,y.heldWith,y.id])]);
    if(this.shape===shape&&this.look===look)return;
    this.project=p;
    if(this.shape!==shape){
      if(this.root){this.pivot.remove(this.root);disposeModel(this.root);}
      this.root=buildPiece(p,!!this.renderer.isSoftware);
      this.root.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(this.root),center=box.getCenter(new THREE.Vector3());
      this.size=box.getSize(new THREE.Vector3());this.root.position.sub(center);
      this.root.updateMatrixWorld(true);this.pivot.add(this.root);this.shape=shape;
    }
    this.look=look;
    this.coverage=dress(this.root,p,textureSize);
    this.onCoverage?.(this.coverage);this.resize();
  }
  resize(){
    const w=this.canvas.parentElement.clientWidth,h=this.canvas.parentElement.clientHeight;
    if(w<1||h<1||!this.root)return;
    if(this.w!==w||this.h!==h){this.renderer.setSize(w,h,false);this.w=w;this.h=h;}
    const aspect=w/h;
    this.camera.left=-aspect;this.camera.right=aspect;this.camera.top=1;this.camera.bottom=-1;
    const fit=Math.max(this.size.y,this.size.x/aspect,this.size.z/aspect,.01);
    this.pivot.scale.setScalar(1.70/fit);
    this.request();
  }
  request(){
    if(this.scheduled)return;this.scheduled=true;
    requestAnimationFrame(()=>{this.scheduled=false;this.render();});
  }
  render(){
    if(!this.root||!this.w)return;
    this.pivot.rotation.set(this.tilt,this.turn,0,'YXZ');
    this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene,this.camera);
  }
  snapshot(width=1000,height=800){
    if(!this.root)return null;
    const canvas=document.createElement('canvas'),renderer=new SoftwareRenderer(canvas);
    renderer.setSize(width,height);
    const aspect=width/height,stage=new THREE.Scene(),pivot=new THREE.Group();
    pivot.add(this.root.clone(true));stage.add(pivot);
    pivot.scale.setScalar(1.69/Math.max(this.size.y,this.size.x/aspect,this.size.z/aspect,.01));
    pivot.rotation.set(this.tilt,this.turn,0,'YXZ');
    const camera=new THREE.OrthographicCamera(-aspect,aspect,1,-1,.05,50);
    camera.position.z=8;camera.lookAt(0,0,0);camera.zoom=this.zoom;camera.updateProjectionMatrix();
    renderer.render(stage,camera);
    const ctx=canvas.getContext('2d');ctx.globalCompositeOperation='destination-over';
    ctx.fillStyle='#f4f1e7';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
    return canvas;
  }
  changeView(back=false){this.zoom=1;this.tilt=.055;this.turn=back?Math.PI-.20:-.23;this.request();}
  zoomBy(delta){this.zoom=Math.max(.65,Math.min(2.4,this.zoom+delta));this.request();}
  hit(event){
    const r=this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),this.camera);
    return this.ray.intersectObject(this.root,true).find(h=>h.uv&&h.object.userData.knit&&['body','sleeve'].includes(h.object.userData.knit.part));
  }
  input(){
    let drag=null;
    const point=(event,final=false)=>{
      const hit=this.hit(event);
      if(hit){
        const k=hit.object.userData.knit;
        const location=k.pullPiece?placementOnPull(this.project,k.pullPiece,hit.uv):
          {u:Math.max(0,Math.min(1,hit.uv.x)),v:Math.max(0,Math.min(1,hit.uv.y)),surface:k.surface};
        if(location||final)this.onPlace?.(location,final);
      }
      else if(final)this.onPlace?.(null,true);
    };
    this.canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0||!this.root||drag)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);
      if(this.mode==='place')point(e);
    });
    this.canvas.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      if(this.mode==='place')point(e);
      else {this.turn+=(e.clientX-drag.x)*.012;this.tilt=Math.max(-.85,Math.min(.85,this.tilt+(e.clientY-drag.y)*.009));this.request();}
      drag.x=e.clientX;drag.y=e.clientY;
    });
    const end=e=>{if(!drag||e.pointerId!==drag.id)return;if(this.mode==='place')point(e,true);drag=null;};
    this.canvas.addEventListener('pointerup',end);this.canvas.addEventListener('pointercancel',end);
    this.canvas.addEventListener('lostpointercapture',()=>{if(drag&&this.mode==='place')this.onPlace?.(null,true);drag=null;});
    this.canvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
      if(this.mode==='rotate'){this.turn+=e.key==='ArrowLeft'?-.18:e.key==='ArrowRight'?.18:0;this.tilt+=e.key==='ArrowUp'?-.08:e.key==='ArrowDown'?.08:0;this.request();}
    });
  }
}
