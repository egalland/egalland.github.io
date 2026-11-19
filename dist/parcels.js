// A transparent game tariff, not a live carrier quote. Padding = 20 mm per side.
export function quoteParcel(order,{pickup=order.channel==='local'}={}){
 const dims=order.dimensions||[120,90,70],qty=Math.max(1,order.qty||1),cols=Math.ceil(Math.sqrt(qty)),rows=Math.ceil(qty/cols),size=[dims[0]*cols+40,dims[1]*rows+40,dims[2]+40].sort((a,b)=>b-a),weight=(order.partGrams??order.recipe?.part??order.grams)/1000+.12+qty*.035;
 const tiers=[['S',300,2,4.9,1.2],['M',600,5,7.9,2.2],['L',1000,10,12.9,4.5],['XL',1500,20,22.9,8.5]],tier=tiers.find(t=>size[0]<=t[1]&&weight<=t[2]&&size[0]+2*(size[1]+size[2])<=3000);
 if(!tier)return {tier:'Hors gabarit',dimensions:size,weight,postage:0,packaging:8.5,charge:0,pickup:true,pickupOnly:true};
 return {tier:tier[0],dimensions:size,weight,postage:pickup?0:tier[3],packaging:tier[4],charge:pickup?0:Math.round((tier[3]+tier[4]*.8)*100)/100,pickup,pickupOnly:false};
}
export const parcelFor=o=>o.parcel||{tier:'S',dimensions:[160,130,110],weight:(o.grams||0)/1000+.15,postage:o.channel==='local'?0:4.9,packaging:1.2,charge:o.shipping||0,pickup:o.channel==='local',pickupOnly:false};
