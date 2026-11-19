'use client';

import {useEffect, useState} from 'react';
import {Check, ChevronRight, Coins, GitBranch, LockKeyhole, Pickaxe, Shield, Truck} from 'lucide-react';
import {GOODS, RAW_GOODS} from '@/lib/economy';
import {RESEARCH_TREE, researchAvailable, type SkillId} from '@/lib/research';
import type {View} from '@/lib/world';

const sections=[{name:'Extraction',Icon:Pickaxe},{name:'Logistique',Icon:Truck},{name:'Défense',Icon:Shield}] as const;
const byId=new Map(RESEARCH_TREE.map(node=>[node.id,node]));
const number=new Intl.NumberFormat('fr-FR');
export function ResearchPanel({me,busy,send}:{me:NonNullable<View['me']>;busy:boolean;send:(action:Record<string,unknown>)=>unknown}) {
  const [branch,setBranch]=useState<typeof sections[number]['name']>('Extraction');
  const [target,setTarget]=useState<SkillId|null>(null);
  useEffect(()=>{
    if (target) {
      document.getElementById(`skill-${target}`)?.focus();
      setTarget(null);
    }
  },[branch,target]);
  const owned=new Set<SkillId>(me.research);
  return <section className="op-panel mg-panel" aria-label="Arbre de compétences">
    <div className="mg-research-top"><GitBranch size={24}/><div><strong>{owned.size} / {RESEARCH_TREE.length}</strong><span>Compétences acquises</span></div><p><Coins size={13}/>{number.format(me.coins)} CR</p></div>
    <div className="mg-branches" role="group" aria-label="Branche de recherche">{sections.map(({name,Icon})=><button key={name} type="button" aria-pressed={name===branch} onClick={()=>setBranch(name)}><Icon size={17}/>{name}</button>)}</div>
    <ol className="mg-tree">{RESEARCH_TREE.filter(node=>node.branch===branch).map(node=>{
      const learned=owned.has(node.id);
      const missing=node.requires.filter(id=>!owned.has(id));
      const canLearn=researchAvailable(me,node.id);
      const state=learned?'learned':missing.length?'locked':canLearn?'available':'unfunded';
      return <li className="mg-node" key={node.id} data-state={state}>
        <span className="mg-node-pin" aria-hidden="true">{learned?<Check size={12}/>:missing.length?<LockKeyhole size={10}/>:<i/>}</span>
        <article><header><h3>{node.name}</h3><span>{learned?'Acquise':missing.length?'Verrouillée':canLearn?'Disponible':'À financer'}</span></header>
          <p>{node.description}</p>
          {node.requires.length>0&&<div className="mg-deps">{node.requires.map(id=>{const dependency=byId.get(id);return <button key={id} type="button" className={owned.has(id)?'met':''} onClick={()=>{if(dependency){setBranch(dependency.branch);setTarget(id);}}} title={`Prérequis · ${dependency?.branch}`}>{owned.has(id)?<Check size={11}/>:<GitBranch size={11}/>} {dependency?.name??id}</button>})}</div>}
          {!learned&&<div className="mg-costs"><span className={me.coins<node.credits?'missing':''}><Coins size={12}/>{number.format(node.credits)} CR</span>{RAW_GOODS.map(g=>node.materials[g] ? <span key={g} className={me.inventory[g]<(node.materials[g]??0)?'missing':''}>{node.materials[g]} {GOODS[g].name}</span>:null)}</div>}
          <button type="button" id={`skill-${node.id}`} className="mg-learn" aria-disabled={busy||!canLearn||learned} onClick={()=>{if(!busy&&canLearn&&!learned)send({type:'research',skill:node.id})}}>{learned?<><Check size={13}/> Installée</>:missing.length?<><LockKeyhole size={12}/> Prérequis manquant{missing.length>1?'s':''}</>:!canLearn?'Stock insuffisant':<>Développer <ChevronRight size={14}/></>}</button>
        </article>
      </li>;
    })}</ol>
  </section>;
}
