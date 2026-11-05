import('./views.js').catch(()=>{
 const main=document.querySelector('#map-main');
 const message=document.createElement('p');message.className='surface';message.setAttribute('role','alert');message.textContent='Les vues n’ont pas pu être chargées. Actualise la page pour réessayer.';main.prepend(message);
});
