import {clamp,objectRect,objectLevel,openingParent} from './engine.js';

// Use the same absolute placement and room attachment rules as dragging.
export function nudgeElement(s,selection,dx,dy){
 if(!selection)return;
 const type=selection.type,o=type==='platform'?s.levels.find(l=>l.id===selection.id)?.platform:(type==='room'?s.rooms:type==='object'?s.objects:s.openings).find(x=>x.id===selection.id);
 if(!o)return;
 const round=n=>Math.round(n*1000)/1000,bound=(n,max)=>round(clamp(n,0,Math.max(0,max)));
 if(type==='opening'){
  const parent=openingParent(s,o),horizontal=['north','south'].includes(o.wall),length=horizontal?parent.w||s.building.w:parent.l||s.building.l;
  o.offset=bound(o.offset+(horizontal?dx:dy),length-o.w);return;
 }
 if(type==='object'){
  const p=objectRect(s,o),levelId=objectLevel(s,o),x=bound(p.x+dx,s.building.w-o.w),y=bound(p.y+dy,s.building.l-o.l);
  const room=o.kind==='stairs'?null:s.rooms.find(r=>r.levelId===levelId&&x+o.w/2>=r.x&&x+o.w/2<=r.x+r.w&&y+o.l/2>=r.y&&y+o.l/2<=r.y+r.l&&o.w<=r.w&&o.l<=r.l);
  o.roomId=room?.id||null;o.levelId=levelId;o.x=bound(x-(room?.x||0),(room||s.building).w-o.w);o.y=bound(y-(room?.y||0),(room||s.building).l-o.l);return;
 }
 o.x=bound(o.x+dx,s.building.w-o.w);o.y=bound(o.y+dy,s.building.l-o.l);
}
