// Emboss the original eg. silhouette and the project emblems. The normals are cached;
// pointer input only repaints the reflected studio lights, never the lettering itself.
export function drawEmblem(p,index){
 p.lineCap='round';p.lineJoin='round';p.fillStyle=p.strokeStyle='#fff';
 if(index==='chrome'){
  p.translate(-39,23);p.transform(1,-.058,-.15,1,0,24);p.lineWidth=32;
  p.beginPath();p.moveTo(173,111);p.bezierCurveTo(205,114,238,107,239,87);p.bezierCurveTo(242,48,181,49,162,88);p.bezierCurveTo(139,145,194,166,235,137);p.stroke();
  p.beginPath();p.moveTo(349,77);p.bezierCurveTo(318,44,269,68,258,100);p.bezierCurveTo(247,143,296,164,329,127);p.bezierCurveTo(347,106,348,85,350,73);p.lineTo(343,151);p.bezierCurveTo(338,203,293,220,264,193);p.stroke();
  p.beginPath();p.arc(399,139,21,0,Math.PI*2);p.fill();
 }else if(index==='pills'){
  p.translate(240,155);p.rotate(-.2);p.beginPath();p.arc(0,0,108,0,Math.PI*2);p.fill();
  p.globalCompositeOperation='destination-out';
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;p.beginPath();p.arc(Math.sin(a)*64,Math.cos(a)*64,28,0,Math.PI*2);p.fill()}
  p.beginPath();p.arc(0,0,15,0,Math.PI*2);p.fill();
 }else if(index==='atlas'){
  p.translate(240,157);p.rotate(-.31);p.lineWidth=15;
  for(const [rx,ry] of [[100,100],[46,100],[100,30]]){p.beginPath();p.ellipse(0,0,rx,ry,0,0,Math.PI*2);p.stroke()}
  p.lineWidth=11;p.beginPath();p.ellipse(0,0,142,46,-.35,-.35,Math.PI+.2);p.stroke();
 }else if(index==='inktober'){
  p.translate(240,156);p.rotate(.33);p.beginPath();p.moveTo(0,-124);p.quadraticCurveTo(24,-61,73,-7);p.lineTo(46,67);p.lineTo(-46,67);p.lineTo(-73,-7);p.quadraticCurveTo(-24,-61,0,-124);p.fill();
  p.fillRect(-43,79,86,17);p.globalCompositeOperation='destination-out';p.lineWidth=7;p.beginPath();p.moveTo(0,-121);p.lineTo(0,-3);p.stroke();p.beginPath();p.arc(0,3,12,0,Math.PI*2);p.fill();
 }else{
  p.translate(240,160);p.rotate(-.13);p.lineWidth=20;
  const trace=points=>{p.beginPath();for(const [i,[x,y]] of points.entries())i?p.lineTo(x,y):p.moveTo(x,y);p.stroke()};
  const ring=(x,y,r)=>{p.beginPath();p.arc(x,y,r,0,2*Math.PI);p.stroke()};
  switch(index){
   case 'market-plus':
    trace([[-102,76],[-57,22],[-18,39],[37,-43],[94,-78]]);trace([[49,-77],[94,-78],[94,-30]]);break;
   case 'kikalmo':
    p.font='italic 900 180px Arial';p.textAlign='center';p.textBaseline='middle';p.fillText('K',-7,5);ring(85,59,10);break;
   case 'maison':
    trace([[-101,2],[0,-79],[101,2]]);trace([[-73,-13],[-73,76],[72,76],[72,-13]]);trace([[-17,75],[-17,24],[19,24],[19,75]]);break;
   case 'bodyos':
    trace([[-100,0],[-58,0],[-33,-37],[-9,48],[19,-77],[41,0],[99,0]]);break;
   case 'livre':
    trace([[0,75],[-90,48],[-90,-69],[0,-38],[90,-69],[90,48],[0,75],[0,-38]]);break;
   case 'redim':
    trace([[-82,24],[-82,-67],[10,-67]]);trace([[81,-23],[81,68],[-11,68]]);trace([[-35,19],[35,-23]]);break;
   case 'about':
    trace([[-92,60],[58,-90],[90,-59],[-61,92],[-97,97],[-92,60]]);trace([[38,-68],[68,-38]]);break;
   case 'contact':
    trace([[-52,-42],[-99,0],[-52,42]]);trace([[52,-42],[99,0],[52,42]]);trace([[-20,74],[20,-74]]);break;
  }

 }
}
