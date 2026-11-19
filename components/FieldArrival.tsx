'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,Compass,Radio,RotateCcw} from 'lucide-react';
import {artUrl,requestArtwork} from '@/lib/field-assets';
import type {Face} from '@/lib/planet';

type Props={face:Face;worldReady:boolean;hasCamp:boolean;lobby:boolean;fault:string;begin:()=>void;observe:()=>void;retry:()=>void};
const mainLayers=['terrain-materials','terrain-landforms','terrain-scenery','wool-ore-deposits','wool-worker-directions','animated-world'];

export default function FieldArrival({face,worldReady,hasCamp,lobby,fault,begin,observe,retry}:Props){
  const [layers,setLayers]=useState({face,done:0,failed:0}),[skip,setSkip]=useState(false);
  const [entered,setEntered]=useState(false);
  useEffect(()=>{
    if(entered)return;
    let active=true,done=0,failed=0;
    setLayers({face,done,failed});
    for(const key of ['surface-'+face,...mainLayers]){
      const asset=requestArtwork(key);
      void asset?.ready.then(ok=>{if(!active)return;done++;if(!ok)failed++;setLayers({face,done,failed});});
    }
    return()=>{active=false;};
  },[face,entered]);
  const total=mainLayers.length+1,done=layers.face===face?layers.done:0,loaded=worldReady&&(done===total||skip);
  useEffect(()=>{if(loaded&&(hasCamp||!lobby))setEntered(true);},[loaded,hasCamp,lobby]);
  if(entered || loaded&&(hasCamp||!lobby))return null;
  const progress=done+Number(worldReady);
  return <section className="field-arrival" aria-label="Arrivée sur Strigius">
    <img className="field-panorama" src={artUrl('sector-arrival')} alt="" fetchPriority="high"/>
    <div className="field-arrival-copy">
      <span className="field-signal"><Radio size={15}/> {worldReady?'Liaison établie':'Liaison orbitale'}</span>
      <h1>Strigius</h1>
      <p>{loaded?'Les convois se croisent au comptoir. Établis ton camp, puis envoie tes ouvriers chercher du fer et du cuivre.':'Ouverture de la carte et préparation du terrain.'}</p>
      {(!loaded||fault&&!worldReady)&&<div className="field-loading" role="status" aria-live="polite">
        <progress value={progress} max={total+1} aria-label="Préparation du secteur"/>
        <span>{!worldReady&&fault?'Liaison interrompue':!worldReady?'Connexion au monde partagé':done<total?'Chargement du terrain et des unités':'Secteur prêt'}</span>
      </div>}
      {loaded?<div className="field-arrival-actions"><button onClick={begin}>Installer mon camp <ArrowRight size={16}/></button><button onClick={observe}><Compass size={15}/> Observer le terrain</button></div>:
        <div className="field-arrival-actions">{!worldReady&&fault?<button onClick={retry}><RotateCcw size={15}/> Réessayer</button>:worldReady?<button onClick={()=>setSkip(true)}>Continuer pendant le chargement <ArrowRight size={15}/></button>:null}</div>}
      {loaded&&layers.failed>0&&<small className="field-degraded">Le terrain utilise le rendu de secours pour les images indisponibles.</small>}
    </div>
  </section>;
}
