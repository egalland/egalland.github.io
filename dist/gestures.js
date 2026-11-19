export function pinchView({bounds,zoom,anchor,center,viewport,minZoom=.5,maxZoom=6}){
 const z=Math.max(minZoom,Math.min(maxZoom,zoom)),w=bounds.w/z,h=bounds.h/z;
 const scale=Math.min(viewport.width/w,viewport.height/h),left=(viewport.width-w*scale)/2,top=(viewport.height-h*scale)/2;
 const x=anchor.x-(center.x-left)/scale,y=anchor.y-(center.y-top)/scale;
 return{zoom:z,panX:x-bounds.x-bounds.w/2+w/2,panY:y-bounds.y-bounds.h/2+h/2};
}
