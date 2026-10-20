                                                   
                                                                         
                                                          
export const LEVELS = [
 {name:'Premiers doutes',size:5,seed:147},
 {name:'Double jeu',size:6,seed:281},
 {name:'Faux-semblants',size:7,seed:459},
 {name:'Le grand détour',size:8,seed:617},
 {name:'L’esprit du labyrinthe',size:9,seed:853}
];
export const DIRS = [{name:'haut',dx:0,dy:-1,arrow:'↑'},{name:'droite',dx:1,dy:0,arrow:'→'},{name:'bas',dx:0,dy:1,arrow:'↓'},{name:'gauche',dx:-1,dy:0,arrow:'←'}];
export function target(maze     ,pos       ,dir       )        {
 const d=DIRS[dir],x=pos%maze.size+d.dx,y=Math.floor(pos/maze.size)+d.dy;
 return x<0||y<0||x>=maze.size||y>=maze.size?-1:y*maze.size+x;
}
export function step(maze     ,f      ,to       )            {
 if(to<0||to>=maze.size**2||Math.abs(to%maze.size-f.pos%maze.size)+Math.abs(Math.floor(to/maze.size)-Math.floor(f.pos/maze.size))!==1)return null;
 const e=maze.edges.find(e=>(e.a===f.pos&&e.b===to)||(e.b===f.pos&&e.a===to));
 if(!e||(e.gate>=0&&e.gate!==f.phase))return null;
 const i=maze.shards.indexOf(to);
 return {pos:to,phase:1-f.phase,mask:i<0?f.mask:f.mask|(1<<i)};
}
export function solve(maze     ,start      )               {
 const key=(f      )=>`${f.pos},${f.phase},${f.mask}`;
 const queue=[start],seen=new Set([key(start)]),parents=new Map                               ();
 let found                ;
 for(let i=0;i<queue.length;i++){
  const f=queue[i];if(f.pos===maze.end&&f.mask===7){found=f;break;}
  for(let d=0;d<4;d++){const next=step(maze,f,target(maze,f.pos,d));if(next&&!seen.has(key(next))){seen.add(key(next));parents.set(key(next),{key:key(f),to:next.pos});queue.push(next);}}
 }
 if(!found)return null;const path         =[];let k=key(found);
 while(k!==key(start)){const p=parents.get(k) ;path.push(p.to);k=p.key;}return path.reverse();
}
export function makeMaze(level       )      {
 const config=LEVELS[level];if(!config)throw new Error('Niveau inconnu');
 let seed=config.seed;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const size=config.size,end=size*size-1;
 const edges       =[],visited=new Set([0]),stack=[0];
 while(stack.length){const a=stack[stack.length-1],opts         =[];
  for(const d of DIRS){const x=a%size+d.dx,y=Math.floor(a/size)+d.dy,b=y*size+x;if(x>=0&&x<size&&y>=0&&y<size&&!visited.has(b))opts.push(b);}
  if(!opts.length){stack.pop();continue;}const b=opts[Math.floor(rand()*opts.length)];edges.push({a,b,gate:-1});visited.add(b);stack.push(b);
 }
 const shards=[size-1,size*(size-1),Math.floor(size/2)*size+Math.floor(size/2)];
 const maze={size,edges,shards,end};
 // A door is retained only if the entire objective remains reachable.
 for(const e of edges){if(rand()<0.44){e.gate=Math.floor(rand()*2);if(!solve(maze,{pos:0,phase:0,mask:0}))e.gate=-1;}}
 for(let a=0;a<size*size;a++)for(const b of [a%size<size-1?a+1:-1,a+size<size*size?a+size:-1]){
  if(b>=0&&!edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))&&rand()<0.26)edges.push({a,b,gate:Math.floor(rand()*2)});
 }
 return maze;
}
export const initial=()      =>({pos:0,phase:0,mask:0});
export const isWon=(maze     ,f      )=>f.pos===maze.end&&f.mask===7;
                                                                                                
export function fresh()         {return {version:1,level:0,history:[initial()],best:LEVELS.map(()=>null),hints:0};}
export function decode(raw       )         {
 const p=JSON.parse(raw);
 if(p?.version!==1||!Number.isInteger(p.level)||p.level<0||p.level>=LEVELS.length||!Array.isArray(p.history)||!p.history.length||p.history.length>20000||!Array.isArray(p.best)||p.best.length!==5||p.best.some((n        )=>n!==null&&(!Number.isInteger(n)||Number(n)<1))||!Number.isInteger(p.hints)||p.hints<0)throw new Error('Sauvegarde invalide');
 const maze=makeMaze(p.level);let last=initial();
 if(JSON.stringify(p.history[0])!==JSON.stringify(last))throw new Error('Départ invalide');
 for(const f of p.history.slice(1)){const expected=step(maze,last,f.pos);if(isWon(maze,last)||!expected||f.phase!==expected.phase||f.mask!==expected.mask)throw new Error('Parcours invalide');last=expected;}
 return p;
}
