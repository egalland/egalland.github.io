// Pages serves separate documents. Keep the public URL on /?theme=… in each one.
(() => {
 const view=document.currentScript.dataset.view;
 const url=new URL(location.href);
 if(view==='curseurs'){
  const requested=url.searchParams.get('theme');
  if(requested!=='chrome'&&requested!=='points')return;
  document.documentElement.dataset.routing=requested;
  document.documentElement.style.visibility='hidden';
  url.pathname='/'+requested+'/';
  location.replace(url.href);
 }else{
  url.pathname='/';
  url.searchParams.set('theme',view);
  history.replaceState(history.state,'',url.href);
 }
})();
