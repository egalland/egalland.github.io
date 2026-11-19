'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Focus } from './planet';
import type { Faction, View } from './world';

const tokenKey = 'strate-idle-token-v2';
export type Order = Record<string, unknown>;
type Outcome = { world: View; token?: string; version: number; result?: {message?: string}; offline?: {blocks:number;delivered:number;coins:number;seconds:number} | null };

function samePlace(a: Focus | null, b: Focus | null) {
  return a?.face === b?.face && a?.u === b?.u && a?.v === b?.v && (a?.depth || 0) === (b?.depth || 0);
}

export function useExpedition() {
  const [world, setWorld] = useState<View | null>(null);
  const [focus, changeFocus] = useState<Focus | null>(null);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [notice, setNotice] = useState('');
  const [fault, setFault] = useState('');
  const [now, setNow] = useState(0);
  const focusRef = useRef<Focus | null>(null);
  const version = useRef(-1);
  const token = useRef('');
  const locked = useRef(false);
  const clock = useRef(0);
  const active = useRef(true);
  const pendingFocus = useRef<AbortController | null>(null);

  const loadRegion = useCallback(async (place: Focus, signal: AbortSignal) => {
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({op:'region', token:token.current, focus:place}),
      signal,
    });
    const data = await response.json().catch(() => null) as {region?: View['region']; error?: string} | null;
    if (!response.ok || !data?.region) {
      throw new Error(data?.error || 'Impossible de charger ce secteur.');
    }
    return data.region;
  }, []);

  const query = useCallback(async (payload: Order) => {
    const place = focusRef.current;
    let response: Response;
    try {
      response = await fetch('/api/game', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...payload, token:token.current, focus:place})});
    } catch {
      if (active.current) setConnected(false);
      throw new Error('Connexion interrompue. Vos données restent sur le serveur.');
    }
    const data = await response.json().catch(() => null) as (Partial<Outcome> & {error?: string}) | null;
    if (!response.ok || !data?.world) {
      if (active.current && (!data || response.status >= 500 || payload.op !== 'action')) setConnected(false);
      throw new Error(data?.error || 'La connexion au monde a été interrompue.');
    }
    const result = data as Outcome;
    if (!active.current) return result;
    if (result.token) {
      token.current = result.token;
      try { localStorage.setItem(tokenKey, result.token); } catch { /* Browser storage may be disabled. */ }
    }
    if (samePlace(focusRef.current, place) && result.version >= version.current) {
      version.current = result.version;
      clock.current = result.world.serverTime - Date.now();
      setNow(result.world.serverTime);
      setWorld(previous => {
        const latest = previous?.region;
        const incoming = result.world.region;
        if (latest && incoming && samePlace(latest, incoming) && latest.revision > incoming.revision) {
          return {...result.world, region:latest};
        }
        return result.world;
      });
    }
    if (payload.op==='poll' && result.offline && (result.offline.blocks>0 || result.offline.delivered>0)) {
      const {blocks,delivered}=result.offline;
      setNotice(`Depuis votre dernière visite · ${blocks} bloc${blocks>1?'s':''} extrait${blocks>1?'s':''}, ${delivered} unité${delivered>1?'s':''} livrée${delivered>1?'s':''} au dépôt.`);
    }
    setConnected(true);
    return result;
  }, []);

  useEffect(() => {
    active.current = true;
    try { token.current = localStorage.getItem(tokenKey) || ''; } catch { /* Signed-in sessions also use account identity. */ }
    let polling = false;
    const sync = async () => {
      if (polling || locked.current) return;
      polling = true;
      try { await query({op:'poll'}); } catch (error) { if (active.current) setFault((error as Error).message); }
      finally { polling = false; }
    };
    void sync();
    const poll = window.setInterval(sync, 3200);
    const timer = window.setInterval(() => setNow(Date.now() + clock.current), 500);
    return () => {
      active.current = false;
      pendingFocus.current?.abort();
      clearInterval(poll);
      clearInterval(timer);
    };
  }, [query]);

  const miningReady=world?.me?.mining?.ready;
  useEffect(() => {
    if(!miningReady) return;
    const wait=miningReady-(Date.now()+clock.current);
    if(wait<=0) return;
    const timer=window.setTimeout(()=>{
      if(active.current && !locked.current) void query({op:'poll'}).catch(()=>{});
    },wait+30);
    return ()=>window.clearTimeout(timer);
  },[miningReady,query]);

  const setFocus = useCallback((value: Focus | null) => {
    if (samePlace(focusRef.current, value)) return;
    pendingFocus.current?.abort();
    focusRef.current = value;
    changeFocus(value);
    if (!value) {
      setWorld(previous => previous ? {...previous, region:null} : previous);
      return;
    }
    // Keep the last local window visible until its replacement arrives.
    const controller = new AbortController();
    pendingFocus.current = controller;
    void loadRegion(value, controller.signal).then(region => {
      if (!active.current || controller.signal.aborted || !samePlace(value, focusRef.current)) return;
      setWorld(previous => {
        if (!previous) return previous;
        if (previous.region && samePlace(previous.region, value) && previous.region.revision > region.revision) return previous;
        return {...previous, region};
      });
    }).catch(error => {
      if (active.current && !controller.signal.aborted) setFault(error.message);
    });
  }, [loadRegion]);

  const issue = useCallback(async (payload: Order) => {
    if (locked.current) return null;
    locked.current = true;
    setBusy(true);
    setFault('');
    try {
      const result = await query(payload);
      if (result.result?.message) setNotice(result.result.message);
      return result;
    } catch (error) { setFault((error as Error).message); return null; }
    finally { locked.current = false; setBusy(false); }
  }, [query]);
  const send = useCallback((action: Order) => issue({op:'action', action:{...action,requestId:Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('')}}), [issue]);
  const join = useCallback((name: string, faction: Faction) => issue({op:'join',name,faction}), [issue]);

  useEffect(() => {
    if (!notice && !fault) return;
    const clear = window.setTimeout(() => {setFault('');setNotice('');}, 5500);
    return () => clearTimeout(clear);
  }, [notice, fault]);
  return { world, focus, setFocus, loadRegion, busy, now, connected, notice, fault, setNotice, setFault, send, join };
}
