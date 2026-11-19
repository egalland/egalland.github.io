const mod=(v,n)=>(v%n+n)%n;
export function patternSampler(p,knit){
  const {layout,u:centerU,v:centerV,scale,surface}=p.motif;
  const columns=Math.max(1,Math.round(knit.widthCm*p.gauge.stitches/10));
  const rows=Math.max(1,Math.round(knit.heightCm*p.gauge.rows/10));
  const fixed=Number.isInteger(knit.accent)?Math.min(p.yarns.length-1,knit.accent):0;
  const editable=knit.part!=='rib'&&knit.part!=='trim';
  const selectedSurface=knit.surface===surface;
  const canPattern=editable&&(layout==='repeat'||layout==='yoke'||selectedSurface);
  const blank=new Set(p.grid.flat()).size<2;
  function read(u,v){
    if(!canPattern)return {color:fixed,patterned:false};
    let relativeU=u-centerU;
    if(knit.circular)relativeU-=Math.round(relativeU);
    let anchor=centerV;
    if(layout==='yoke'){
      if(knit.part==='sleeve')anchor=Math.min(.97,centerV+.13);
      else anchor+=.085*(1-Math.cos((u-.5)*Math.PI*2));
    }
    const x=Math.floor(relativeU*columns/scale+p.cols/2);
    const y=Math.floor((anchor-v)*rows/scale+p.rows/2);
    const inBand=y>=0&&y<p.rows;
    if((layout==='single'&&(!inBand||x<0||x>=p.cols))||((layout==='band'||layout==='yoke')&&!inBand))return {color:fixed,patterned:false};
    return {color:p.grid[mod(y,p.rows)][mod(x,p.cols)],patterned:!blank};
  }
  return {read,columns,rows};
}
