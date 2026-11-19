// Retarget the Verlet joints in avatar-local metres onto the existing knitted figure.
// Every override is restored before the next ordinary walk, wave or landing pose.
import * as THREE from './three.js';

const down=new THREE.Vector3(0,-1,0);
function frame(up,right){
  up.normalize();
  const forward=new THREE.Vector3().crossVectors(up,right).normalize();
  if(forward.lengthSq()<.1)forward.set(1,0,0);
  right.crossVectors(forward,up).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(forward,up,right));
}
export function createRagdollRig(bone){
  const joints=['core','head','armL','armR','elbowL','elbowR','legL','legR','kneeL','kneeR'];
  const saves=joints.map(k=>({node:bone[k],p:new THREE.Vector3(),q:new THREE.Quaternion(),s:new THREE.Vector3()}));
  let active=false;
  function restore(){
    if(!active)return;
    for(const v of saves){v.node.position.copy(v.p);v.node.quaternion.copy(v.q);v.node.scale.copy(v.s);}
    active=false;
  }
  function apply(rag){
    const blend=Math.min(1,Math.max(0,rag?.blend??1));
    if(!rag?.head||!blend)return;
    for(const v of saves){v.p.copy(v.node.position);v.q.copy(v.node.quaternion);v.s.copy(v.node.scale);}
    active=true;
    const point=name=>new THREE.Vector3().fromArray(rag[name]);
    const hips=point('hips'),chest=point('chest'),head=point('head');
    const right=point('rightShoulder').sub(point('leftShoulder'));
    const corePos=hips.clone().lerp(chest,.53);
    const coreQ=frame(chest.clone().sub(hips),right.clone()),inverse=coreQ.clone().invert();
    const local=p=>p.clone().sub(corePos).applyQuaternion(inverse);
    bone.core.position.lerp(corePos,blend);bone.core.quaternion.slerp(coreQ,blend);
    const headUp=head.clone().sub(chest).normalize();
    const headQ=frame(headUp.clone(),right.clone());
    bone.head.position.lerp(local(head.clone().addScaledVector(headUp,-.124)),blend);
    bone.head.quaternion.slerp(inverse.clone().multiply(headQ),blend);
    function chain(upper,lower,start,mid,end){
      start=local(start);mid=local(mid);end=local(end);
      const axis=mid.clone().sub(start);
      const q=new THREE.Quaternion().setFromUnitVectors(down,axis.clone().normalize());
      const inv=q.clone().invert(),lowerAxis=end.clone().sub(mid).applyQuaternion(inv).normalize();
      upper.position.lerp(start,blend);upper.quaternion.slerp(q,blend);upper.scale.y+=(1-upper.scale.y)*blend;
      lower.position.lerp(axis.applyQuaternion(inv),blend);
      lower.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(down,lowerAxis),blend);
    }
    for(const [side,suffix] of [['left','L'],['right','R']]){
      chain(bone['arm'+suffix],bone['elbow'+suffix],point(side+'Shoulder'),point(side+'Elbow'),point(side+'Hand'));
      chain(bone['leg'+suffix],bone['knee'+suffix],point(side+'Hip'),point(side+'Knee'),point(side+'Foot'));
    }
  }
  return {restore,apply};
}
