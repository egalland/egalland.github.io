export const PRESETS = [
  {id:'nordic',name:'Nordique'}, {id:'diamond',name:'Losanges'},
  {id:'wave',name:'Vagues'}, {id:'heart',name:'Petits cœurs'},
  {id:'stripe',name:'Rayures'}, {id:'blank',name:'Page blanche'}
];
export const PALETTES = [
  {name:'Sous-bois',colors:['#354e41','#e5dfcb','#b77e60'],labels:['Pin','Écru','Argile']},
  {name:'Dune',colors:['#b98a68','#f1e5cc','#685c47'],labels:['Camel','Avoine','Écorce']},
  {name:'Crépuscule',colors:['#37475a','#e3decb','#ac8e9b'],labels:['Encre','Brume','Bruyère']}
];
export function pattern(id,cols=24,rows=24){
  return Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>{
    const xx=x%24, yy=y%24;
    if(id==='blank')return 0;
    if(id==='stripe')return yy<4?1:yy<6?2:yy<12?0:yy<16?1:yy<18?2:0;
    if(id==='heart'){
      const hx=x%12,hy=y%12;
      const heart=['000000000000','001100011000','011110111100','011111111100','011111111100','001111111000','000111110000','000011100000','000001000000','000000000000','000000000000','000000000000'];
      return heart[hy][hx]==='1'?((Math.floor(x/12)+Math.floor(y/12))%2?2:1):0;
    }
    if(id==='diamond'){
      const dx=Math.abs((x%12)-5.5),dy=Math.abs((y%12)-5.5),d=dx+dy;
      return d<2?2:d>4&&d<6?1:0;
    }
    if(id==='wave')return ((yy+Math.round(2*Math.sin(xx*Math.PI/6)))%12+12)%12<3?1:((yy+Math.round(2*Math.sin(xx*Math.PI/6)))%12+12)%12===5?2:0;
    if(yy===1||yy===22)return 1;
    if(yy===3||yy===20)return 2;
    if(yy===5||yy===18)return xx%4===0?1:0;
    const dx=Math.abs(xx-11.5),dy=Math.abs(yy-11.5);
    if((dx<1.1&&dy<6.1)||(dy<1.1&&dx<6.1)||(Math.abs(dx-dy)<1.1&&dx<4.1))return 1;
    if(dx+dy>8&&dx+dy<9.1)return 2;
    return 0;
  }));
}
export function defaultState(){return {schema:'maille-project',version:1,name:'Pull des sous-bois',cols:24,rows:24,grid:pattern('nordic'),palette:PALETTES[0].colors.map((hex,i)=>({hex,name:PALETTES[0].labels[i]})),selected:1,preset:'nordic',collar:'round',fit:'regular',size:'M',gaugeStitches:20,gaugeRows:28,placement:'yoke',progress:1,completed:false,direction:'round'};}
const number=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
export function validateState(raw){
  if(!raw||raw.schema!=='maille-project'||raw.version!==1)throw new Error('Ce fichier n’est pas un projet Maille compatible.');
  if(!Number.isInteger(raw.cols)||!Number.isInteger(raw.rows)||raw.cols<8||raw.cols>64||raw.rows<8||raw.rows>64)throw new Error('La grille doit contenir de 8 à 64 mailles et rangs.');
  if(!Array.isArray(raw.palette)||raw.palette.length<2||raw.palette.length>8||raw.palette.some(p=>!p||typeof p.hex!=='string'||!/^#[0-9a-f]{6}$/i.test(p.hex)))throw new Error('Les couleurs du projet ne sont pas valides.');
  if(!Array.isArray(raw.grid)||raw.grid.length!==raw.rows||raw.grid.some(r=>!Array.isArray(r)||r.length!==raw.cols||r.some(v=>!Number.isInteger(v)||v<0||v>=raw.palette.length)))throw new Error('Le dessin du projet est incomplet ou invalide.');
  const clean=defaultState();
  clean.name=typeof raw.name==='string'?raw.name.trim().slice(0,60)||'Mon pull':'Mon pull';
  clean.cols=raw.cols;clean.rows=raw.rows;clean.grid=raw.grid.map(r=>[...r]);
  clean.palette=raw.palette.map((p,i)=>({hex:p.hex,name:typeof p.name==='string'?p.name.slice(0,24):'Laine '+String.fromCharCode(65+i)}));
  clean.selected=Math.floor(number(raw.selected,0,clean.palette.length-1,1));
  clean.preset=PRESETS.some(p=>p.id===raw.preset)?raw.preset:'custom';
  for(const [k,allowed] of Object.entries({collar:['round','high','v'],fit:['regular','oversize'],size:['XS','S','M','L','XL','XXL'],placement:['yoke','all','band'],direction:['round','flat']}))if(allowed.includes(raw[k]))clean[k]=raw[k];
  clean.gaugeStitches=number(raw.gaugeStitches,8,50,20);clean.gaugeRows=number(raw.gaugeRows,8,60,28);
  clean.progress=Math.floor(number(raw.progress,1,clean.rows,1));clean.completed=raw.completed===true;
  return clean;
}
export function resizePattern(grid,cols,rows){return Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>grid[y]?.[x]??0));}
export function floodFill(grid,x,y,color){
  const original=grid[y][x];if(original===color)return;
  const stack=[[x,y]],rows=grid.length,cols=grid[0].length;
  while(stack.length){const [cx,cy]=stack.pop();if(cx<0||cy<0||cx>=cols||cy>=rows||grid[cy][cx]!==original)continue;grid[cy][cx]=color;stack.push([cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]);}
}
export function rowRuns(state){
  const raw=[...state.grid[state.rows-state.progress]];
  if(state.direction==='round'||state.progress%2===1)raw.reverse();
  const runs=[];for(const v of raw){const last=runs.at(-1);if(last?.color===v)last.count++;else runs.push({color:v,count:1});}return runs;
}
export const shade=(hex,v)=>{const n=parseInt(hex.slice(1),16),rgb=hex.startsWith('#')?[n>>16,(n>>8)&255,n&255]:hex.match(/[\d.]+/g).slice(0,3).map(Number),clamp=n=>Math.max(0,Math.min(255,Math.round(n)));return `rgb(${rgb.map(n=>clamp(n+v)).join(',')})`;};
export function stitch(ctx,x,y,w,h,hex,detail=true){
  ctx.fillStyle=shade(hex,-28);ctx.fillRect(x,y,w+.5,h+.5);
  for(let side=0;side<2;side++){
    const flip=side?-1:1,origin=side?x+w:x;
    const px=t=>origin+flip*t*w;
    const grad=ctx.createLinearGradient(px(.08),y,px(.5),y);
    grad.addColorStop(0,shade(hex,-14));grad.addColorStop(.4,shade(hex,10));grad.addColorStop(.7,shade(hex,1));grad.addColorStop(1,shade(hex,-25));ctx.fillStyle=grad;
    ctx.beginPath();ctx.moveTo(px(.49),y+h*1.02);ctx.bezierCurveTo(px(.27),y+h*.78,px(.04),y+h*.35,px(.08),y-h*.1);ctx.bezierCurveTo(px(.32),y-h*.04,px(.6),y+h*.52,px(.49),y+h*1.02);ctx.fill();
    if(detail){
      ctx.lineWidth=Math.max(.45,w*.035);ctx.strokeStyle=shade(hex,18);ctx.globalAlpha=.45;
      for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(px(.13+j*.055),y+h*.06);ctx.bezierCurveTo(px(.11+j*.08),y+h*.24,px(.39+j*.03),y+h*.68,px(.46+j*.015),y+h*.88);ctx.stroke();}
      ctx.globalAlpha=1;
    }
  }
}
export function drawSwatch(canvas,state){
  const ctx=canvas.getContext('2d'),c=24,r=16,w=canvas.width/c,h=canvas.height/r;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<r;y++)for(let x=0;x<c;x++)stitch(ctx,x*w,y*h,w,h,state.palette[state.grid[y%state.rows][x%state.cols]].hex);
}
export function drawChart(canvas,state,{symbols=false,highlight=0,cursor=null,exporting=false}={}){
  const ctx=canvas.getContext('2d'),pad=exporting?48:30,W=canvas.width,H=canvas.height;
  const cell=Math.min((W-pad-4)/state.cols,(H-pad-4)/state.rows),x0=(W-pad-cell*state.cols)/2+2,y0=2;
  ctx.fillStyle=exporting?'#fbfaf6':'#fbfaf6';ctx.fillRect(0,0,W,H);
  for(let y=0;y<state.rows;y++)for(let x=0;x<state.cols;x++){
    const hex=state.palette[state.grid[y][x]].hex;
    ctx.fillStyle=hex;ctx.fillRect(x0+x*cell,y0+y*cell,cell+.2,cell+.2);
    if(highlight&&state.rows-y!==highlight){ctx.fillStyle='#fbfaf6b0';ctx.fillRect(x0+x*cell,y0+y*cell,cell+.2,cell+.2);}
    if(symbols){const light=parseInt(hex.slice(1,3),16)*.299+parseInt(hex.slice(3,5),16)*.587+parseInt(hex.slice(5,7),16)*.114;ctx.fillStyle=light>140?'#27382c':'#ffffff';ctx.font=`${Math.max(7,cell*.43)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String.fromCharCode(65+state.grid[y][x]),x0+(x+.5)*cell,y0+(y+.52)*cell);}
  }
  for(let x=0;x<=state.cols;x++){ctx.strokeStyle=x%4===0?'#182c2255':'#ffffff35';ctx.lineWidth=x%4===0?1.5:.8;ctx.beginPath();ctx.moveTo(x0+x*cell,y0);ctx.lineTo(x0+x*cell,y0+cell*state.rows);ctx.stroke();}
  for(let y=0;y<=state.rows;y++){ctx.strokeStyle=(state.rows-y)%4===0?'#182c2255':'#ffffff35';ctx.lineWidth=(state.rows-y)%4===0?1.5:.8;ctx.beginPath();ctx.moveTo(x0,y0+y*cell);ctx.lineTo(x0+cell*state.cols,y0+y*cell);ctx.stroke();}
  ctx.font=`${exporting?15:Math.max(12,Math.min(18,cell*.58))}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#929a84';
  const every=state.cols>32?4:2;
  for(let x=0;x<state.cols;x++)if((state.cols-x)%every===0||x===state.cols-1)ctx.fillText(state.cols-x,x0+(x+.5)*cell,y0+state.rows*cell+pad*.55);
  for(let y=0;y<state.rows;y++)if((state.rows-y)%every===0||y===state.rows-1)ctx.fillText(state.rows-y,x0+state.cols*cell+pad*.53,y0+(y+.5)*cell);
  if(highlight){ctx.strokeStyle='#bd7858';ctx.lineWidth=4;ctx.strokeRect(x0,y0+(state.rows-highlight)*cell,state.cols*cell,cell);}
  if(cursor){ctx.strokeStyle='#bf7959';ctx.lineWidth=4;ctx.strokeRect(x0+cursor.x*cell+1,y0+cursor.y*cell+1,cell-2,cell-2);}
  return {x0,y0,cell,width:state.cols*cell,height:state.rows*cell};
}
