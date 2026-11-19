export function chartWindow(days,compact,offset=0){
 const pages=compact?Math.max(1,Math.ceil(days.length/7)):1;
 const page=Math.min(Math.max(0,offset),pages-1);
 const end=compact?days.length-page*7:days.length;
 return {days:compact?days.slice(Math.max(0,end-7),end):days,page,pages};
}
