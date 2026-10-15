/** A monotonic browser clock: server snapshots may shorten, never refill, a phase. */
export type CountdownSnapshot={game:string;round:number;phase:string;deadline:number;serverNow:number};
export type CountdownClock={key:string;endsAt:number;durationMs:number};
export function phaseDuration(phase:string){return phase==='guess'?20000:phase==='podium'?60000:phase==='countdown'||phase==='reveal'?5000:0;}
export function synchronizeCountdown(previous:CountdownClock|null,snapshot:CountdownSnapshot,now:number):CountdownClock{
 const durationMs=phaseDuration(snapshot.phase);
 const key=[snapshot.game,snapshot.round,snapshot.phase,snapshot.deadline].join(':');
 const left=Number.isFinite(snapshot.deadline)&&Number.isFinite(snapshot.serverNow)?Math.max(0,Math.min(durationMs,snapshot.deadline-snapshot.serverNow)):0;
 const endsAt=now+left;
 return {key,durationMs,endsAt:previous?.key===key?Math.min(previous.endsAt,endsAt):endsAt};
}
export function countdownRemaining(clock:CountdownClock|null,now:number){return clock?Math.max(0,Math.min(clock.durationMs,clock.endsAt-now)):0;}
export function countdownFraction(clock:CountdownClock|null,now:number){return clock?.durationMs?countdownRemaining(clock,now)/clock.durationMs:0;}
