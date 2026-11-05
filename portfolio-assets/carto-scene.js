import * as THREE from '/elec/three.module.js';
import {OrbitControls} from '/elec/OrbitControls.js';
import {createDemandLoop} from './carto-loop.js';
import {flowNodes,flowLinks,flowWorldPoint,flowCameraBounds,flowLinkKey} from './carto-data.js';
                                                                                                
                                                                                            
/** The 11 platforms and 10 pipes are static. Only an explicit demo keeps RAF alive. */
export function createFlowScene(host            ,onError         )          {
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setClearColor('#0b1525',0);const canvas=renderer.domElement;canvas.dataset.cartoRenderer='three';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-130,130,85,-85,.1,1000);camera.position.set(0,220,160);camera.lookAt(0,0,0);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.enablePan=true;controls.minZoom=.6;controls.maxZoom=2;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2.25;
 const vector=(id       )=>{const p=flowWorldPoint(flowNodes.find(n=>n.id===id) );return new THREE.Vector3(p.x,p.y,p.z);};
 const positions=new Map(flowNodes.map(n=>[n.id,vector(n.id)])),plates=new Map                                                              (),pipes                                                                                            =[];
 const box=new THREE.BoxGeometry(34,2.4,19),cone=new THREE.ConeGeometry(1.1,3.3,8),dotGeometry=new THREE.SphereGeometry(.9,8,6),materials                 =[],geometries                       =[box,cone,dotGeometry];
 const makeMaterial=(color       ,opacity=1)=>{const material=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity});materials.push(material);return material;};
 const floorGeometry=new THREE.BoxGeometry(46,.5,138);geometries.push(floorGeometry);
 for(let stage=0;stage<4;stage++){const floor=new THREE.Mesh(floorGeometry,makeMaterial(['#19324c','#30284b','#173d3a','#403427'][stage],.46));floor.position.set((140+260*stage-530)/5,-5,0);scene.add(floor);}
 for(const node of flowNodes){const plate=new THREE.Mesh(box,makeMaterial(node.color));plate.position.copy(positions.get(node.id) );scene.add(plate);plates.set(node.id,plate);}
 for(const link of flowLinks){const start=positions.get(link.source) .clone().add(new THREE.Vector3(17,0,0)),end=positions.get(link.target) .clone().add(new THREE.Vector3(-17,0,0));const curve=new THREE.CubicBezierCurve3(start,start.clone().add(new THREE.Vector3(11,0,0)),end.clone().add(new THREE.Vector3(-11,0,0)),end);const geometry=new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));geometries.push(geometry);const lineMaterial=new THREE.LineBasicMaterial({color:'#58718e',transparent:true,opacity:.55});materials.push(lineMaterial);const line=new THREE.Line(geometry,lineMaterial);scene.add(line);const arrow=new THREE.Mesh(cone,makeMaterial('#58718e'));arrow.position.copy(curve.getPoint(.96));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangent(.96).normalize());scene.add(arrow);const dot=new THREE.Mesh(dotGeometry,makeMaterial('#ddfff5'));scene.add(dot);dot.visible=false;pipes.push({id:flowLinkKey(link),line,arrow,curve,dot});}
 let state               ={selected:null,nodes:[],links:[],animate:false},visible=true,alive=true,contextActive=true,clock=0,lastPaint=0;
 const labelElements=[...host.querySelectorAll                   ('[data-flow-node]')];
 const allowed=()=>alive&&visible&&contextActive&&!document.hidden;
 const draw=(delta       )=>{clock+=delta;
  if(state.animate&&delta&&clock-lastPaint<1/30)return;lastPaint=clock;
  pipes.forEach((p,i)=>{p.dot.visible=state.animate&&(!state.links.length||state.links.includes(p.id));if(p.dot.visible)p.dot.position.copy(p.curve.getPoint((clock*.22+i*.17)%1));});
  renderer.render(scene,camera);
  for(const element of labelElements){const position=positions.get(element.dataset.flowNode ) .clone().add(new THREE.Vector3(0,4,0)).project(camera);element.style.transform=`translate(${(position.x*.5+.5)*host.clientWidth}px,${(-position.y*.5+.5)*host.clientHeight}px) translate(-50%,-70%)`;element.style.visibility=position.z< -1||position.z>1?'hidden':'visible';}
 };
 const loop=createDemandLoop({request:fn=>window.requestAnimationFrame(fn),cancel:id=>window.cancelAnimationFrame(id),active:allowed,continuous:()=>state.animate,draw:delta=>{try{draw(delta);}catch{contextActive=false;onError();}}});
 const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),bounds=flowCameraBounds(w,h);host.dataset.small=String(w<650);host.style.setProperty('--flow-compact-width',`${Math.min(72,w*.2)}px`);host.style.setProperty('--flow-card-width',`${Math.min(146,w*.18)}px`);camera.left=bounds.left;camera.right=bounds.right;camera.top=bounds.top;camera.bottom=bounds.bottom;camera.updateProjectionMatrix();renderer.setSize(w,h,false);loop.request();};
 const visibility=()=>{if(allowed())loop.request();else loop.pause();};
 const observer=new ResizeObserver(resize);observer.observe(host);const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;visibility();});intersection.observe(host);document.addEventListener('visibilitychange',visibility);controls.addEventListener('change',loop.request);
 const lost=(event      )=>{event.preventDefault();contextActive=false;loop.pause();onError();};canvas.addEventListener('webglcontextlost',lost);
 const reset=()=>{camera.position.set(0,220,160);camera.zoom=1;camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();loop.request();};
 resize();
 return {update:next=>{state=next;controls.enabled=!!next.interactive;canvas.style.pointerEvents=next.interactive?'auto':'none';canvas.style.touchAction=next.interactive?'none':'pan-y';const related=new Set(next.nodes);for(const node of flowNodes){const material=plates.get(node.id) .material;material.color.set(node.color).multiplyScalar(next.nodes.length&&!related.has(node.id) ? .16 : node.id===next.selected ? .85 : .42);}
 for(const p of pipes){const highlighted=next.links.includes(p.id),color=highlighted?'#8cf5d0':'#58718e';(p.line.material                           ).color.set(color);(p.line.material                           ).opacity=next.links.length?(highlighted?1:.13):.55;(p.arrow.material                           ).color.set(color);p.arrow.visible=!next.links.length||highlighted;}
 loop.pause();loop.request();},reset,dispose:()=>{if(!alive)return;alive=false;loop.dispose();observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);controls.removeEventListener('change',loop.request);controls.dispose();canvas.removeEventListener('webglcontextlost',lost);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();canvas.remove();for(const element of labelElements){element.style.removeProperty('transform');element.style.removeProperty('visibility');}}};
}
