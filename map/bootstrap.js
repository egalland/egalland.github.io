import('./app.js').catch(()=>{
 const status=document.querySelector('#render-status');
 status.textContent='La carte n’a pas pu être chargée. Réessaie dans quelques instants.';
 status.setAttribute('role','alert');
 const retry=document.querySelector('#load-retry');retry.hidden=false;retry.addEventListener('click',()=>location.reload());
});
