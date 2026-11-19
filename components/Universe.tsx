"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Project } from "../lib/projects";
const colors={business:0xf16c46,personal:0xb7c3a8,data:0xe8c65b,games:0x91a7e6,ideas:0x80796d};
export default function Universe({projects}:{projects:Project[]}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const [mode,setMode]=useState<"universe"|"index">("universe");
 const [active,setActive]=useState<Project|null>(null);
 const [reduced,setReduced]=useState(false),[available,setAvailable]=useState(true);
 useEffect(()=>{setReduced(matchMedia("(prefers-reduced-motion: reduce)").matches);if(matchMedia("(max-width: 700px)").matches)setMode("index")},[]);
 useEffect(()=>{
  if(mode!=="universe"||!canvas.current)return;
  let disposed=false,cleanup=()=>{};
  import("three").then(T=>{
   if(disposed||!canvas.current)return;const el=canvas.current;let renderer:InstanceType<typeof T.WebGLRenderer>;
   try{renderer=new T.WebGLRenderer({canvas:el,alpha:true,antialias:true})}catch{setAvailable(false);setMode("index");return}
   renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.1,100),group=new T.Group();camera.position.set(0,1.2,14);scene.add(group);
   scene.add(new T.AmbientLight(0xffffff,1.2));const light=new T.PointLight(0xffffff,90);light.position.set(-4,5,8);scene.add(light);
   const meshes:InstanceType<typeof T.Mesh>[]=[];
   projects.slice(0,20).forEach((p,i)=>{const ring=Math.floor(i/7),a=i%7/7*Math.PI*2+ring*.3,r=ring===0?3.1:ring===1?5.6:7.5,s=.38+p.progress/500;
    const geo=i%3===0?new T.IcosahedronGeometry(s,1):i%3===1?new T.OctahedronGeometry(s*1.2,1):new T.BoxGeometry(s*1.6,s*1.6,s*1.6);
    const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color:colors[p.category],metalness:.42,roughness:.3,flatShading:true,emissive:colors[p.category],emissiveIntensity:.08}));
    mesh.position.set(Math.cos(a)*r,(ring-1)*1.1+Math.sin(a*2)*.55,Math.sin(a)*r*.26-ring*.55);mesh.userData.index=i;group.add(mesh);meshes.push(mesh);
    const halo=new T.Mesh(new T.TorusGeometry(.6+p.progress/500,.008,3,64),new T.MeshBasicMaterial({color:colors[p.category],transparent:true,opacity:.38}));halo.position.copy(mesh.position);halo.rotation.x=.55;group.add(halo);
   });
   const grid=new T.GridHelper(23,30,0x515354,0x333a3b);grid.position.y=-2.25;scene.add(grid);
   const ray=new T.Raycaster(),pointer=new T.Vector2();let hover=-1,drag=false,lastX=0,raf=0;
   const resize=()=>{const r=el.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false)};const observer=new ResizeObserver(resize);observer.observe(el);resize();
   const pick=(ev:PointerEvent)=>{const r=el.getBoundingClientRect();pointer.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(meshes)[0];hover=hit?Number(hit.object.userData.index):-1;el.style.cursor=hit?"pointer":"grab";setActive(hit?projects[hover]:null)};
   const down=(ev:PointerEvent)=>{drag=true;lastX=ev.clientX;el.setPointerCapture(ev.pointerId)},move=(ev:PointerEvent)=>{if(drag){group.rotation.y+=(ev.clientX-lastX)*.005;lastX=ev.clientX}else pick(ev)},up=()=>{drag=false},click=(ev:MouseEvent)=>{pick(ev as PointerEvent);if(hover>=0)window.location.href=`/projects/${projects[hover].slug}`};
   el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("click",click);
   const animate=()=>{if(!reduced){group.rotation.y+=.0008;meshes.forEach((m,i)=>{m.rotation.x+=.002+i*.00005;m.rotation.y+=.003})}renderer.render(scene,camera);raf=requestAnimationFrame(animate)};animate();
   cleanup=()=>{cancelAnimationFrame(raf);observer.disconnect();el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.removeEventListener("click",click);scene.traverse(obj=>{if(obj instanceof T.Mesh){obj.geometry.dispose();const m=obj.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose()}});renderer.dispose()};
  }).catch(()=>{setAvailable(false);setMode("index")});return()=>{disposed=true;cleanup()};
 },[mode,reduced,projects]);
 return <section className="universe-section" aria-label="Explorer les projets"><div className="universe-top"><span>FIG. 01 / PROJECT UNIVERSE</span><div className="switches"><button aria-pressed={mode==="universe"} onClick={()=>setMode("universe")} disabled={!available}>UNIVERSE</button><button aria-pressed={mode==="index"} onClick={()=>setMode("index")}>INDEX 2D</button></div></div>
 {mode==="universe"&&available?<div className="universe-frame"><canvas ref={canvas} aria-label="Carte spatiale interactive des projets"/><div className="scene-note">DRAG TO ORBIT<br/>CLICK TO EXPLORE</div><div className="scene-counter">{String(projects.length).padStart(2,"0")} / PROJECTS</div>{active&&<div className="scene-tooltip"><small>{active.id} / {active.category.toUpperCase()}</small><strong>{active.name}</strong><span>OPEN PROJECT ↗</span></div>}</div>:<div className="project-index">{projects.map(p=><Link key={p.id} href={`/projects/${p.slug}`} className="index-row"><span>{p.id}</span><strong>{p.name}</strong><em>{p.category.toUpperCase()}</em><b>↗</b></Link>)}</div>}
 <div className="universe-bottom"><span>OBJECT SIZE / PROGRESS · COLOR / CATEGORY</span><button onClick={()=>setReduced(!reduced)}>{reduced?"ENABLE":"REDUCE"} MOTION</button></div></section>;
}
