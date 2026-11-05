(() => {
 const toggle=document.querySelector('[data-view-switch]');if(!toggle)return;
 const points=location.pathname.startsWith('/points/');
 const cursorToPoint={home:'home',work:'market-plus',market:'market-plus','market-plus':'market-plus',kikalmo:'kikalmo',maison:'maison',bodyos:'bodyos',atelier:'livre',about:'about',contact:'contact',livre:'livre',redim:'redim',atlas:'atlas','four-en-route':'four-en-route','biscuit-du-jour':'biscuit-du-jour',inktober:'inktober'};
 let remembered='home';
 function anchor(){
  if(points)return document.querySelector('.chapter.current')?.dataset.cursor||remembered;
  const sections=[...document.querySelectorAll('#home,.project,#atelier,.lab-card,#about,#contact')];
  const visible=sections.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight*.24&&r.top<innerHeight*.7;});
  const hashed=document.getElementById(location.hash.slice(1));
  if(hashed?.matches('.project,.lab-card,#atelier,#about,#contact')&&visible.includes(hashed))return hashed.id;
  return visible.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-innerHeight*.28)-Math.abs(b.getBoundingClientRect().top-innerHeight*.28))[0]?.id||remembered;
 }
 function update(){const id=anchor();remembered=id;toggle.href=points?'/curseurs/#'+id:'/points/#'+(cursorToPoint[id]||'home');}
 toggle.addEventListener('pointerenter',update);toggle.addEventListener('focus',update);toggle.addEventListener('click',()=>{update();try{localStorage.setItem('portfolio-view',points?'curseurs':'points')}catch{}});
 let pending=false;addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;update()})}},{passive:true});
 addEventListener('hashchange',update);update();
})();
