export const CABIN_RECT=[-380,-319.2,760,364.8];
export const CABIN_FLOOR=-15;

export function makeClosedCanopy(renderer,surface,sky){
 const path=c=>{
  c.beginPath();c.ellipse(500,420,470,400,0,Math.PI,0);
  c.ellipse(500,420,470,42,0,0,Math.PI);c.closePath();
 };
 const glassBack=surface(1000,480,(c,w,h)=>{
  path(c);const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'rgba(110,166,181,.10)');shade.addColorStop(1,'rgba(26,89,100,.30)');c.fillStyle=shade;c.fill();
  c.strokeStyle='rgba(135,218,215,.3)';c.lineWidth=2;c.stroke();
 });
 const glassFront=surface(1000,480,(c,w,h)=>{
  c.save();path(c);c.clip();
  c.globalAlpha=.07;c.drawImage(sky,0,0,sky.width,sky.height,20,-90,1600,750);c.globalAlpha=1;
  const image=c.createImageData(w,h);
  for(let y=0;y<462;y++)for(let x=25;x<975;x++){
   const nx=(x-500)/470,ny=(y-420)/400,r=nx*nx+ny*ny;
   if(r>1&&y<420)continue;
   const fresnel=Math.pow(Math.min(1,r),6),edge=Math.pow(Math.min(1,Math.abs(nx)),10),i=(y*w+x)*4;
   image.data[i]=115;image.data[i+1]=171;image.data[i+2]=184;image.data[i+3]=Math.round(255*(.035+.22*fresnel+.11*edge));
  }
  const layer=surface(w,h,q=>q.putImageData(image,0,0));c.drawImage(layer,0,0);
  const rim=c.createLinearGradient(0,0,w,0);rim.addColorStop(0,'rgba(139,226,224,.65)');rim.addColorStop(.3,'rgba(213,244,231,.28)');rim.addColorStop(.7,'rgba(89,169,184,.16)');rim.addColorStop(1,'rgba(131,216,223,.58)');
  path(c);c.strokeStyle=rim;c.lineWidth=3;c.stroke();
  // Both curved end walls are visible and joined continuously to the lower ring.
  for(const side of [-1,1]){c.beginPath();c.moveTo(500+side*467,418);c.bezierCurveTo(500+side*459,315,500+side*405,161,500+side*321,106);c.strokeStyle=side<0?'rgba(193,238,230,.40)':'rgba(110,205,217,.32)';c.lineWidth=5;c.stroke();}
  c.beginPath();c.moveTo(123,301);c.bezierCurveTo(153,149,283,67,383,52);c.strokeStyle='rgba(236,255,247,.16)';c.lineWidth=17;c.lineCap='round';c.stroke();
  c.beginPath();c.moveTo(154,286);c.bezierCurveTo(169,231,191,194,214,171);c.strokeStyle='rgba(243,255,251,.23)';c.lineWidth=3;c.stroke();c.restore();
 });
 const skirt=surface(1000,150,(c,w,h)=>{
  // An opaque collar bridges the dome to the sloping hull at the left and right.
  c.beginPath();c.ellipse(500,51,474,37,0,Math.PI,0);c.lineTo(986,111);c.ellipse(500,111,486,37,0,0,Math.PI);c.closePath();
  const g=c.createLinearGradient(0,5,0,145);g.addColorStop(0,'#547568');g.addColorStop(.25,'#213e37');g.addColorStop(.52,'#304c3f');g.addColorStop(1,'#0a211f');c.fillStyle=g;c.fill();
  c.beginPath();c.ellipse(500,51,474,37,0,0,Math.PI*2);c.strokeStyle='#b9e1cd77';c.lineWidth=4;c.stroke();
  c.beginPath();c.ellipse(500,54,464,31,0,0,Math.PI);c.strokeStyle='#0b221f';c.lineWidth=6;c.stroke();
  for(let k=0;k<11;k++){const a=Math.PI*k/10,x=500+470*Math.cos(a),y=53+34*Math.sin(a);c.beginPath();c.ellipse(x,y,2.5,1.6,0,0,Math.PI*2);c.fillStyle='#91aaa0';c.fill();}
 });
 return {domeBack:renderer.texture(glassBack),domeFront:renderer.texture(glassFront),cabinSkirt:renderer.texture(skirt)};
}
