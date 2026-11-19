'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Compass, Expand, Globe2, LocateFixed, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import { SIDE, type Face, type Point, type Focus } from '@/lib/planet';
import { clamp, dragGround, dragStarted, focusKey, planeKey, visibleWindows, withinFace, windowKey, zoomGround, type LocalCamera, type Pixel } from '@/lib/planet-camera';
import { RegionStream, type MachineView, type RegionLoader, type StreamRegion } from '@/lib/region-stream';
import { subscribeOrbitTextures, drawMiningOverlay, type FragmentBurst, type MineProgress, drawOrbit, drawSurvey, drawRegion, pickOrbit, pickTile, closestRelay, surveyFocus, type Orbit, type PlanetMachine, type PlanetRelay, type PlanetScene, type PlanetTile, type Survey } from '@/lib/planet-render';
import { subscribeSurveyTiles } from '@/lib/planet-survey';
import { fleetInView, type ConvoyFleet } from '@/lib/planet-render';
import { blockedOrder, nearRelay, pickCycle, tileClaim, tileName, type Operator, type Placement, type TerrainOrder } from '@/lib/terrain-orders';
import { ToolHud, ToolMenu, toolCursors } from './TerrainTools';

export type PlanetFocus = Focus;
export type PlanetCanvasProps = {
  focus: Focus | null;
  region?: StreamRegion | null;
  loadRegion?: RegionLoader;
  onFocus: (focus: Focus | null) => void;
  onMine: (block: Point) => void;
  onDeploy: (block: Point, unit?: string) => void;
  onSelect?: (block: Point) => void;
  onRelay?: (id: string) => void;
  machines?: (PlanetMachine | MachineView)[];
  convoyFleet?: ConvoyFleet | null;
  relays?: PlanetRelay[];
  busy?: boolean;
  placing?: boolean;
  armed?: Placement;
  operator?: Operator | null;
  mining?: MineProgress | null;
  className?: string;
};

type Gesture = {
  id: number;
  start: Pixel;
  prev: Pixel;
  button: number;
  moved: boolean;
  time: number;
  velocity: Pixel;
};
type Pinch = {distance: number; center: Pixel};
const names: Record<Face, string> = {top:'Zénith', bottom:'Nadir', north:'Nord', south:'Sud', east:'Est', west:'Ouest'};
const noRelays: PlanetRelay[] = [];
const initialOrbit: Orbit = {yaw:.68, pitch:.53, zoom:1};
const initialLocal: LocalCamera = {yaw:.62, pitch:.70, zoom:1, centerU:SIDE/2, centerV:SIDE/2};
const navStyle: CSSProperties = {position:'absolute', top:14, left:14, display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', maxWidth:'calc(100% - 28px)'};
const formatFace = (face: Face) => 'Face ' + names[face];
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const samePoint = (a: Point | null, b: Point | null) => a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z);
const emptyScene = (): PlanetScene => ({faces: [], tiles: [], relays: []});
const zero: Pixel = {x: 0, y: 0};
const useClientLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Pointer and wheel events may arrive several times before React paints.
function useLiveCamera<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  const change = useCallback((next: T) => {
    ref.current = next;
    setValue(next);
  }, []);
  return [value, ref, change] as const;
}

