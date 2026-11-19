(() => {
 const canvas=document.querySelector('#atlasMap'), ctx=canvas.getContext('2d'),search=document.querySelector('#atlasQuery'),tip=document.querySelector('#mapTip'),directory=document.querySelector('#directory');
 let items=[],nodes=[],hover=null;
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const matches=x=>normalize(x.name+' '+(x.owner||'')).includes(normalize(search.value.trim()));
 function open(item){window.dispatchEvent(new CustomEvent('folder-pick',{detail:item}))}
 function render(){
  const {width:w,height:h}=canvas.getBoundingClientRect();if(!w||!h)return;
  const ratio=Math.min(2,devicePixelRatio||1);canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
  let sky=ctx.createRadialGradient(w*.48,h*.52,2,w*.5,h*.5,w*.65);sky.addColorStop(0,'#28413a');sky.addColorStop(1,'#0c191a');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  for(let i=0;i<165;i++){ctx.fillStyle=i%7?'#688075':'#c2c7a7';ctx.fillRect((i*173.17)%w,(i*i*1.37)%h,1,1)}
  nodes=[];let mobile=w<600;
  function poly(points,c){ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fillStyle=c;ctx.fill()}
  for(const repo of [false,true]){
   const group=items.filter(x=>x.repo===repo);if(!group.length)continue;
   const left=mobile?0:(repo?w*.46:0),top=mobile?(repo?h*.43:0):0,gw=mobile?w:(repo?w*.54:w*.46),gh=mobile?(repo?h*.57:h*.43):h;
   const cols=Math.max(1,Math.ceil(Math.sqrt(group.length*gw/gh*.8))),rows=Math.ceil(group.length/cols),sx=gw/(cols+2),sy=(gh-34)/(rows+1);
   ctx.fillStyle='#b2c5b5';ctx.font='10px monospace';ctx.fillText(repo?'CHANTIER GITHUB':'SITES CHATGPT',left+14,top+19);
   group.forEach((item,i)=>{const col=i%cols,row=Math.floor(i/cols),x=left+sx*(1.1+col+(row%2)*.45),y=top+31+sy*(row+.8)+Math.sin(col*.91)*sy*.17;
    const size=Math.min(sx*.40,sy*.53,19),z=size*(.36+(i%4)*.09),active=matches(item);ctx.globalAlpha=active?1:.14;
    if(col){const prev=nodes[nodes.length-1];ctx.strokeStyle='#698779';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(prev.x+size*.7,prev.y);ctx.lineTo(x-size*.7,y);ctx.stroke()}
    const a=[x-size,y],b=[x,y-size*.46],c=[x+size,y],d=[x,y+size*.46],up=p=>[p[0],p[1]-z];poly([a,d,up(d),up(a)],repo?'#996d50':'#607f71');poly([d,c,up(c),up(d)],repo?'#704e3d':'#496656');poly([a,b,c,d].map(up),repo?'#d9a77a':'#a8cdb6');
    ctx.strokeStyle=repo?'#ac835e':'#7ea690';ctx.lineWidth=.8;for(let j=-2;j<3;j++){ctx.beginPath();ctx.moveTo(x+j*size*.2,y-z-size*.17);ctx.lineTo(x+(j+.3)*size*.2,y-z);ctx.lineTo(x+(j+.8)*size*.2,y-z-size*.17);ctx.stroke()}
    ctx.fillStyle='#f4d896';ctx.fillRect(x+size*.34,y-z*.3,Math.max(1,size*.19),1.6);
    if(hover===item||(active&&search.value)){ctx.strokeStyle='#f4e6a7';ctx.beginPath();ctx.ellipse(x,y-z*.4,size*1.23,size*.88,0,0,Math.PI*2);ctx.stroke()}
    nodes.push({item,x,y,r:size,z});ctx.globalAlpha=1;
   })
  }
 }
 function pick(e){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;return nodes.slice().reverse().find(n=>matches(n.item)&&Math.abs(x-n.x)/n.r+Math.abs(y-n.y+n.z*.5)/(n.r*.74)<1.3)}
 canvas.onpointermove=e=>{const n=pick(e);if((n?.item||null)===hover)return;hover=n?.item||null;tip.textContent=hover?.name||'';if(n){tip.style.left=Math.min(canvas.clientWidth*.83,Math.max(canvas.clientWidth*.17,n.x))+'px';tip.style.top=Math.max(0,n.y-n.r-32)+'px'}render()};
 canvas.onpointerleave=()=>{hover=null;tip.textContent='';render()};canvas.onclick=e=>{let n=pick(e);if(n)open(n.item)};
 window.drawProjectMap=list=>{items=list;hover=null;tip.textContent='';render()};
 new ResizeObserver(render).observe(canvas)
})();
