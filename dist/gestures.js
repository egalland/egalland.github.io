export function pinchView({bounds,zoom,anchor,center,viewport,minZoom=.5,maxZoom=6}){
 const z=Math.max(minZoom,Math.min(maxZoom,zoom)),w=bounds.w/z,h=bounds.h/z;
 const scale=Math.min(viewport.width/w,viewport.height/h),left=(viewport.width-w*scale)/2,top=(viewport.height-h*scale)/2;
 const x=anchor.x-(center.x-left)/scale,y=anchor.y-(center.y-top)/scale;
 return{zoom:z,panX:x-bounds.x-bounds.w/2+w/2,panY:y-bounds.y-bounds.h/2+h/2};
}

export function focusView({bounds,rect,viewport,bottomInset=0,topInset=0,padding=30,maxZoom=6}){
 const visibleHeight=Math.max(40,viewport.height-bottomInset-topInset),scale=Math.min(Math.max(40,viewport.width-padding*2)/Math.max(.3,rect.w),Math.max(40,visibleHeight-padding*2)/Math.max(.3,rect.l));
 const baseScale=Math.min(viewport.width/bounds.w,viewport.height/bounds.h);
 return pinchView({bounds,zoom:scale/baseScale,anchor:{x:rect.x+rect.w/2,y:rect.y+rect.l/2},center:{x:viewport.width/2,y:topInset+visibleHeight/2},viewport,maxZoom});
}