export default function PlanetCanvas(props: PlanetCanvasProps) {
  const {focus, region, busy = false, relays = noRelays} = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const scene = useRef<PlanetScene>(emptyScene());
  const drag = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, Pixel>());
  const pinch = useRef<Pinch | null>(null);
  const consumedTouch = useRef(false);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const coast = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduced = useRef(false);
  const frame = useRef(0);
  const paint = useRef<() => void>(() => {});
  const bursts = useRef<FragmentBurst[]>([]);
  const previousPrimary = useRef<StreamRegion | null>(null);
  const edgeAction = useRef<{place: Focus; revision: number; tile: PlanetTile; mined: boolean; expires: number} | null>(null);
  const sentFocus = useRef('');
  const appliedFocus = useRef('');
  const latest = useRef(props);
  latest.current = props;

  const [orbit, orbitRef, setOrbit] = useLiveCamera(initialOrbit);
  const [local, localRef, setLocal] = useLiveCamera(initialLocal);
  const [survey, surveyRef, setSurvey] = useLiveCamera<Survey | null>(null);
  const [hover, setHover] = useState<PlanetTile | null>(null);
  const [hoverFace, setHoverFace] = useState<Face | undefined>();
  const [menu, setMenu] = useState<{tile:PlanetTile; anchor:Pixel} | null>(null);
  const [,wakePick] = useState(0);
  const [hint, setHint] = useState('');
  const [grabbing, setGrabbing] = useState(false);
  const [dims, setDims] = useState({w: 0, h: 0, dpr: 1});
  const [revision, refreshCache] = useState(0);
  const stream = useMemo(() => new RegionStream(
    (place, signal) => latest.current.loadRegion?.(place, signal) ?? Promise.resolve(null),
    () => refreshCache(value => value + 1),
  ), []);

  const placeKey = focusKey(focus);
  const scope = planeKey(focus);
  const mode = focus ? 'local' : survey ? 'survey' : 'orbit';
  const active = focus || survey?.focus;
  const activeTool: TerrainOrder = props.placing ? props.armed ?? 'drill' : 'mine';
  const serverTime = props.operator?.serverTime;
  const clockOffset = useMemo(()=>serverTime ? serverTime-Date.now() : 0,[serverTime]);
  const fleetBase=props.convoyFleet?.base;
  const convoys=props.convoyFleet?.convoys;
  const pick = pickCycle(props.operator, props.mining);
  const pickBusy = !!pick && (pick.pending || Date.now()+clockOffset < pick.end);
  useEffect(()=>{
    if (!pick) return;
    const ms = pick.end-Date.now()-clockOffset;
    if (ms <= 0) return;
    const timer = setTimeout(()=>wakePick(n=>n+1),ms+5);
    return ()=>clearTimeout(timer);
  },[pick?.end, clockOffset]);
  const viewCamera = focus && appliedFocus.current !== placeKey && sentFocus.current !== placeKey
    ? {...local, centerU: focus.u, centerV: focus.v}
    : local;
  const windows = useMemo(() => focus ? visibleWindows(focus, viewCamera, dims) : [], [focus, viewCamera, dims]);
  const planKey = windows.map(windowKey).join('|');
  const readyRegion = useMemo(() => focus ? stream.combine(focus, windows, region ?? null) : null, [focus, planKey, revision, region, stream]);

  function cancelHold() {
    clearTimeout(hold.current);
    hold.current = undefined;
  }

  function stopMotion() {
    cancelAnimationFrame(coast.current);
    clearTimeout(settle.current);
    coast.current = 0;
  }

  function syncCenter() {
    const place = latest.current.focus;
    if (!place) return;
    const camera = localRef.current;
    const next = {...place, u: Math.round(camera.centerU), v: Math.round(camera.centerV)};
    const key = focusKey(next);
    if (key === focusKey(place)) return;
    sentFocus.current = key;
    latest.current.onFocus(next);
  }

  function syncAfterZoom() {
    clearTimeout(settle.current);
    settle.current = setTimeout(syncCenter, 170);
  }

  useClientLayout(() => {
    if (appliedFocus.current === placeKey) return;
    const echoed = sentFocus.current === placeKey;
    appliedFocus.current = placeKey;
    sentFocus.current = '';
    setHover(null);
    setMenu(null);
    setHint('');
    if (!echoed) {
      stopMotion();
      cancelHold();
      drag.current = null;
      setGrabbing(false);
      if (focus) setLocal({...localRef.current, centerU: focus.u, centerV: focus.v});
    }
  }, [placeKey, focus, localRef, setLocal]);

  useClientLayout(() => {
    stream.configure(focus, props.loadRegion ? windows : []);
    if (region) stream.store(region);
  }, [scope, planKey, region, props.loadRegion, stream]);
  useEffect(() => () => stream.reset(), [stream]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      setDims({w: Math.round(rect.width), h: Math.round(rect.height), dpr: Math.min(window.devicePixelRatio || 1, 2)});
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {reduced.current = preference.matches;};
    updateMotion();
    preference.addEventListener('change', updateMotion);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', updateMotion);
      stopMotion();
      cancelHold();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  useEffect(() => {
    if (!hint) return;
    const timeout = setTimeout(() => setHint(''), 2600);
    return () => clearTimeout(timeout);
  }, [hint]);

  const invalidate = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      paint.current();
    });
  }, []);

  useClientLayout(() => {
    paint.current = () => {
      const element = canvas.current, ctx = element?.getContext('2d');
      const {w, h, dpr} = dims;
      if (!element || !ctx || w < 1 || h < 1) return;
      if (element.width !== Math.round(w * dpr) || element.height !== Math.round(h * dpr)) {
        element.width = Math.round(w * dpr);
        element.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (readyRegion) {
        const machines = (props.machines ?? readyRegion.machines ?? [])
          .filter(machine=>!(convoys && machine.kind==='hauler' && 'mine' in machine && machine.mine))
          .map((machine, i) => 'name' in machine
          ? {id: String(i), point: machine.point, label: machine.name, kind: machine.kind, hp: machine.health, maxHp: machine.maxHealth || 100}
          : machine);
        if(fleetBase && convoys) {
          const time=reduced.current && serverTime ? serverTime : Date.now()+clockOffset;
          machines.push(...fleetInView(readyRegion,viewCamera,w,h,{base:fleetBase,convoys},time).machines);
        }
        scene.current = drawRegion(ctx, w, h, readyRegion, viewCamera, hover?.point || null, machines, relays);
      } else if (survey) {
        scene.current = drawSurvey(ctx, w, h, survey, relays);
      } else {
        scene.current = drawOrbit(ctx, w, h, orbit, relays, hoverFace);
      }
    };
    invalidate();
  }, [dims, props.machines, fleetBase, convoys, serverTime, clockOffset, readyRegion, survey, orbit, viewCamera, hover, hoverFace, relays, invalidate]);

  useEffect(() => {
    if (!readyRegion || !fleetBase || !convoys?.length || reduced.current || !dims.w || !dims.h) return;
    let timer:ReturnType<typeof setTimeout>|undefined, previouslyVisible=false;
    const update=()=>{
      clearTimeout(timer);
      if (document.hidden || reduced.current) return;
      const {active,moving}=fleetInView(readyRegion,viewCamera,dims.w,dims.h,{base:fleetBase,convoys},Date.now()+clockOffset);
      if(moving || previouslyVisible) invalidate();
      previouslyVisible=moving;
      if(active) timer=setTimeout(update,moving?42:240);
    };
    update();
    document.addEventListener('visibilitychange',update);
    return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',update);};
  }, [dims, fleetBase, convoys, readyRegion, viewCamera, clockOffset, invalidate]);

  useEffect(() => {
    if (mode === 'survey') return subscribeSurveyTiles(invalidate);
    if (mode === 'orbit') return subscribeOrbitTextures(invalidate);
  }, [mode, invalidate]);

  useEffect(() => {
    const prev = previousPrimary.current;
    previousPrimary.current = region ?? null;
    if (!region || reduced.current || !prev || planeKey(prev) !== planeKey(region)) {
      bursts.current = [];
      return;
    }
    if (prev === region) return;
    const prior = new Map(prev.tiles.map(tile => [tile.v * SIDE + tile.u, tile]));
    for (const tile of region.tiles) {
      const old = prior.get(tile.v * SIDE + tile.u);
      if (old?.status === 'solid' && (tile.status === 'air' || tile.depth > old.depth)) {
        bursts.current.push({tile: old, at: performance.now()});
      }
    }
    bursts.current = bursts.current.slice(-12);
  }, [region]);

  useEffect(() => {
    // The projected viewport extends beyond the centred server window. After
    // a remote edge tile was acted on, refresh its own window against the
    // action revision as well, so a removed block cannot linger on screen.
    const action = edgeAction.current;
    if (!action) return;
    if (!focus || planeKey(focus) !== planeKey(action.place) || Date.now() > action.expires) {
      edgeAction.current = null;
      return;
    }
    const latestRevision = region?.revision ?? 0;
    if (!busy && latestRevision > action.revision) {
      stream.refreshTile(action.place, latestRevision);
      action.revision = latestRevision;
    }
    const tile = readyRegion?.tiles.find(t => t.u === action.place.u && t.v === action.place.v);
    if (action.mined && tile && (tile.status === 'air' || tile.depth > action.tile.depth)) {
      if (!reduced.current) bursts.current.push({tile: action.tile, at: performance.now()});
      edgeAction.current = null;
    } else if (!action.mined && !busy && readyRegion?.machines?.some(machine => samePoint(machine.point, action.tile.point))) {
      edgeAction.current = null;
    }
  }, [readyRegion, focus, busy, region?.revision, stream]);

  useEffect(() => {
    const element = overlay.current, ctx = element?.getContext('2d');
    const {w, h, dpr} = dims;
    if (!element || !ctx || w < 1 || h < 1) return;
    if (element.width !== Math.round(w * dpr) || element.height !== Math.round(h * dpr)) {
      element.width = Math.round(w * dpr);
      element.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!readyRegion || (!props.mining && !bursts.current.length)) return;
    let animation = 0, timer: ReturnType<typeof setTimeout> | undefined;
    const draw = () => {
      const time = performance.now();
      bursts.current = bursts.current.filter(burst => time - burst.at < 530);
      ctx.clearRect(0, 0, w, h);
      const pending = drawMiningOverlay(ctx, w, h, readyRegion, viewCamera, bursts.current, props.mining ?? null, time, !reduced.current);
      if (!reduced.current && bursts.current.length) animation = requestAnimationFrame(draw);
      else if (pending) timer = setTimeout(draw, reduced.current ? 550 : 140);
    };
    draw();
    return () => {clearTimeout(timer); cancelAnimationFrame(animation);};
  }, [dims, readyRegion, viewCamera, props.mining]);

  function pos(e: {clientX: number; clientY: number}): Pixel {
    const rect = canvas.current!.getBoundingClientRect();
    return {x: e.clientX - rect.left, y: e.clientY - rect.top};
  }

  function openSurvey(place: Focus, span = 1024) {
    stopMotion();
    setHover(null);
    setSurvey({focus: {...place, depth: 0}, span});
    if (focus) props.onFocus(null);
  }

  function openLocal(place: Focus) {
    stopMotion();
    setHover(null);
    setSurvey(null);
    setLocal({...initialLocal, centerU: place.u, centerV: place.v});
    props.onFocus({...place, u: Math.round(place.u), v: Math.round(place.v), depth: place.depth ?? 0});
  }

  function globe() {
    stopMotion();
    setSurvey(null);
    setOrbit(initialOrbit);
    props.onFocus(null);
  }

  function scaleBy(factor: number, pointer: Pixel) {
    setMenu(null);
    const surveyCamera = surveyRef.current;
    if (focus) {
      const current = localRef.current;
      if (factor < 1 && current.zoom <= .73) {
        openSurvey({...focus, u: current.centerU, v: current.centerV}, 100);
        return;
      }
      const zoom = clamp(current.zoom * factor, .70, 3.8);
      setLocal(zoomGround(current, zoom, pointer, dims));
      syncAfterZoom();
    } else if (surveyCamera) {
      const span = surveyCamera.span * factor ** -1;
      const from = surveyCamera.span / Math.min(dims.w, dims.h);
      const to = span / Math.min(dims.w, dims.h);
      const at = {
        ...surveyCamera.focus,
        u: withinFace(surveyCamera.focus.u + (pointer.x - dims.w / 2) * from),
        v: withinFace(surveyCamera.focus.v + (pointer.y - dims.h / 2) * from),
      };
      if (factor > 1 && span < 84) {openLocal(at); return;}
      if (factor < 1 && span > 6000) {globe(); return;}
      setSurvey({span, focus: {...at, u: withinFace(at.u - (pointer.x - dims.w / 2) * to), v: withinFace(at.v - (pointer.y - dims.h / 2) * to)}});
    } else {
      const current = orbitRef.current;
      const place = pickOrbit(scene.current, pointer);
      if (factor > 1 && current.zoom >= 1.35 && place) {openSurvey(place, 2048); return;}
      setOrbit({...current, zoom: clamp(current.zoom * factor, .65, 1.85)});
    }
  }

  function zoom(inc: boolean) {
    stopMotion();
    scaleBy(inc ? 1.24 : 1 / 1.24, {x: dims.w / 2, y: dims.h * (focus ? .48 : .5)});
  }

  const wheelRef = useRef<(event: WheelEvent) => void>(() => {});
  wheelRef.current = event => {
    event.preventDefault();
    if (!event.deltaY) return;
    stopMotion();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? dims.h : 1);
    scaleBy(Math.exp(clamp(-pixels * .0024, -.45, .45)), pos(event));
  };
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => wheelRef.current(event);
    element.addEventListener('wheel', wheel, {passive: false});
    return () => element.removeEventListener('wheel', wheel);
  }, []);

  function pan(du: number, dv: number) {
    stopMotion();
    if (focus) {
      const current = localRef.current;
      setLocal({...current, centerU: withinFace(current.centerU + du), centerV: withinFace(current.centerV + dv)});
      syncCenter();
    } else if (surveyRef.current) {
      const current = surveyRef.current;
      setSurvey({...current, focus: {...current.focus, u: withinFace(current.focus.u + du), v: withinFace(current.focus.v + dv)}});
    }
  }

  function rotate(dx: number, dy: number) {
    if (focus) {
      const current = localRef.current;
      setLocal({...current, yaw: current.yaw + dx, pitch: clamp(current.pitch + dy, .33, 1.28)});
    } else {
      const current = orbitRef.current;
      setOrbit({...current, yaw: current.yaw + dx, pitch: clamp(current.pitch + dy, -Math.PI/2+.025, Math.PI/2-.025)});
    }
  }

  function slide(delta: Pixel, button: number) {
    if (focus && button !== 1) {
      setLocal(dragGround(localRef.current, delta, dims));
    } else if (surveyRef.current && !focus) {
      const current = surveyRef.current;
      const step = current.span / Math.min(dims.w, dims.h);
      setSurvey({...current, focus: {...current.focus, u: withinFace(current.focus.u - delta.x * step), v: withinFace(current.focus.v - delta.y * step)}});
    } else {
      rotate(-delta.x * .008, delta.y * .007);
    }
  }

  function release(gesture: Gesture) {
    const speed = Math.hypot(gesture.velocity.x, gesture.velocity.y);
    if (reduced.current || performance.now() - gesture.time > 65 || speed < .12) {syncCenter(); return;}
    const velocity = {x: clamp(gesture.velocity.x, -1.35, 1.35), y: clamp(gesture.velocity.y, -1.35, 1.35)};
    let previous = performance.now(), elapsed = 0;
    const tick = (time: number) => {
      const dt = Math.min(32, time - previous);
      previous = time;
      elapsed += dt;
      const decay = Math.exp(-dt/65);
      slide({x: velocity.x * 65 * (1 - decay), y: velocity.y * 65 * (1 - decay)}, gesture.button);
      velocity.x *= decay;
      velocity.y *= decay;
      if (elapsed < 195 && Math.hypot(velocity.x, velocity.y) > .035) coast.current = requestAnimationFrame(tick);
      else {coast.current = 0; syncCenter();}
    };
    coast.current = requestAnimationFrame(tick);
  }

  function obstruction(tool: TerrainOrder, tile: PlanetTile) {
    return blockedOrder(tool, tile, props.operator, nearRelay(tile, relays), busy, pickBusy);
  }

  function command(tile: PlanetTile | null, tool: TerrainOrder) {
    if (!tile) {setHint('Le relief de cette zone est en cours de chargement.'); return;}
    props.onSelect?.(tile.point);
    if (tool === 'inspect') {
      setHover(tile);
      setHint([tileName(tile), tileClaim(tile), tile.depth ? 'Profondeur '+fmt(tile.depth) : 'Surface', fmt(tile.u)+' / '+fmt(tile.v)].filter(Boolean).join(' · '));
      return;
    }
    // Clicking while exploring as a visitor still leads into establishing a base.
    if (props.operator) {
      const reason = obstruction(tool, tile);
      if (reason) {setHint(reason);return;}
    }
    if (busy) return;
    if (focus && (tool === 'mine' || tool === 'drill') &&
        (!region || !region.tiles.some(t => t.u === tile.u && t.v === tile.v))) {
      edgeAction.current = {
        place: {...focus, u: tile.u, v: tile.v}, revision: region?.revision ?? 0,
        tile, mined: tool === 'mine', expires: Date.now() + 30_000,
      };
    }
    if (tool === 'mine') props.onMine(tile.point);
    else props.onDeploy(tile.point, tool);
  }

  function pointed(pointer: Pixel) {
    const relay = closestRelay(scene.current, pointer);
    const relayTile = relay && readyRegion?.tiles.find(tile => tile.u === relay.focus.u && tile.v === relay.focus.v);
    return relayTile || pickTile(scene.current, pointer);
  }

  function openOrders(pointer: Pixel, tile = pointed(pointer)) {
    if (!focus) return;
    stopMotion();
    if (!tile) {setHint('Sélectionnez un bloc visible pour donner un ordre.');return;}
    setHint('');
    setHover(tile);
    setMenu({tile,anchor:pointer});
    props.onSelect?.(tile.point);
  }

  function closeOrders() {
    setMenu(null);
    canvas.current?.focus({preventScroll:true});
  }

  function clicked(pointer: Pixel, tool: TerrainOrder = activeTool) {
    const relay = closestRelay(scene.current, pointer);
    if (relay && props.onRelay && tool === 'mine' && !props.placing) {props.onRelay(relay.id); return;}
    if (focus) {
      command(pointed(pointer), tool);
    } else if (surveyRef.current) {
      openLocal(surveyFocus(surveyRef.current, pointer, dims.w, dims.h));
    } else {
      const place = pickOrbit(scene.current, pointer);
      if (place) openSurvey(place);
    }
  }

  function pair(): Pinch | null {
    const [a, b] = pointers.current.values();
    if (!a || !b) return null;
    return {distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), center:{x: (a.x + b.x)/2, y:(a.y + b.y)/2}};
  }

  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
    stopMotion();
    cancelHold();
    if (menu) {
      setMenu(null);
      // A tap to dismiss must never issue a second order underneath the menu.
      if (e.button === 0) return;
    }
    if (e.button === 1) e.preventDefault();
    const at = pos(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, at);
    if (pointers.current.size >= 2) {
      consumedTouch.current = true;
      pinch.current = pair();
      drag.current = null;
      setHover(null);
      setGrabbing(true);
      return;
    }
    consumedTouch.current = false;
    const button = e.pointerType === 'mouse' && e.button === 0 && e.ctrlKey ? 2 : e.button;
    drag.current = {id: e.pointerId, start: at, prev: at, button, moved: false, time: performance.now(), velocity: zero};
    if (focus && e.pointerType === 'touch') {
      hold.current = setTimeout(() => {
        if (!drag.current || drag.current.moved) return;
        drag.current = null;
        consumedTouch.current = true;
        openOrders(at);
      }, 540);
    }
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    const pointer = pos(e);
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, pointer);
    if (pointers.current.size >= 2 && pinch.current) {
      const next = pair();
      if (!next) return;
      const previous = pinch.current;
      pinch.current = next;
      slide({x: next.center.x - previous.center.x, y: next.center.y - previous.center.y}, 0);
      scaleBy(clamp(next.distance / previous.distance, .8, 1.25), next.center);
      return;
    }
    const gesture = drag.current;
    if (gesture?.id === e.pointerId) {
      if (!gesture.moved && dragStarted(gesture.start, pointer)) {
        gesture.moved = true;
        cancelHold();
        setHover(null);
        if (gesture.button !== 2) setGrabbing(true);
      }
      if (gesture.moved && gesture.button !== 2) {
        const delta = {x: pointer.x - gesture.prev.x, y: pointer.y - gesture.prev.y};
        const time = performance.now(), dt = Math.max(8, time - gesture.time);
        gesture.velocity = {x: .28 * gesture.velocity.x + .72 * delta.x/dt, y: .28 * gesture.velocity.y + .72 * delta.y/dt};
        gesture.time = time;
        gesture.prev = pointer;
        slide(delta, gesture.button);
      }
      return;
    }
    if (consumedTouch.current) return;
    if (focus) {
      const tile = pickTile(scene.current, pointer);
      if (!samePoint(hover?.point || null, tile?.point || null)) setHover(tile);
    } else if (!survey) setHoverFace(pickOrbit(scene.current, pointer)?.face);
  }

  function up(e: PointerEvent<HTMLCanvasElement>) {
    cancelHold();
    const p = pos(e), gesture = drag.current;
    pointers.current.delete(e.pointerId);
    if (!pointers.current.size) setGrabbing(false);
    if (consumedTouch.current) {
      if (!pointers.current.size) {
        consumedTouch.current = false;
        pinch.current = null;
        syncCenter();
      }
      return;
    }
    if (!gesture || gesture.id !== e.pointerId) return;
    drag.current = null;
    // A remote display or stylus can deliver down/up without intermediate moves.
    if (!gesture.moved && !dragStarted(gesture.start, p)) {
      if (gesture.button === 0) clicked(p);
      else if (gesture.button === 2 && focus) openOrders(p);
    } else if (gesture.button !== 2) {
      const trailing = {x: p.x - gesture.prev.x, y: p.y - gesture.prev.y};
      if (trailing.x || trailing.y) slide(trailing, gesture.button);
      release(gesture);
    }
  }

  function cancel(e: PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    cancelHold();
    stopMotion();
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    drag.current = null;
    consumedTouch.current = pointers.current.size > 0;
    setGrabbing(false);
    syncCenter();
  }

  const centerTile = readyRegion?.tiles.find(tile => tile.u === Math.round(viewCamera.centerU) && tile.v === Math.round(viewCamera.centerV)) || null;
  function setDepth(delta: number) {
    if (!focus) return;
    stopMotion();
    const depth = focus.depth || 0;
    const start = depth === 0 && delta > 0 ? Math.max(0, (hover?.depth || centerTile?.depth || 1) - 1) : depth;
    props.onFocus({...focus, u: Math.round(localRef.current.centerU), v: Math.round(localRef.current.centerV), depth: clamp(start + delta, 0, SIDE-1)});
  }

  function key(e: React.KeyboardEvent<HTMLCanvasElement>) {
    const steps = focus ? (e.shiftKey ? 6 : 1) : survey ? Math.max(1, Math.round(survey.span / 5)) : 0;
    const offsets: Record<string, [number, number]> = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]};
    if (offsets[e.key]) {
      e.preventDefault();
      const [u,v] = offsets[e.key];
      if (steps) pan(u*steps, v*steps); else rotate(u*.25, -v*.18);
    }
    if (focus && (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey))) {
      e.preventDefault();
      openOrders({x:dims.w/2,y:dims.h*.48},hover || centerTile);
      return;
    }
    if (e.key === '+' || e.key === '=') {e.preventDefault(); zoom(true);}
    if (e.key === '-') {e.preventDefault(); zoom(false);}
    if (e.key === 'Escape') {e.preventDefault(); if (focus) openSurvey(focus); else globe();}
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focus && e.shiftKey) openOrders({x:dims.w/2,y:dims.h*.48},hover || centerTile);
      else if (focus) command(hover || centerTile,activeTool);
      else clicked({x:dims.w/2, y:dims.h/2});
    }
  }
  const hoverBlocked = hover && obstruction(activeTool, hover);
  const cursor = grabbing ? 'grabbing' : !focus || !hover ? 'grab' :
    !props.operator ? 'pointer' : activeTool==='mine' && pickBusy ? 'progress' : hoverBlocked ? 'not-allowed' : toolCursors[activeTool];
  // A second player may extract or claim the block while this menu is open.
  const visibleTarget = menu && readyRegion?.tiles.find(t => t.u===menu.tile.u && t.v===menu.tile.v);
  const menuMatches = !!menu && !!visibleTarget && samePoint(menu.tile.point,visibleTarget.point);
  const tool=(label:string,icon:React.ReactNode,act:()=>void,disabled=false)=><button type="button" className="pv-tool" title={label} aria-label={label} onClick={act} disabled={disabled}>{icon}</button>;
  return <div ref={host} className={'planet-viewport '+(props.className||'')} style={{position:'relative',width:'100%',height:'100%',minHeight:180,overflow:'hidden',background:'#18151c'}}>
    <canvas ref={canvas} tabIndex={0} aria-label={mode==='orbit'?'Planète cubique, sélectionner une face pour explorer':mode==='survey'?'Carte régionale, sélectionner un lieu pour prospecter':'Terrain minier, sélectionner une roche pour l’extraire'} style={{display:'block',width:'100%',height:'100%',touchAction:'none',cursor}}
      onPointerDown={down} onPointerMove={move} onPointerUp={up}
      onPointerCancel={cancel} onLostPointerCapture={cancel} onPointerLeave={()=>{setHover(null);setHoverFace(undefined)}}
      onContextMenu={e=>e.preventDefault()} onKeyDown={key}
      onDragOver={e=>{if(focus&&e.dataTransfer.types.includes('text/plain')){e.preventDefault();e.dataTransfer.dropEffect='copy'}}}
      onDrop={e=>{e.preventDefault();const unit=e.dataTransfer.getData('text/plain');if(focus&&readyRegion&&(unit==='drill'||unit==='hauler'||unit==='squad'))clicked(pos(e),unit)}}
    />
    <canvas aria-hidden="true" ref={overlay} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>
    <div className="pv-location" style={navStyle}>
      {mode!=='orbit'&&tool('Retour à la planète',<Globe2 size={15}/>,globe)}
      {mode==='local'&&tool('Revenir à la carte régionale',<Expand size={15}/>,()=>openSurvey({...focus!,u:viewCamera.centerU,v:viewCamera.centerV}))}
      <span className="pv-badge"><span className="pv-dot"/>{mode==='orbit'?'Orbite':mode==='survey'?'Survol':'Terrain'}{active?' · '+formatFace(active.face):''}</span>
    </div>
    {focus&&props.operator&&<ToolHud cycle={pick} clockOffset={clockOffset} onOpen={()=>openOrders({x:dims.w/2,y:dims.h*.48},hover || centerTile)}/>}
    {menu&&focus&&<ToolMenu tile={menuMatches ? visibleTarget! : menu.tile} anchor={menu.anchor} w={dims.w} h={dims.h}
      blocked={kind => menuMatches ? obstruction(kind,visibleTarget!) : 'Ce bloc a changé.'}
      onOrder={kind=>{
        if (!menuMatches) return;
        closeOrders();
        command(visibleTarget!,kind);
      }} onDismiss={closeOrders} onBlurAway={()=>setMenu(null)}/>}
    <div className="pv-controls">
      <div className="pv-group">
        {tool('Dézoomer',<Minus size={16}/>,()=>zoom(false))}
        {tool('Zoomer',<Plus size={16}/>,()=>zoom(true))}
        {mode!=='survey'&&tool('Tourner vers la gauche',<RotateCcw size={15}/>,()=>rotate(-.35,0))}
        {mode!=='survey'&&tool('Tourner vers la droite',<RotateCw size={15}/>,()=>rotate(.35,0))}
        {mode==='orbit'&&tool('Explorer la face centrale',<LocateFixed size={15}/>,()=>clicked({x:dims.w/2,y:dims.h/2}))}
      </div>
      {mode!=='orbit'&&<div className="pv-group pv-pan">
        {tool('Déplacer vers l’ouest',<ArrowLeft size={14}/>,()=>pan(-(focus?6:survey!.span/4),0))}
        {tool('Déplacer vers le nord',<ArrowUp size={14}/>,()=>pan(0,-(focus?6:survey!.span/4)))}
        {tool('Déplacer vers le sud',<ArrowDown size={14}/>,()=>pan(0,focus?6:survey!.span/4))}
        {tool('Déplacer vers l’est',<ArrowRight size={14}/>,()=>pan(focus?6:survey!.span/4,0))}
      </div>}
      {focus&&<div className="pv-group pv-depth">
        {tool('Remonter d’un bloc',<ChevronUp size={15}/>,()=>setDepth(-1),!(focus.depth||0))}
        <span title="Profondeur de coupe">{focus.depth?'−'+fmt(focus.depth):'Surface'}</span>
        {tool('Descendre d’un bloc',<ChevronDown size={15}/>,()=>setDepth(1))}
      </div>}
    </div>
    {props.placing&&focus&&<div className="pv-placing" role="status"><LocateFixed size={14}/> {props.armed==='hauler'?'Choisissez un secteur de collecte':props.armed==='squad'?'Visez un relais pour les sentinelles':'Choisissez une roche pour la foreuse'}</div>}
    <div className="pv-caption" aria-live="polite">
      <Compass size={12}/>
      <span>{hint||(focus&&!readyRegion?.tiles.length?'Chargement du secteur…':hover&&focus?[tileName(hover),tileClaim(hover),fmt(hover.u)+' / '+fmt(hover.v),hover.depth+' blocs'].filter(Boolean).join(' · '):mode==='local'?fmt(viewCamera.centerU)+' / '+fmt(viewCamera.centerV)+' · Glisser pour explorer':mode==='survey'?'Survol · '+fmt(Math.round(survey!.span))+' blocs':hoverFace?formatFace(hoverFace):'Glisser pour tourner · cliquer une face')}</span>
    </div>
    <style>{`
      .pv-tool,.pv-badge,.pv-group,.pv-caption{color:#e3d1b9;background:#221e23eb;border:1px solid #8a735952;box-shadow:0 2px 5px #0002}
      .pv-tool{padding:0;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:3px;cursor:pointer}
      .pv-tool:hover,.pv-tool:focus-visible{background:#49403a;color:#ffdeb1;outline:1px solid #c39b67}.pv-tool:disabled{opacity:.36;cursor:default}
      .pv-badge,.pv-caption,.pv-depth span{font:600 10px/1.4 ui-monospace,monospace;letter-spacing:.045em}
      .pv-badge{display:flex;align-items:center;gap:8px;border-radius:2px;padding:6px 10px;text-transform:uppercase}
      .pv-placing{pointer-events:none;position:absolute;bottom:54px;left:50%;transform:translateX(-50%);padding:8px 12px;background:#402f25f0;border:1px solid #c5a271;color:#ffe8c2;display:flex;align-items:center;gap:7px;white-space:nowrap;font:600 11px ui-monospace,monospace}.pv-dot{width:5px;height:5px;display:inline-block;border-radius:1px;background:#efc48b}
      .pv-caption{position:absolute;bottom:12px;left:14px;max-width:calc(100% - 28px);padding:6px 8px;display:flex;align-items:center;gap:7px;border-radius:2px;pointer-events:none}
      .pv-controls{position:absolute;right:12px;bottom:12px;display:flex;justify-content:flex-end;gap:5px;flex-wrap:wrap;max-width:70%}
      .pv-group{display:inline-flex;align-items:center;border-radius:3px;padding:2px}.pv-group .pv-tool{width:29px;height:29px;box-shadow:none;background:transparent;border:0}
      .pv-group .pv-tool:hover{background:#51443b}.pv-depth span{font-size:9px;padding:0 1px}.pv-location .pv-tool{width:29px;height:29px}
      @media(max-width:700px){.pv-location{top:9px!important;left:9px!important}.pv-badge{font-size:8px}.pv-controls{bottom:9px;right:8px;max-width:calc(100% - 16px)}.pv-caption{top:44px;bottom:auto;left:9px;font-size:8px;padding:4px;max-width:75%}.pv-group .pv-tool{width:27px;height:29px}.pv-depth span{font-size:8px}}
    `}</style>
  </div>;
}
