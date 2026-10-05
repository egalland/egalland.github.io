window.inktoberMetrics = {
 calculate(records,settings){
  const known=value=>Number.isInteger(value)&&value>=0;
  const price=(minutes,rate)=>known(minutes)&&known(rate)?Math.round(minutes*rate/60):null;
  const rows=records.filter(row=>row.done===true||row.done===1).sort((a,b)=>a.day-b.day).map(row=>({
   ...row,
   vibeMinutes:known(row.promptMinutes)&&known(row.chatgptMinutes)?row.promptMinutes+row.chatgptMinutes:null,
   vibeCostCents:known(row.promptMinutes)&&known(row.chatgptMinutes)?price(row.promptMinutes+row.chatgptMinutes,settings.vibeRateCents):null,
   devCostCents:price(row.devMinutes,settings.devRateCents),
  }));
  const total=field=>{const filled=rows.filter(row=>known(row[field]));return {value:filled.length?filled.reduce((sum,row)=>sum+row[field],0):null,count:filled.length};};
  return {doneCount:rows.length,rows,prompt:total('promptMinutes'),chatgpt:total('chatgptMinutes'),dev:total('devMinutes'),vibeTime:total('vibeMinutes'),vibeCost:total('vibeCostCents'),devCost:total('devCostCents')};
 }
};
