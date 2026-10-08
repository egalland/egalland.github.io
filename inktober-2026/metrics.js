window.inktoberMetrics = {
 calculate(records,settings){
  const known=value=>Number.isInteger(value)&&value>=0;
  const price=(minutes,rate)=>known(minutes)&&known(rate)?Math.round(minutes*rate/60):null;
  const vibe=row=>known(row.vibeMinutes)?row.vibeMinutes:known(row.promptMinutes)&&known(row.chatgptMinutes)?row.promptMinutes+row.chatgptMinutes:null;
  const rows=records.filter(row=>row.done===true||row.done===1).sort((a,b)=>a.day-b.day).map(row=>({
   ...row,
   vibeMinutes:vibe(row),
   vibeCostCents:price(vibe(row),settings.vibeRateCents),
   devCostCents:price(row.devMinutes,settings.devRateCents),
  }));
  const total=field=>{const filled=rows.filter(row=>known(row[field]));return {value:filled.length?filled.reduce((sum,row)=>sum+row[field],0):null,count:filled.length};};
  return {doneCount:rows.length,rows,prompt:total('promptMinutes'),chatgpt:total('chatgptMinutes'),dev:total('devMinutes'),vibeTime:total('vibeMinutes'),vibeMin:total('vibeMinMinutes'),vibeMax:total('vibeMaxMinutes'),devMin:total('devMinMinutes'),devMax:total('devMaxMinutes'),vibeCost:total('vibeCostCents'),devCost:total('devCostCents')};
 }
};
