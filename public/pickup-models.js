import * as T from './three.js';
import {pickupStyle,pickupPatch,pickupMarkerWidth,pickupRange,pickupLift,pickupPhase} from './pickup-art.js';

export function createPickupDisplay(scene){
  const instances=new Map(),styles=new Map();
  const bobbin=new T.CylinderGeometry(.44,.44,.26,18),cap=new T.CylinderGeometry(.55,.55,.09,20);
  const ring=new T.RingGeometry(.70,.77,40);ring.rotateX(-Math.PI/2);
  const fine=new T.TorusGeometry(.446,.016,4,22);fine.rotateX(Math.PI/2);
  const wood=new T.MeshLambertMaterial({color:'#ae896f'});
  function palette(kind){
    if(styles.has(kind))return styles.get(kind);
    const {accent,thread,trim}=pickupStyle(kind),texture=new T.CanvasTexture(pickupPatch(kind));
    texture.colorSpace=T.SRGBColorSpace;
    const materials={
      cloth:new T.MeshLambertMaterial({color:thread}),
      accent:new T.MeshBasicMaterial({color:accent,toneMapped:false,side:T.DoubleSide}),
      stitch:new T.MeshLambertMaterial({color:trim}),
      artwork:new T.SpriteMaterial({map:texture,alphaTest:.12,transparent:false,toneMapped:false,depthTest:true,depthWrite:true}),
    };
    styles.set(kind,materials);return materials;
  }
  const mesh=(geometry,material,y)=>{const m=new T.Mesh(geometry,material);m.position.y=y;return m;};
  function create(kind){
    const materials=palette(kind),group=new T.Group();
    const base=mesh(ring,materials.accent,.11);
    group.add(base,mesh(cap,wood,.12),mesh(bobbin,materials.cloth,.28),mesh(cap,wood,.45));
    for(let n=0;n<4;n++)group.add(mesh(fine,n===0||n===3?materials.stitch:materials.accent,.19+n*.058));
    const sprite=new T.Sprite(materials.artwork);sprite.scale.set(pickupMarkerWidth,pickupMarkerWidth*.8,1);group.add(sprite);
    group.name='Équipement · '+kind;scene.add(group);
    return {kind,group,base,sprite};
  }
  function update(list,player,t){
    for(const item of instances.values())item.keep=false;
    for(const p of list||[]){
      if(!pickupStyle(p.weapon)||!Number.isFinite(p.x+p.y))continue;
      if((p.x-player.x)**2+(p.y-player.y)**2>pickupRange**2)continue;
      let item=instances.get(p.id);
      if(item&&item.kind!==p.weapon){item.group.removeFromParent();instances.delete(p.id);item=null;}
      if(!item){item=create(p.weapon);item.phase=pickupPhase(p.id);instances.set(p.id,item);}
      item.keep=true;item.group.position.set(p.x,0,p.y);
      const phase=t*2.36+item.phase,lift=pickupLift(t,item.phase);
      item.sprite.position.y=lift;
      const pulse=1+.065*Math.sin(phase);item.base.scale.set(pulse,1,pulse);
      item.sprite.scale.set(pickupMarkerWidth*(1+.017*Math.sin(phase)),pickupMarkerWidth*.8*(1-.016*Math.sin(phase)),1);
    }
    for(const [id,item] of instances)if(!item.keep){item.group.removeFromParent();instances.delete(id);}
  }
  return {update,dispose(){
    for(const item of instances.values())item.group.removeFromParent();
    for(const mats of styles.values()){mats.artwork.map.dispose();for(const m of Object.values(mats))m.dispose();}
    for(const geometry of [bobbin,cap,ring,fine])geometry.dispose();
    wood.dispose();instances.clear();styles.clear();
  }};
}
