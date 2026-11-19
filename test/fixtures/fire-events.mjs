// In-memory game clients see the same boundary as HTTP clients: a trigger is sent
// once and the server broadcasts a trace and one resolved contact per victim.
export function broadcastEvents(event, nextSequence) {
  if (event.type !== 'fire') return [event];
  const {hits, ...shot} = event.data;
  return [{...event, type:'shot', data:shot}, ...hits.map(({target,damage,angle,force}) => ({
    ...event, seq:nextSequence(), type:'hit',
    data:{target,damage,angle,force,cause:'weapon',weapon:shot.kind,shotId:shot.shotId,firedAt:shot.firedAt}
  }))];
}
