'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronRight, Crosshair, Drill, LockKeyhole, Pickaxe, ScanEye, Truck, X } from 'lucide-react';
import type { Pixel } from '@/lib/planet-camera';
import type { PlanetTile } from '@/lib/planet-render';
import { orderNames, tileName, tileClaim, type TerrainOrder, type pickCycle } from '@/lib/terrain-orders';
import './TerrainTools.css';

export const toolIcons = {mine:Pickaxe, drill:Drill, hauler:Truck, squad:Crosshair, inspect:ScanEye};
const choices: TerrainOrder[] = ['mine', 'drill', 'hauler', 'squad', 'inspect'];

// Native cursors keep their hotspot attached even while the terrain is being repainted.
const outlines: Record<string,string> = {
  mine:'M5 5 21 21m-3-10c-5-5-9-6-15-5m15 5 3 7-6-5',
  drill:'M3 5h11v7H8v7H5V9H3zm11 2h4v3h-4m4-2h5',
  hauler:'M3 5h13v10H3zm13 4h4l3 4v2h-7M6 18h2m9 0h2',
  squad:'M12 3v5m0 8v5M3 12h5m8 0h5m-6-3 2 3-2 3m-6 0-2-3 2-3',
};
function fieldCursor(path: string, hotspot: string) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><g fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="'+path+'" stroke="#181318" stroke-width="4.8"/><path d="'+path+'" stroke="#ffe0a2" stroke-width="2"/></g></svg>';
  return 'url("data:image/svg+xml,'+encodeURIComponent(svg)+'") '+hotspot+', crosshair';
}
const hotspots: Record<string,string> = {mine:'3 6',drill:'23 8',hauler:'23 14',squad:'12 12'};
export const toolCursors = Object.fromEntries(Object.entries(outlines).map(([tool, lines])=>[tool, fieldCursor(lines,hotspots[tool])]));

type ToolMenuProps = {
  tile: PlanetTile; anchor: Pixel; w: number; h: number;
  blocked: (kind:TerrainOrder) => string;
  onOrder: (kind: TerrainOrder) => void; onDismiss: () => void; onBlurAway: () => void;
};
export function ToolMenu({tile, anchor, w, h, blocked, onOrder, onDismiss, onBlurAway}:ToolMenuProps) {
  const menu = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({w:236,h:244});
  useLayoutEffect(() => {
    const el = menu.current;
    if (!el) return;
    const update = () => setSize({w:el.offsetWidth,h:el.offsetHeight});
    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    el.querySelector<HTMLButtonElement>('[role="menuitem"]:enabled')?.focus({preventScroll:true});
    return () => observer.disconnect();
  }, []);
  const left = Math.max(6, Math.min(w-size.w-6, anchor.x+12));
  const top = Math.max(6, Math.min(h-size.h-6, anchor.y+12));
  const claim = tileClaim(tile);
  return <div className="terrain-menu" role="menu" aria-label="Ordres sur le terrain" ref={menu} style={{left,top}}
    onKeyDown={e=>{
      if(e.key==='Escape'){e.preventDefault();onDismiss();return;}
      const dir = e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;
      if(!dir)return;
      const list = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:enabled')||[]);
      if(!list.length)return;
      e.preventDefault();
      const selected = list.findIndex(el=>el===document.activeElement);
      list[(selected+dir+list.length)%list.length].focus();
    }}
    onBlur={e=>{if(e.relatedTarget && !e.currentTarget.contains(e.relatedTarget))onBlurAway();}}>
    <header><span><strong>{tileName(tile)}</strong><small>{tile.u.toLocaleString('fr-FR')} / {tile.v.toLocaleString('fr-FR')}{claim && ' · '+claim}</small></span>
      <button type="button" aria-label="Fermer les ordres" onClick={onDismiss}><X size={14}/></button></header>
    {choices.map(kind=>{
      const Icon = toolIcons[kind], reason = blocked(kind);
      return <button type="button" role="menuitem" key={kind} className={'terrain-command '+kind} disabled={!!reason}
        onClick={()=>onOrder(kind)} title={reason||orderNames[kind]}>
        <Icon size={16}/><span>{orderNames[kind]}{reason&&<small>{reason}</small>}</span>
        {reason ? <LockKeyhole size={11}/> : <ChevronRight size={13}/>}
      </button>;
    })}
  </div>;
}

type Cycle = ReturnType<typeof pickCycle>;
function Gauge({cycle,clockOffset}:{cycle:Cycle;clockOffset:number}) {
  const [,refresh]=useState(0);
  useEffect(()=>{
    if(!cycle || cycle.end<=Date.now()+clockOffset)return;
    const timer = window.setInterval(()=>{
      refresh(n=>n+1);
      if(Date.now()+clockOffset>=cycle.end)window.clearInterval(timer);
    },90);
    return ()=>window.clearInterval(timer);
  },[cycle?.start,cycle?.end,clockOffset]);
  const end = cycle?.end ?? 0;
  const remaining = Math.max(0,end-Date.now()-clockOffset);
  const ratio = cycle && remaining ? Math.max(0,1-remaining/Math.max(1,end-cycle.start)):1;
  const tenths = Math.ceil(remaining/100)/10;
  return <>
    <span className="terrain-picker-mark" style={{'--cycle':ratio} as CSSProperties}><Pickaxe size={15}/></span>
    <span className="terrain-picker-copy"><b>{remaining ? cycle!.label : 'Pioche'}</b><small>{remaining ? tenths.toLocaleString('fr-FR')+' s' : cycle?.pending ? 'En attente' : 'Prête'}</small></span>
  </>;
}

export function ToolHud({cycle,clockOffset,onOpen}:{cycle:Cycle;clockOffset:number;onOpen:()=>void}) {
  return <button type="button" className="terrain-tool-hud" title="Ordres du bloc · clic droit ou appui long" aria-label="Ouvrir les ordres du bloc" aria-haspopup="menu" onClick={onOpen}>
    <Gauge cycle={cycle} clockOffset={clockOffset}/><ChevronRight size={13}/>
  </button>;
}
