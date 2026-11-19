// Measurements are local world metres. The exposed lining and dyed outer yarn
// follow the same prop palette in the mesh, sprite and flying strands.
const profiles = {
  crate:   {height:.80, pivot:.18, seam:.51, radius:.45, lean:.18, drop:.23, yarn:['#e5c397','#aa886b','#816653']},
  bench:   {height:1.17, pivot:.42, seam:.99, radius:.85, lean:.28, drop:.21, yarn:['#e6c397','#9c705a','#624d4c']},
  tree:    {height:6.86, pivot:1.13, seam:1.16, radius:.23, lean:.13, drop:.13, yarn:['#cdb693','#7f6557','#7e9f80']},
  lamp:    {height:5.15, pivot:1.03, seam:1.11, radius:.13, lean:.19, drop:.06, yarn:['#bdc2ad','#526566','#ca9972']},
  bollard: {height:.88, pivot:.16, seam:.43, radius:.13, lean:.37, drop:.18, yarn:['#d5c6aa','#57666b','#a59088']},
  hydrant: {height:.94, pivot:.19, seam:.59, radius:.21, lean:.26, drop:.20, yarn:['#dfb298','#ad5c67','#795653']},
  bin:     {height:.97, pivot:.15, seam:.62, radius:.33, lean:.21, drop:.20, yarn:['#cad6ae','#65857a','#405c5b']},
  postbox: {height:1.39, pivot:.56, seam:1.02, radius:.30, lean:.35, drop:.18, yarn:['#e8d4a1','#b7925e','#756954']}
};
export const propWearProfile = type => Object.hasOwn(profiles,type)?profiles[type]:null;

export function propWearStage(record){
  if(!record || !(record.maxHealth>0) || !Number.isFinite(record.health) || record.health>=record.maxHealth)return 0;
  return record.health>record.maxHealth*.45?1:2;
}

// A hit elsewhere in the shared city, or another hit within the current wear
// stage, shouldn't force a stationary phone to repaint its cached street.
export function trackPropWear(){
  let priorRevision,priorStages=new Map();
  return (props,health,revision=0)=>{
    if(revision===priorRevision)return false;
    priorRevision=revision;
    const stages=new Map();
    if(health?.size)for(const {id} of props){
      const record=health.get(id),stage=record?.health===0?3:propWearStage(record);
      if(stage)stages.set(id,stage);
    }
    const changed=stages.size!==priorStages.size || [...stages].some(([id,stage])=>priorStages.get(id)!==stage);
    priorStages=stages;
    return changed;
  };
}

export function propDebris(kind,type,angle=0){
  if(kind!=='propBreak' && kind!=='propHit')return null;
  const profile=propWearProfile(type);
  if(!profile)return null;
  const broken=kind==='propBreak',count=broken?9:4,strands=[];
  const height=Math.min(profile.seam,1.4);
  for(let i=0;i<count;i++){
    const heading=angle+(broken?i*2.4:Math.sin(i*2.4)*1.3),c=Math.cos(heading),s=Math.sin(heading);
    const speed=(broken?1.18:.51)*(1+.27*(i%3)),length=(broken?.24:.11)*(1+.23*(i%3));
    const bend=(i%2?-1:1)*length*.6;
    strands.push({
      color:profile.yarn[i%3],thickness:(broken?.027:.015)*(1+.19*(i%3)),
      points:[[.025*c,0,.025*s],[length*.65*c-s*bend,.06,length*.65*s+c*bend],[length*c,-.035,length*s]],
      velocity:[speed*c,(broken?1.65:.67)+.29*(i%4),speed*s]
    });
  }
  return {height,lifetime:broken?.86:.40,strands};
}
