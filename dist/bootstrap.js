/* The sudoku starts independently of the WebGL module download/initialisation. */
(()=>{let p=window.WorldPending={theme:'spring',state:null,selected:-1,paused:true,motion:matchMedia('(prefers-reduced-motion: reduce)').matches};window.World={theme(t){p.theme=t},update(s,i){p.state=s;p.selected=i},pause(v){p.paused=v},motion(v){p.motion=v},event(){},reset(){p.state=null},refresh(){}};
window.addEventListener('error',e=>{if(e.target?.tagName==='SCRIPT'&&e.target.src?.includes('world.js'))document.getElementById('worldStatus').textContent='Le décor 3D n’a pas pu charger. La grille reste jouable.'},true);
})();
