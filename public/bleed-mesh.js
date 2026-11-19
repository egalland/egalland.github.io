import * as THREE from './three.js';

// Overlapping, rounded pieces give each strand a twisted silhouette. All nearby
// wounds, falling stitches and ground marks share one draw call and depth buffer.
export function createBleedMesh(scene){
  const capacity=640,geometry=new THREE.SphereGeometry(.5,7,5);
  const material=new THREE.MeshBasicMaterial({toneMapped:false});
  const mesh=new THREE.InstancedMesh(geometry,material,capacity);
  mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  const frame=new THREE.Object3D(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  const colors=new Map();let n=0;
  function draw(strands){
    if(!strands)return;
    for(const {points,width,color} of strands){
      if(!colors.has(color))colors.set(color,new THREE.Color(color));
      for(let i=1;i<points.length&&n<capacity;i++){
        const a=points[i-1],b=points[i];
        direction.set(b.x-a.x,b.h-a.h,b.y-a.y);
        const length=direction.length();if(length<=.0001)continue;
        frame.position.set((a.x+b.x)/2,(a.h+b.h)/2,(a.y+b.y)/2);
        frame.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/length));
        frame.scale.set(width,length+width*.63,width);frame.updateMatrix();
        mesh.setMatrixAt(n,frame.matrix);mesh.setColorAt(n++,colors.get(color));
      }
    }
  }
  return {begin(){n=0;},draw,finish(){mesh.count=n;if(n){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}},
    dispose(){scene.remove(mesh);mesh.dispose();geometry.dispose();material.dispose();}};
}
