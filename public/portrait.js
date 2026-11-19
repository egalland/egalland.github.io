// Illustrated front view of the fox, in the same teal cape worn in the street.
export function portrait(c,size){
  c.save();c.scale(size/100,size/100);c.lineJoin='round';c.lineCap='round';
  const ink='#493237',cream='#ffdeab',light='#f8b66c',fur='#d37c47';
  function shape(d,fill,outline=ink,width=2){const p=new Path2D(d);c.fillStyle=fill;c.fill(p);if(outline){c.lineWidth=width;c.strokeStyle=outline;c.stroke(p);}return p;}
  function stroke(d,col,width=1.5){c.strokeStyle=col;c.lineWidth=width;c.stroke(new Path2D(d));}
  function oval(x,y,rx,ry,col,rot=0){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fill();}
  function knit(path,startX,startY,w,h,col,step=7){c.save();c.clip(path);for(let j=0;j<h;j+=step*.82){let shift=Math.round(j/(step*.82))%2?2.7:0;for(let i=0;i<w;i+=step){const x=startX+i+shift,y=startY+j;stroke('M'+x+' '+y+'q2 1 3 3q.8-2 2.7-3',col,.75);}}c.restore();}
  let cape=shape('M7 104Q9 82 30 76L33 71H69L73 76Q95 82 96 104Z','#3a8580');
  knit(cape,3,71,97,34,'#8ab5a2',7);
  stroke('M21 90Q36 87 45 77M80 90Q63 86 56 77','#edbd78',3);
  shape('M44 79Q50 75 57 79L56 87L50 92L44 87Z','#d6a75f');
  oval(50.5,84,3.3,4,'#6ac3b3');
  const head=shape('M16 43Q14 26 16 9Q17 4 20 7Q32 13 41 29Q51 26 61 30Q71 15 83 9Q88 8 86 15L83 44Q90 52 85 61L91 59Q89 69 76 71Q67 82 52 81Q37 83 25 72Q14 71 8 60L16 61Q11 51 16 43Z',fur,ink,2.8);
  knit(head,10,9,82,70,'#f1ab6b',6.8);
  shape('M20 14Q30 21 35 30L22 39Z','#e6ad87',null);
  shape('M80 16Q75 19 66 33L79 39Z','#edbb98',null);
  stroke('M23 24l4 6m48-6-4 7','#aa7865',1.7);
  shape('M11 56Q27 64 37 53Q43 48 49 55Q55 48 61 52Q69 62 87 55Q84 64 75 67L79 68Q68 73 60 75Q52 81 47 77Q31 75 22 68L25 67Q16 65 11 56Z',cream,null);
  oval(39.6,48.8,5.2,8.2,'#402e35',-.12);oval(60.7,48.1,5.2,8.3,'#402e35',.11);
  oval(41.0,46,1.6,2.5,'#fff4d7');oval(62.1,45.3,1.6,2.5,'#fff4d7');
  stroke('M32 39q5-5 10-3m14-1q6-3 11 2','#754a41',2.5);
  shape('M43 58Q50 54 57 57Q56 63 51 66Q46 65 43 58Z','#483339',ink,1);
  stroke('M51 66q-1 5-7 4m7-4q3 5 8 2','#68413c',1.8);
  stroke('M24 63l3 2m4-3 2 2m37-3 2-1m2 3 2-1','#be9072',1);
  stroke('M27 34l4-2m16 1 3 2m6-2 2 1',light,2);
  c.restore();
}
