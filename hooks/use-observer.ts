'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {ObserverView} from '@/lib/observatory';
import {observerPollInterval} from '@/lib/observer-cadence';

export type ObserverSpeed = 1 | 4 | 12;

export function useObserver() {
  const [view, setView] = useState<ObserverView | null>(null);
  const [fault, setFault] = useState('');
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(true);
  const [speedPending, setSpeedPending] = useState(false);
  const wanted = useRef<{watchAI?:string; speed?:ObserverSpeed}>({});
  const pulse = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    let active = false;
    let queued = false;
    let locked = false;
    let timer: number | undefined;
    let pollingDelay = 6000;
    let controller: AbortController | null = null;

    const refresh = async () => {
      if (!alive || document.hidden || locked) return;
      if (active) {
        queued = true;
        return;
      }
      window.clearTimeout(timer);
      active = true;
      const request = {...wanted.current};
      controller = new AbortController();
      setBusy(true);
      try {
        const response = await fetch('/api/frontier', {
          method: 'POST', cache: 'no-store', credentials: 'same-origin',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({op:'observe', ...request}), signal: controller.signal
        });
        if (!alive) return;
        if (response.status === 401 || response.status === 403) {
          locked = true;
          setDenied(true);
          setView(null);
          setFault('Ce poste est réservé au propriétaire du jeu. Connectez-vous avec son compte pour consulter le monde.');
          return;
        }
        if (!response.ok) throw new Error('Le serveur de simulation est momentanément indisponible.');
        const data = await response.json() as {view?:ObserverView};
        if (!data.view) throw new Error('Le serveur a envoyé un relevé incomplet.');
        if (!alive) return;
        const {speed, simulationBehind} = data.view;
        pollingDelay = observerPollInterval(speed, simulationBehind);
        setView(data.view);
        setFault('');
        if (request.speed === wanted.current.speed) {
          delete wanted.current.speed;
          setSpeedPending(false);
        }
      } catch (error) {
        pollingDelay = 6000;
        if (alive) setFault(error instanceof Error ? error.message : 'Connexion à la simulation interrompue.');
      } finally {
        active = false;
        if (alive) {
          setBusy(false);
          if (queued) {
            queued = false;
            void refresh();
          } else if (!locked && !document.hidden) {
            timer = window.setTimeout(refresh, pollingDelay);
          }
        }
      }
    };

    pulse.current = refresh;
    const onVisible = () => {
      if (document.hidden) window.clearTimeout(timer);
      else void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    void refresh();
    return () => {
      alive = false;
      controller?.abort();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      pulse.current = () => {};
    };
  }, []);

  const watch = useCallback((id:string) => {
    if (id === wanted.current.watchAI) return;
    wanted.current.watchAI = id;
    pulse.current();
  }, []);
  const setSpeed = useCallback((speed:ObserverSpeed) => {
    wanted.current.speed = speed;
    setSpeedPending(true);
    pulse.current();
  }, []);
  const retry = useCallback(() => pulse.current(), []);
  return {view, fault, denied, busy, speedPending, watch, setSpeed, retry};
}
