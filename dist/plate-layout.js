// Conservative shelf packing: same filament, one extrusion stream, no overlapping bounding boxes.
export function packPlate(orders,volume,maxParts=4,gap=6){
 const slots=[],shelves=[];let y=0;
 for(const o of orders){if(slots.length>=maxParts)break;const [w,d,h]=o.dimensions||[120,90,70];if(h>volume[2])continue;let placed=null;
  for(const rotated of [false,true]){const a=rotated?d:w,b=rotated?w:d;if(a>volume[0]||b>volume[1])continue;
   for(const shelf of shelves)if(b<=shelf.depth&&shelf.x+a<=volume[0]){placed={id:o.id,x:shelf.x,y:shelf.y,w:a,d:b,h,rotated};shelf.x+=a+gap;break;}
   if(!placed&&y+b<=volume[1]){placed={id:o.id,x:0,y,w:a,d:b,h,rotated};shelves.push({x:a+gap,y,depth:b});y+=b+gap;}if(placed)break;
  }if(placed)slots.push(placed);
 }
 return {slots,fill:slots.reduce((n,p)=>n+p.w*p.d,0)/(volume[0]*volume[1])*100};
}
export function compatiblePlateOrders(lead,candidates){return [lead,...candidates.filter(o=>o.id!==lead.id&&o.isStock&&o.status==='queued'&&o.material===lead.material&&o.colorId===lead.colorId)];}
