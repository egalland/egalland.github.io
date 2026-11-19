"use client";
import {useCallback,useEffect,useState} from "react";import Link from "next/link";
import {statusLabels,type Project,type Status} from "../lib/projects";
type Session={id:number;startedAt:string;pausedAt:string|null;stoppedAt:string|null;accumulatedSeconds:number};
export default function ProjectEditor({id}:{id:string}){
 const [project,setProject]=useState<Project|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState(""),[saving,setSaving]=useState(false);
 const [session,setSession]=useState<Session|null>(null),[clock,setClock]=useState(Date.now());
 const load=useCallback(async()=>{try{const r=await fetch("/api/projects");const x=await r.json() as {error?:string;projects:Project[]};if(!r.ok)throw new Error(x.error);const p=(x.projects as Project[]).find(p=>p.id===id);if(!p)throw new Error("Projet introuvable");setProject(p);const s=await fetch(`/api/sessions?projectId=${encodeURIComponent(id)}`);if(s.ok)setSession(((await s.json()) as {session:Session|null}).session)}catch(e){setError(e instanceof Error?e.message:"Erreur")}},[id]);
 useEffect(()=>{void load();const interval=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(interval)},[load]);
 async function save(e:React.FormEvent){e.preventDefault();if(!project)return;setSaving(true);setError("");try{const r=await fetch("/api/projects",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,description:project.description,progress:project.progress,status:project.status,demoUrl:project.demoUrl||null,workUrl:project.workUrl||null,repositoryUrl:project.repositoryUrl||null})});const x=await r.json() as {error?:string};if(!r.ok)throw new Error(x.error);setNotice("Modifications enregistrées.")}catch(e){setError(e instanceof Error?e.message:"Erreur")}finally{setSaving(false)}}
 async function timer(action:"start"|"pause"|"resume"|"stop"){setError("");try{const r=await fetch("/api/sessions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({projectId:id,action})});const x=await r.json() as {error?:string;session:Session};if(!r.ok)throw new Error(x.error);setSession(action==="stop"?null:x.session);if(action==="stop")await load()}catch(e){setError(e instanceof Error?e.message:"Erreur")}}
 async function copyPrompt(){if(!project)return;const prompt=`PROJECT_ID: ${project.id}
PROJECT_NAME: ${project.name}

Tu travailles sur ${project.id}. Conserve cet identifiant permanent.

CONTEXTE
${project.description}
Statut : ${project.status}. Progression estimée : ${project.progress}%.

WORK SYNC CONTRACT
1. Conserve PROJECT_ID dans .portfolio/project.json.
2. Mets à jour lastWorkedAt et le changelog.
3. Actualise progress uniquement quand le travail le justifie.
4. Mets à jour les métriques Git connues et les prompts comptables.
5. N'invente jamais le temps réel passé.
6. Sépare toujours les métriques estimées des métriques mesurées.

À la fin, résume les changements et ce qui reste à faire.`;try{await navigator.clipboard.writeText(prompt);setNotice("Prompt Work copié.")}catch{setError("Copie indisponible sur cet appareil.")}}
 if(!project)return <main className="inner"><Link href="/lab" className="eyebrow">← PROJECT LAB</Link><p>{error||"CHARGEMENT…"}</p></main>;
 const seconds=(session?.accumulatedSeconds??0)+(session&&!session.pausedAt?Math.max(0,Math.floor((clock-new Date(session.startedAt).getTime())/1000)):0);
 const time=[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,"0")).join(":");
 return <main className="inner"><Link href="/lab" className="eyebrow">← PROJECT LAB</Link><h1 className="page-title">{project.name}</h1><span className="eyebrow">{project.id} / PERMANENT ID</span><div className="lab-toolbar"><button onClick={()=>void copyPrompt()}>CREATE WORK PROMPT ↗</button>{project.workUrl&&<a className="action secondary" href={project.workUrl} target="_blank" rel="noopener noreferrer">OPEN WORK ↗</a>}<Link className="action secondary" href={`/projects/${project.slug}`}>PUBLIC PAGE ↗</Link></div><div className="detail-grid" style={{marginTop:30}}><div><form className="lab-edit" onSubmit={save}><label>DESCRIPTION<textarea value={project.description} onChange={e=>setProject({...project,description:e.target.value})}/></label><label>STATUT<select value={project.status} onChange={e=>setProject({...project,status:e.target.value as Status})}>{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>PROGRESSION ESTIMÉE / {project.progress}%<input type="range" min="0" max="100" value={project.progress} onChange={e=>setProject({...project,progress:Number(e.target.value)})}/></label><label>URL DÉMO<input type="url" value={project.demoUrl??""} onChange={e=>setProject({...project,demoUrl:e.target.value})}/></label><label>URL WORK<input type="url" value={project.workUrl??""} onChange={e=>setProject({...project,workUrl:e.target.value})}/></label><label>URL SOURCE<input type="url" value={project.repositoryUrl??""} onChange={e=>setProject({...project,repositoryUrl:e.target.value})}/></label><button disabled={saving}>{saving?"ENREGISTREMENT…":"SAVE CHANGES ↗"}</button></form></div><aside><span className="eyebrow">WORK SESSION / TRACKED TIME</span><div style={{fontSize:"clamp(52px,6vw,90px)",letterSpacing:"-.08em",margin:"18px 0"}}>{time}</div><div className="lab-toolbar">{!session?<button onClick={()=>void timer("start")}>START SESSION</button>:session.pausedAt?<><button onClick={()=>void timer("resume")}>RESUME</button><button onClick={()=>void timer("stop")}>STOP</button></>:<><button onClick={()=>void timer("pause")}>PAUSE</button><button onClick={()=>void timer("stop")}>STOP</button></>}</div><p className="disclosure">La session est sauvegardée côté serveur et reste disponible après la fermeture de cette page.</p>{project.lastWorkedAt&&<p className="disclosure">Dernière édition : {new Date(project.lastWorkedAt).toLocaleString("fr-FR")}</p>}</aside></div>{notice&&<p role="status">{notice}</p>}{error&&<p className="lab-error" role="alert">{error}</p>}</main>
}
