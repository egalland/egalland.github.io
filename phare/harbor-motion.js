// Animate only the water pixels; the skyline, letters and interface stay still.
export function createHarborMotion(image,canvas){
 const ctx=canvas.getContext('2d');const still=document.createElement('canvas'),copy=still.getContext('2d');const media=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,ratio=1,layout=null,points={desktop:[],mobile:[]},currentSrc='',lastFrame=-Infinity,cleared=false;
 fetch('./window-lights.json').then(response=>{if(!response.ok)throw Error('window lights');return response.json()}).then(data=>{points=data;lastFrame=-Infinity}).catch(()=>{});
 function resize(quality=1.5){
  if(!ctx||!copy)return;const rect=canvas.parentElement.getBoundingClientRect();width=Math.round(rect.width);height=Math.round(rect.height);if(!width||!height)return;
  ratio=Math.min(devicePixelRatio,quality,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);still.width=width;still.height=height;currentSrc=image.currentSrc;
  if(!image.complete||!image.naturalWidth){layout=null;return}
  const iw=image.naturalWidth,ih=image.naturalHeight,scale=Math.max(width/iw,height/ih),x=(width-iw*scale)/2,y=(height-ih*scale)/2;
  copy.drawImage(image,x,y,iw*scale,ih*scale);const mobile=currentSrc.includes('mobile');layout={iw,ih,scale,x,y,mobile,waterY:Math.max(0,y+ih*(mobile?.54:.51)*scale)};lastFrame=-Infinity;cleared=false;
 }
 image.addEventListener('load',()=>resize(ratio));media.addEventListener('change',()=>{lastFrame=-Infinity;cleared=false});
 function draw(ms,{enabled=true,quality=1.5}={}){
  if(!ctx||!copy)return;if(image.currentSrc!==currentSrc||(image.complete&&image.naturalWidth&&!layout))resize(quality);
  if(!layout)return;const active=enabled&&!media.matches;
  if(!active){if(!cleared){ctx.clearRect(0,0,width,height);cleared=true}return}
  if(document.hidden||ms-lastFrame<1000/30)return;lastFrame=ms;cleared=false;ctx.clearRect(0,0,width,height);const t=ms*.001;
  const waterY=Math.ceil(layout.waterY),waterHeight=Math.max(1,height-waterY);
  // Feather the first 40px into the still source, so no new horizon is created.
  for(let y=waterY;y<height;y+=2){
   const depth=(y-waterY)/waterHeight,amplitude=.4+depth*Math.min(3,width*.0035);
   const dx=(Math.sin(y*.105-t*1.15)+.42*Math.sin(y*.043+t*.76))*amplitude;
   const dy=Math.sin(y*.071-t*.92)*(.18+depth*.7);const sy=Math.max(0,Math.min(height-2,y+dy));
   ctx.globalAlpha=Math.min(1,(y-waterY)/40);ctx.drawImage(still,0,sy,width,2,dx,y,width,2);
  }
  ctx.globalAlpha=1;
  // Each glow sits on an existing warm window, found in the original artwork.
  const windows=points[layout.mobile?'mobile':'desktop'];ctx.globalCompositeOperation='screen';
  for(let i=0;i<windows.length;i++){
   const [u,v,rw,rh]=windows[i],x=layout.x+u*layout.iw*layout.scale,y=layout.y+v*layout.ih*layout.scale;
   if(x<0||x>width||y<0||y>height)continue;
   const pulse=.48+.27*Math.sin(t*(.33+(i%5)*.041)+i*2.39)+.08*Math.sin(t*.91+i);
   const ww=Math.max(1.1,rw*layout.iw*layout.scale),hh=Math.max(1.4,rh*layout.ih*layout.scale),radius=Math.max(3,Math.min(9,ww*1.9));
   const halo=ctx.createRadialGradient(x,y,0,x,y,radius);halo.addColorStop(0,`rgba(255,195,95,${pulse*.23})`);halo.addColorStop(1,'rgba(255,171,69,0)');ctx.fillStyle=halo;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
   ctx.fillStyle=`rgba(255,214,133,${pulse*.35})`;ctx.fillRect(x-ww*.32,y-hh*.32,ww*.64,hh*.64);
  }
  ctx.globalCompositeOperation='source-over';
 }
 return {resize,draw};
}
