import { numberFr } from './projects.js';
const paths={
 book:'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z M12 6v14',
 download:'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',pencil:'m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-4L4 15l-1 6Z',
 check:'m4 12 5 5L20 6',x:'m6 6 12 12M6 18 18 6',rotate:'M20 9a8 8 0 1 0 0 7M20 3v6h-6',
 move:'M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4',
 camera:'M3 7h5l2-3h4l2 3h5v13H3Z M16 13a4 4 0 1 0-8 0 4 4 0 1 0 8 0',
 next:'M4 12h16m-6-6 6 6-6 6',back:'M20 12H4m6-6-6 6 6 6',plus:'M12 4v16M4 12h16',
 yarn:'M20 13a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-13-6 10 10m-12-7 10 10m-8-5 6 5m-1-6 6-6m-3 8 4-4m-2 8c0 2 3 3 5 1',
 ruler:'m3 16 13-13 5 5L8 21ZM12 7l3 3m-6 0 2 2m-5 1 3 3',grid:'M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18',
 shirt:'m8 4-6 4 3 5 3-2v10h8V11l3 2 3-5-6-4c-2 3-6 3-8 0Z',needle:'m3 21 15-15m-3 0 3-4 4 4-4 3M3 4l16 16m-2-2 3-1 2 4-4-2',
 folder:'M3 6h7l2 2h9v12H3z',eye:'M2 12c5-8 15-8 20 0-5 8-15 8-20 0Zm13 0a3 3 0 1 1-6 0 3 3 0 1 1 6 0',
 undo:'m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14',fill:'m10 3 10 10-7 7a3 3 0 0 1-4 0l-7-7 10-10M3 12h15',
 erase:'m3 15 10-12 8 6-10 12H7Zm4-5 9 7M11 21h10',mirror:'M12 2v20M8 6 2 18h6Zm8 0 6 12h-6Z',
 swatch:'M4 4h16v16H4zM8 8l2 3 2-3m1 4 2 3 2-3',dots:'M5 12h.1M12 12h.1M19 12h.1',
 copy:'M8 8h12v13H8zM4 16H3V3h12v2',print:'M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6Z'
};
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
export function icon(name){return '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="'+(paths[name]||'')+'"/></svg>';}
export function button(label,act,cls='button frame',value='',symbol=''){
  return '<button type="button" class="'+cls+'" data-act="'+act+'" data-value="'+esc(value)+'">'+(symbol?icon(symbol):'')+esc(label)+'</button>';
}
export const choice=(label,act,value,active)=>'<button type="button" class="choice'+(active?' chosen':'')+'" data-act="'+act+'" data-value="'+esc(value)+'" aria-pressed="'+!!active+'">'+esc(label)+'</button>';
export function field(label,id,value,min,max,unit='',step='.1'){
  return '<label class="field" for="'+id+'"><span>'+esc(label)+'</span><span class="input-unit"><input id="'+id+'" name="'+id+'" required inputmode="decimal" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(value)+'">'+(unit?'<span>'+esc(unit)+'</span>':'')+'</span></label>';
}
export function select(label,id,options,value){
  return '<label class="field" for="'+id+'"><span>'+esc(label)+'</span><select name="'+id+'" id="'+id+'">'+Object.entries(options).map(([v,n])=>'<option value="'+esc(v)+'"'+(v===String(value)?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label>';
}
export const letter=i=>String.fromCharCode(65+i);
export const dot=color=>'<i class="wool-dot" style="--wool:'+esc(color)+'" aria-hidden="true"></i>';
export function yarnChips(p,action='ink'){
  return p.yarns.map((y,i)=>'<button type="button" class="yarn-chip'+(i===p.selected?' chosen':'')+'" data-act="'+action+'" data-value="'+i+'" aria-pressed="'+(i===p.selected)+'">'+dot(y.color)+'<b>'+letter(i)+'</b> '+esc(y.name)+'</button>').join('');
}
export function rangeText(low,high,noun='pelote'){return (low===high?low:low+' à '+high)+' '+noun+(high>1?'s':'');}
export function meterLabel(meters){
  if(meters>0&&meters<.1)return 'moins de 0,1 m';
  return numberFr(meters,meters<10?1:0)+' m';
}
export function drawGrid(canvas,p,{symbols=false,row=0,cursor=null}={}){
  const width=canvas.width||900,margin=Math.max(25,Math.round(width*.045));
  const ratio=Math.min(1.1,Math.max(.65,p.gauge.stitches/p.gauge.rows));
  const cw=Math.min((width-margin-6)/p.cols,3800/(p.rows*ratio)),ch=cw*ratio;
  const H=Math.ceil(ch*p.rows+margin+4);if(canvas.height!==H)canvas.height=H;
  const ctx=canvas.getContext('2d'),x0=(width-margin-cw*p.cols)/2,y0=3;
  ctx.fillStyle='#fbfaf6';ctx.fillRect(0,0,width,H);ctx.textAlign='center';ctx.textBaseline='middle';
  for(let y=0;y<p.rows;y++)for(let x=0;x<p.cols;x++){
    const color=p.yarns[p.grid[y][x]].color;
    ctx.fillStyle=color;ctx.fillRect(x0+x*cw,y0+y*ch,cw+.5,ch+.5);
    if(row&&p.rows-y!==row){ctx.fillStyle='rgba(255,252,242,.66)';ctx.fillRect(x0+x*cw,y0+y*ch,cw+.5,ch+.5);}
    if(symbols){
      const raw=parseInt(color.slice(1),16),lum=.299*(raw>>16)+.587*((raw>>8)&255)+.114*(raw&255);
      ctx.fillStyle=row&&p.rows-y!==row?'#6e7267':lum>146?'#203127':'#ffffff';ctx.font='600 '+Math.max(6,Math.min(cw*.47,ch*.56))+'px Arial';
      ctx.fillText(letter(p.grid[y][x]),x0+(x+.5)*cw,y0+(y+.51)*ch);
    }
  }
  for(let x=0;x<=p.cols;x++){ctx.strokeStyle=x%5===0?'#293c325d':'#ffffff66';ctx.lineWidth=x%5===0?1.7:1;ctx.beginPath();ctx.moveTo(x0+x*cw,y0);ctx.lineTo(x0+x*cw,y0+p.rows*ch);ctx.stroke();}
  for(let y=0;y<=p.rows;y++){ctx.strokeStyle=(p.rows-y)%5===0?'#293c325d':'#ffffff66';ctx.lineWidth=(p.rows-y)%5===0?1.7:1;ctx.beginPath();ctx.moveTo(x0,y0+y*ch);ctx.lineTo(x0+p.cols*cw,y0+y*ch);ctx.stroke();}
  ctx.fillStyle='#546253';ctx.font=Math.max(10,Math.min(21,ch*.7))+'px Arial';
  for(let y=0;y<p.rows;y++)if((p.rows-y)%5===0||y===p.rows-1||y===0)ctx.fillText(p.rows-y,x0+cw*p.cols+margin*.52,y0+(y+.5)*ch);
  for(let x=0;x<p.cols;x++)if((p.cols-x)%5===0||x===p.cols-1||x===0)ctx.fillText(p.cols-x,x0+(x+.5)*cw,y0+p.rows*ch+margin*.48);
  ctx.strokeStyle='#ab4927';ctx.lineWidth=Math.max(3,width/200);
  if(row)ctx.strokeRect(x0,y0+(p.rows-row)*ch,p.cols*cw,ch);
  if(cursor)ctx.strokeRect(x0+cursor.x*cw+1,y0+cursor.y*ch+1,cw-2,ch-2);
  return {x0,y0,cw,ch};
}
export function budgetTable(budget){
  return '<div class="budget-list">'+budget.entries.map(e=>'<div class="budget-yarn">'+dot(e.yarn.color)+'<div><b>'+esc(e.yarn.name)+'</b><small>'+numberFr(e.yarn.meters)+' m / '+numberFr(e.yarn.grams)+' g · env. '+meterLabel(e.meters)+'</small>'+(e.meters>0&&e.meters<8?'<small>Une fin de pelote peut convenir.</small>':'')+'</div><div><strong>'+rangeText(e.low,e.high)+'</strong>'+(e.yarn.stock?'<small>'+e.yarn.stock+' en stock · '+e.toBuy+' à acheter</small>':'')+'</div></div>').join('')+'</div>';
}
