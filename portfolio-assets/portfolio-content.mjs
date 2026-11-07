import content from './content.mjs?v=editorial1';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500)}
$('#menu').addEventListener('click',()=>{const on=$('.nav').classList.toggle('mobile-open');$('#menu').setAttribute('aria-expanded',String(on));$('#menu').textContent=on?'×':'☰'});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{$('.nav').classList.remove('mobile-open');$('#menu').setAttribute('aria-expanded','false');$('#menu').textContent='☰'}));
const marketViews={
  jira:{label:'Activité des tickets',labels:['À faire','En cours','Terminés'],bars:[36,58,46,74,63,88]},
  simulations:{label:'Suivi des simulations',labels:['Préparation','Contrôle','Intégration'],bars:[78,54,65,43,80,69]},
  variations:{label:'Évolutions tarifaires',labels:['Fournisseurs','Périodes','Variations'],bars:[43,62,51,77,66,84]}
};
function selectMarketView(button){
  const view=marketViews[button.dataset.market];
  $$('[data-market]').forEach(b=>{const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
  $('#market-preview').setAttribute('aria-labelledby',button.id);
  $('#market-chart-label').textContent=view.label;
  ['one','two','three'].forEach((name,i)=>$('#market-label-'+name).firstChild.textContent=view.labels[i]);
  $$('.market-chart>span').forEach((bar,i)=>bar.style.setProperty('--bar',view.bars[i]+'%'));
}
$$('[data-market]').forEach((button,index)=>{
  button.addEventListener('click',()=>selectMarketView(button));
  button.addEventListener('keydown',event=>{
    const tabs=$$('[data-market]');let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();tabs[next].focus();selectMarketView(tabs[next])}
  });
});
const words=[{consonants:'C N M',answer:'cinema',display:'CINÉMA',clue:'Sur grand écran.'},{consonants:'T L S C P',answer:'telescope',display:'TÉLESCOPE',clue:'Pour regarder les étoiles.'},{consonants:'J R D N',answer:'jardin',display:'JARDIN',clue:'Les mains dans la terre.'}];
let wordIndex=0,wordSolved=false;
$('#word-form').addEventListener('submit',event=>{
  event.preventDefault();
  const answer=$('#word-answer').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  if(!answer){$('#word-feedback').textContent='Entre un mot pour jouer.';return}
  if(answer===words[wordIndex].answer){wordSolved=true;$('#word-feedback').textContent='Trouvé : '+words[wordIndex].display+' !';$('#word-feedback').classList.add('success');$('#word-next').hidden=false}
  else{$('#word-feedback').textContent='Pas encore. Regarde l’indice et réessaie.';$('#word-feedback').classList.remove('success')}
});
$('#word-next').addEventListener('click',()=>{
  wordIndex=(wordIndex+1)%words.length;wordSolved=false;
  $('#word-letters').textContent=words[wordIndex].consonants;$('#word-clue').textContent='Indice : '+words[wordIndex].clue;
  $('#word-answer').value='';$('#word-feedback').textContent='À toi de trouver.';$('#word-feedback').classList.remove('success');$('#word-next').hidden=true;
});
$('#copy-profile').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(content.profile.github);toast('Lien GitHub copié.')}catch{toast('Copie indisponible. Le lien GitHub est accessible juste à côté.')}});
const projectDetails=content.details;
const projectDialog=$('#project-dialog');
$$('[data-project]').forEach(button=>button.addEventListener('click',()=>{
  const detail=projectDetails[button.dataset.project];
  $('#project-dialog-category').textContent=detail.category;$('#project-dialog-title').textContent=detail.title;$('#project-dialog-description').textContent=detail.description;
  $('#project-dialog-features').replaceChildren(...detail.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
  const link=$('#project-dialog-link');link.hidden=!detail.url;if(detail.url)link.href=detail.url;else link.removeAttribute('href');
  projectDialog.showModal();
}));
$('.dialog-close').addEventListener('click',()=>projectDialog.close());
projectDialog.addEventListener('click',event=>{if(event.target===projectDialog){const r=projectDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)projectDialog.close()}});

addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.progress').style.width=(max>0?scrollY/max*100:0)+'%'},{passive:true});
