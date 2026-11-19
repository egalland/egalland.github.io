export const numeric=n=>typeof n==='number'&&Number.isFinite(n);
export const pair=(r,a,b)=>numeric(r[a])&&numeric(r[b]);
export const sum=(rs,key)=>rs.reduce((s,r)=>s+(numeric(r[key])?r[key]:0),0);
export function bounds(rs,a,b){const known=rs.filter(r=>pair(r,a,b));return known.length?[sum(known,a),sum(known,b)]:[null,null];}
export function summarize(date,rows,publishedTotals=[]){
 const rs=rows.filter(r=>r.date===date),eligible=rs.filter(r=>!r.excludeFromDeliveredProjectCount),devRows=rs.filter(r=>!r.excludeFromDeveloperEquivalent);
 const known=eligible.filter(r=>pair(r,'vmin','vmax')),devKnown=devRows.filter(r=>pair(r,'dmin','dmax')),comparable=eligible.filter(r=>!r.excludeFromDeveloperEquivalent&&pair(r,'vmin','vmax')&&pair(r,'dmin','dmax'));
 const [vmin,vmax]=bounds(known,'vmin','vmax'),[dmin,dmax]=bounds(devKnown,'dmin','dmax');
 const official=publishedTotals.find(r=>r.date===date);
 const addedRows=rs.filter(r=>numeric(r.added)),deletedRows=rs.filter(r=>numeric(r.deleted));
 const added=numeric(official?.added)?official.added:addedRows.length?sum(addedRows,'added'):null;
 const deleted=numeric(official?.deleted)?official.deleted:deletedRows.length?sum(deletedRows,'deleted'):null;
 const codePartial=official&&numeric(official.added)&&numeric(official.deleted)?official.locComplete===false:rs.some(r=>r.addedMinimum||!numeric(r.added)||!numeric(r.deleted));
 const gapMin=comparable.length?sum(comparable,'dmin')*60-sum(comparable,'vmax'):null;
 const gapMax=comparable.length?sum(comparable,'dmax')*60-sum(comparable,'vmin'):null;
 return {date,rows:rs,known:known.length,scopeCount:eligible.length,devKnown:devKnown.length,devCount:devRows.length,vmin,vmax,dmin,dmax,
  vibePartial:known.length<eligible.length,devPartial:devKnown.length<devRows.length,comparableCount:comparable.length,gapMin,gapMax,
  gapEuroMin:comparable.length?sum(comparable,'dmin')*40-sum(comparable,'vmax')/60*35:null,
  gapEuroMax:comparable.length?sum(comparable,'dmax')*40-sum(comparable,'vmin')/60*35:null,
  added,deleted,codePartial,locApproximate:official?.locApproximate===true,net:!codePartial&&numeric(added)&&numeric(deleted)?added-deleted:null,
  historical:rs.length>0&&rs.every(r=>r.qualification==='historical'),aggregateOnly:rs.length>0&&rs.every(r=>r.rowKind==='historical_total'),official};
}
export const calendar=(start,end)=>{const out=[];for(let t=Date.parse(start+'T12:00:00Z');t<=Date.parse(end+'T12:00:00Z');t+=86400000)out.push(new Date(t).toISOString().slice(0,10));return out;};
