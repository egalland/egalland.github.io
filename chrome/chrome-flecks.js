// Splinters belong to a world-space link or a word, so they travel with it.
const tau=2*Math.PI;
function noise(id){
 const n=Math.sin(id*78.233+31.7)*43758.5453;
 return n-Math.floor(n);
}
export function makeFlecks(stage,sections){
 const rear=document.createElement('div'),front=document.createElement('div');
 for(const layer of [rear,front]){
  layer.className='fleck-layer';layer.setAttribute('aria-hidden','true');
 }
 stage.querySelector('.backdrop').after(rear);stage.append(front);
 const pool=[],words=sections.map(section=>[...section.querySelectorAll('.metal-word')]);
 let used=0;
 function place(x,y,depth,turn,id,phase,lamp,compact){
  let el=pool[used++];
  if(!el){el=document.createElement('i');pool.push(el)}
  const layer=depth<0?rear:front;
  if(el.parentElement!==layer)layer.append(el);
  const seed=noise(id),near=lamp?Math.exp(-((x-lamp.x)**2+(y-lamp.y)**2)/18000):0;
  const size=(.76+.52*seed)*(compact?.76:1)*(.91+.17*depth);
  el.hidden=false;
  el.className=seed>.60?'filing curl':'filing';
  el.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) rotate('+turn.toFixed(2)+'rad) scale('+size.toFixed(3)+','+(size*(.45+.54*Math.abs(Math.cos(phase+seed)))).toFixed(3)+')';
  el.style.opacity=(.63+.21*depth+.15*near).toFixed(3);
  el.style.backgroundPosition=(50+34*Math.sin(turn*.8)+12*near).toFixed(1)+'% 50%';
 }
 return function draw(links,first,p,clock,box,lamp,enabled){
  used=0;
  if(enabled){
   const compact=box.width<=680||box.height<380;
   // Space anchors in model coordinates; the same link keeps its own orbit.
   const spacing=compact?7:5;
   links.forEach((link,j)=>{
    const id=first+j;
    if((id+2)%spacing!==0)return;
    const seed=noise(id),t=clock*(.37+.21*seed)+seed*tau;
    const depth=Math.sin(t),r=link.size*(.68+.28*seed);
    const along=r*Math.cos(t),across=r*(.62*depth+.16*Math.sin(t*.62+seed));
    const cos=Math.cos(link.angle),sin=Math.sin(link.angle);
    place(link.x+cos*along-sin*across,link.y+sin*along+cos*across,depth,t*.72+seed*3,id,t,lamp,compact);
   });
   for(let k=Math.floor(p);k<=Math.ceil(p)&&k<words.length;k++){
    const line=words[k];if(!line.length)continue;
    const count=compact?2:3;
    for(let i=0;i<count;i++){
     const id=1001+k*13+i,seed=noise(id),word=line[(i+k)%line.length];
     const b=word.getBoundingClientRect();if(!b.width||b.right<-24||b.left>box.right+24)continue;
     const t=clock*(.23+.14*seed)+seed*tau+i*2.1;
     const depth=Math.sin(t),u=Math.cos(t);
     const x=b.left-box.left+b.width/2+u*(b.width*.51+7+4*Math.sin(t*.73));
     const y=b.top-box.top+b.height*.45+depth*(b.height*.48+5)+u*(seed-.5)*7;
     place(x,y,depth,t*.88+seed*4,id,t,lamp,compact);
    }
   }
  }
  for(let i=used;i<pool.length;i++)pool[i].hidden=true;
 };
}
