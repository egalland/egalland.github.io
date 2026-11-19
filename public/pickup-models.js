import {terrainHeight} from './terrain-height.js';
import * as T from './three.js';
import {pickupStyle,pickupPatch,pickupMarkerWidth,pickupRange,pickupLift,pickupPhase} from './pickup-art.js';

export function createPickupDisplay(scene){
  const instances=new Map(),styles=new Map();
  const bobbin=new T.CylinderGeometry(.44,.44,.26,18),cap=new T.CylinderGeometry(.55,.55,.09,20);
  const shadow=new T.CircleGeometry(.59,24);shadow.rotateX(-Math.PI/2);
  const shade=new T.MeshBasicMaterial({color:'#403e41',transparent:true,opacity:.22,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const spindle=new T.CylinderGeometry(.033,.046,1.13,7);
  const fine=new T.TorusGeometry(.446,.016,4,22);fine.rotateX(Math.PI/2);
  const wood=new T.MeshLambertMaterial({color:'#ae896f'});
  const toy={box:new T.BoxGeometry(1,1,1),ball:new T.SphereGeometry(1,10,7),loop:new T.TorusGeometry(1,.16,5,16),
    cylinder:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,10)};
  function palette(kind){
    if(styles.has(kind))return styles.get(kind);
    const {accent,thread,trim}=pickupStyle(kind),texture=new T.CanvasTexture(pickupPatch(kind));
    texture.colorSpace=T.SRGBColorSpace;
    const materials={
      cloth:new T.MeshLambertMaterial({color:thread}),
      accent:new T.MeshLambertMaterial({color:accent}),
      stitch:new T.MeshLambertMaterial({color:trim}),
      artwork:new T.SpriteMaterial({map:texture,alphaTest:.12,transparent:false,toneMapped:false,depthTest:true,depthWrite:true}),
    };
    styles.set(kind,materials);return materials;
  }
  const mesh=(geometry,material,y)=>{const m=new T.Mesh(geometry,material);m.position.y=y;return m;};
  function miniature(kind,m){
    const model=new T.Group();
    const part=(shape,mat,x,y,z,w,h,d,tilt=0)=>{
      const obj=new T.Mesh(toy[shape],mat);obj.position.set(x,y,z);obj.scale.set(w,h,d);obj.rotation.z=tilt;model.add(obj);
      return obj;
    };
    const bar=(x1,y1,x2,y2,width,mat)=>part('box',mat,(x1+x2)/2,(y1+y2)/2,0,Math.hypot(x2-x1,y2-y1),width,width,
      Math.atan2(y2-y1,x2-x1));
    const {accent,cloth,stitch}=m;
    if(kind==='smg'||kind==='shotgun'||kind==='pompom'||kind==='confetti'){
      bar(-.36,-.04,.24,.11,.13,cloth);bar(-.16,-.02,-.22,-.17,.095,wood);
      if(kind==='shotgun')bar(.05,.10,.50,.18,.072,stitch);
      if(kind==='smg'){bar(.12,.15,.43,.15,.085,stitch);bar(-.04,-.04,.025,-.19,.07,accent);}
      if(kind==='confetti')part('cone',accent,.26,.105,0,.17,.34,.17,Math.PI*.57);
      if(kind==='pompom'){part('loop',stitch,.23,.11,0,.15,.15,.15).rotation.y=Math.PI*.4;part('ball',accent,.40,.18,0,.115,.115,.115);}
    }else if(kind==='yarn'){
      part('ball',cloth,0,.02,0,.22,.22,.22);
      for(const a of [-.70,-.40,.65])part('loop',accent,0,.02,0,.196,.223,.18,a).rotation.y=a;
    }else if(kind==='ribbonbow'){
      const points=[[-.34,-.20],[-.29,.02],[-.12,.21],[.10,.29],[.36,.31]];
      for(let i=1;i<points.length;i++)bar(...points[i-1],...points[i],.064,wood);
      bar(-.33,-.19,.36,.31,.018,stitch);bar(-.17,.25,.22,-.15,.033,accent);
      part('cone',accent,.24,-.17,0,.079,.18,.061,-2.38);
    }else if(kind==='boomerang'){
      bar(-.37,-.12,.015,.18,.113,accent);bar(.015,.18,.32,-.14,.113,cloth);
      bar(-.056,.14,.04,.19,.14,wood);
    }else if(kind==='bubbles'){
      part('ball',accent,-.17,-.04,0,.16,.18,.105);part('cylinder',cloth,-.17,.13,0,.10,.08,.10);
      bar(.04,-.17,.18,.16,.045,stitch);part('loop',accent,.21,.18,0,.089,.12,.09,-.40);
      part('ball',stitch,.34,.25,0,.055,.055,.055);
    }else if(kind==='spool'){
      part('cylinder',cloth,0,.01,0,.16,.26,.16);
      for(const height of [-.13,.15])part('cylinder',wood,0,height,0,.235,.065,.235);
      for(const height of [-.072,0,.072])part('loop',accent,0,height,0,.15,.15,.15).rotation.x=Math.PI/2;
    }else if(kind==='star'){
      bar(-.13,-.19,-.07,.07,.085,wood);bar(-.07,.07,-.21,.225,.083,wood);bar(-.07,.07,.10,.22,.083,wood);
      bar(-.21,.225,.10,.22,.028,accent);part('ball',accent,.27,.17,0,.10,.10,.065);
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part('cone',stitch,.27+.087*Math.sin(a),.17+.087*Math.cos(a),0,.069,.15,.046,-a);}
    }else if(kind==='chime'){
      part('cone',accent,0,-.01,0,.236,.33,.236);part('cylinder',wood,0,-.15,0,.235,.044,.235);
      part('loop',stitch,0,.19,0,.075,.075,.065);part('ball',cloth,0,-.19,0,.054,.054,.054);
    }
    return model;
  }
  function create(kind){
    const materials=palette(kind),group=new T.Group();
    const base=mesh(shadow,shade,.065);
    group.add(base,mesh(cap,wood,.12),mesh(bobbin,materials.cloth,.28),mesh(cap,wood,.45),mesh(spindle,wood,.88));
    for(let n=0;n<4;n++)group.add(mesh(fine,n===0||n===3?materials.stitch:materials.accent,.19+n*.058));
    const model=miniature(kind,materials);model.scale.setScalar(.86);model.position.x=.29;group.add(model);
    const sprite=new T.Sprite(materials.artwork);sprite.scale.set(pickupMarkerWidth,pickupMarkerWidth*.8,1);group.add(sprite);
    group.name='Équipement · '+kind;scene.add(group);
    return {kind,group,sprite,model};
  }
  function update(list,player,t){
    for(const item of instances.values())item.keep=false;
    for(const p of list||[]){
      if(!pickupStyle(p.weapon)||!Number.isFinite(p.x+p.y))continue;
      if((p.x-player.x)**2+(p.y-player.y)**2>pickupRange**2)continue;
      let item=instances.get(p.id);
      if(item&&item.kind!==p.weapon){item.group.removeFromParent();instances.delete(p.id);item=null;}
      if(!item){item=create(p.weapon);item.phase=pickupPhase(p.id);instances.set(p.id,item);}
      item.keep=true;item.group.position.set(p.x,terrainHeight(p.x,p.y),p.y);
      const phase=t*2.36+item.phase,lift=pickupLift(t,item.phase);
      item.sprite.position.y=lift;
      item.model.position.y=.80+.055*Math.sin(phase);item.model.rotation.y=t*.81+item.phase;item.model.rotation.z=.07*Math.sin(phase*.7);

    }
    for(const [id,item] of instances)if(!item.keep){item.group.removeFromParent();instances.delete(id);}
  }
  return {update,dispose(){
    for(const item of instances.values())item.group.removeFromParent();
    for(const mats of styles.values()){mats.artwork.map.dispose();for(const m of Object.values(mats))m.dispose();}
    for(const geometry of [bobbin,cap,shadow,spindle,fine,...Object.values(toy)])geometry.dispose();
    wood.dispose();shade.dispose();instances.clear();styles.clear();
  }};
}
