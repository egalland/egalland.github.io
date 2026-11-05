(() => {
 // Historic root anchors still open the original cursor presentation.
 const legacy=new Set(['home','main','work','market-plus','kikalmo','maison','bodyos','atelier','about','contact']);
 if(legacy.has(location.hash.slice(1))){location.replace('/curseurs/'+location.search+location.hash);return;}
 try{const last=localStorage.getItem('portfolio-view');document.querySelector(`[data-view="${last==='points'?'points':'curseurs'}"]`)?.setAttribute('data-last-view',String(!!last));}catch{}
 document.querySelectorAll('[data-view]').forEach(a=>a.addEventListener('click',()=>{try{localStorage.setItem('portfolio-view',a.dataset.view)}catch{}}));
 const canvas=document.querySelector('#choice-particles'),ctx=canvas.getContext('2d'),mq=matchMedia('(prefers-reduced-motion: reduce)');
 let width=0,height=0,time=0,previous=0,raf=0,visible=true;
 const points=[];
 const segment=(a,b,n,color)=>{for(let i=0;i<n;i++)points.push({a,b,t:(i+.5)/n,color});};
 const rect=(x,y,w,h,n,color)=>{segment([x,y],[x+w,y],n,color);segment([x+w,y],[x+w,y+h],n*.6,color);segment([x+w,y+h],[x,y+h],n,color);segment([x,y+h],[x,y],n*.6,color);};
 rect(.13,.25,.74,.57,65,'#37685c');segment([.13,.37],[.87,.37],60,'#37685c');segment([.3,.37],[.3,.82],40,'#37685c');
 for(let i=0;i<3;i++){rect(.35+i*.16,.43,.13,.14,20,i===2?'#bc6443':'#378879');segment([.18,.44+i*.1],[.25,.44+i*.1],12,'#5d7c67');}
 const trend=[[.37,.72],[.43,.68],[.49,.7],[.56,.6],[.63,.64],[.7,.6],[.8,.59]];for(let i=1;i<trend.length;i++)segment(trend[i-1],trend[i],14,'#dd4633');
 function draw(stamp=0){raf=0;const dt=previous?Math.min((stamp-previous)/1000,.05):0;previous=stamp;if(!mq.matches)time+=dt;ctx.clearRect(0,0,width,height);for(let i=0;i<points.length;i++){const p=points[i],t=(p.t+time*.022)%1,x=(p.a[0]+(p.b[0]-p.a[0])*t)*width,y=(p.a[1]+(p.b[1]-p.a[1])*t)*height;ctx.fillStyle=p.color;const size=1.4+.3*Math.sin(time+i);ctx.fillRect(x,y,size,size);}if(!mq.matches&&!document.hidden&&visible)raf=requestAnimationFrame(draw);}
 function wake(){previous=0;if(!raf)raf=requestAnimationFrame(draw);}
 function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);wake();}
 new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0;}}).observe(canvas);
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden)wake();});mq.addEventListener('change',wake);resize();
})();
