export const THEMES={
 points:{label:'Points',engines:['points']},
 curseurs:{label:'Curseurs',engines:['curseurs']}
};
export const normalizeTheme=(value,registry=THEMES)=>Object.hasOwn(registry,value)?value:'curseurs';
export function engineNames(theme,registry=THEMES){
 const entry=registry[normalizeTheme(theme,registry)];
 return [...new Set(entry.mix?Object.values(registry).filter(t=>t.mixable).flatMap(t=>t.engines):entry.engines)];
}

/** Each engine owns its animation, listeners and temporary DOM, and returns stop(). */
export function createThemeManager({load,apply,report=()=>{},registry=THEMES}){
 let version=0,active=[],current=null;
 const stop=()=>{for(const engine of active.splice(0).reverse())engine.stop();};
 return {
  get current(){return current;},
  async select(requested,options={}){
   const theme=normalizeTheme(requested,registry),ticket=++version;
   stop();current=theme;apply(theme);report({theme,status:'loading'});
   try{
    const modules=await Promise.all(engineNames(theme,registry).map(name=>load(name,options)));
    if(ticket!==version)return false;
    for(const module of modules){const instance=module.start({...options,mode:theme});if(ticket!==version){instance.stop();return false;}active.push(instance);}
    report({theme,status:'ready'});return true;
   }catch(error){
    if(ticket!==version)return false;
    stop();current=null;apply('curseurs');report({theme,status:'error',error});return false;
   }
  },
  stop(){version++;stop();current=null;}
 };
}

/** Local, infrequent distortions; no full-screen flashes or rapid strobing. */
export function glitchEnvelope(time,seed=0){
 const cycle=((time+seed*2.4)%7.4+7.4)%7.4;
 const burst=cycle<.32?Math.sin(cycle/.32*Math.PI):0;
 return {burst,mix:.48+.16*Math.sin(time*.8+seed*2),x:burst*Math.sin(time*23+seed)*2.4,y:burst*Math.cos(time*19+seed)*1.4};
}
