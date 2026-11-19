// A wound ball and two knitting needles, drawn at the actual raster resolution of the badge.
export function drawBrand(ctx) {
  const width=ctx.canvas.width,height=ctx.canvas.height,s=Math.min(width,height)/48;
  ctx.save();ctx.clearRect(0,0,width,height);
  ctx.translate((width-48*s)/2,(height-48*s)/2);ctx.scale(s,s);
  ctx.lineCap='round';ctx.lineJoin='round';
  function thread(path,color,weight) {
    ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.beginPath();ctx.moveTo(...path[0]);
    for(const p of path.slice(1)){if(p.length===2)ctx.lineTo(...p);else ctx.bezierCurveTo(...p);}
    ctx.stroke();
  }
  function bead(x,y,r,color){
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  thread([[5,5],[39,40]],'#25313a',4.7);thread([[5,5],[39,40]],'#d9aa65',2.45);
  thread([[39,4],[8,39]],'#27333a',4.8);thread([[39,4],[8,39]],'#98b9a6',2.5);
  bead(5,5,2.8,'#f0c987');bead(39,4,2.8,'#b7cbb3');
  thread([[24,35],[30,47,32,34,39,38],[42,40,44,41,46,39]],'#482e37',3.9);
  thread([[24,35],[30,47,32,34,39,38],[42,40,44,41,46,39]],'#cf8273',2.2);
  ctx.beginPath();ctx.ellipse(23,24,16.9,15.7,-.32,0,Math.PI*2);ctx.fillStyle='#9f5357';ctx.fill();ctx.strokeStyle='#462f38';ctx.lineWidth=2.4;ctx.stroke();
  ctx.save();ctx.clip();
  for(let i=0;i<9;i++)thread([[3+i*4.5,6],[9+i*4,18,14+i*4,29,31+i*4.5,44]],i%2?'#e8a08c':'#c47570',2.45);
  for(let i=0;i<5;i++)thread([[4,32+i*3.7],[14,34+i*3,31,23+i*3,42,13+i*3]],i%2?'#efac92':'#a35c60',2.5);
  thread([[10,18],[12,14,14,13,17,12]],'#ffdab1',1.6);ctx.restore();ctx.restore();
}
