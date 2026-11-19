import * as THREE from './vendor/three.module.js';
import {presence,canRunHumanTask} from './lifestyle.js';

export const BED={mattressTop:.595,pillowTop:.75,blanketY:.65,blanketNear:1.34,blanketFar:2.72,headLift:.25};
export const LIVING_ANCHORS={office:{x:5.86,y:.14,z:-1.40,rotation:Math.PI},bed:{x:5.98,y:.81,z:2.25,rotation:0},idle:{x:2.3,y:0,z:-1}};
// The duvet rests on the mattress when empty and drapes over the torso when occupied.
function duvetHeight(x,z,occupied){if(!occupied)return 0;const t=Math.max(0,Math.min(1,(z-BED.blanketNear)/(BED.blanketFar-BED.blanketNear))),fade=Math.max(0,Math.min(1,(t-.65)/.35)),longitudinal=1-fade*fade*(3-2*fade);return .43*Math.exp(-Math.pow(x/.56,4))*longitudinal;}
function makeDuvet(material){
 const g=new THREE.Group();g.name='Couette drapée';g.position.set(5.98,BED.blanketY,0);const pieces=[];
 function piece(width,height,depth,z,dy,color,segmentsZ){const geometry=new THREE.BoxGeometry(width,height,depth,16,1,segmentsZ),mesh=new THREE.Mesh(geometry,material(color,true));mesh.position.set(0,dy,z);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);pieces.push({mesh,rest:new Float32Array(geometry.attributes.position.array)});return mesh;}
 piece(1.51,.09,BED.blanketFar-BED.blanketNear,(BED.blanketNear+BED.blanketFar)/2,0,'#a4b3a3',20);piece(1.50,.055,.12,1.40,.055,'#c8d0b4',2);
 const seams=[];for(let i=0;i<10;i++){const x=-.62+i*.137,points=[];for(let j=0;j<=20;j++){const z=1.49+j*(2.65-1.49)/20;points.push(new THREE.Vector3(x,.052,z));}const geometry=new THREE.BufferGeometry().setFromPoints(points),line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#ccd5b9'}));g.add(line);seams.push(line);}
 g.userData.setOccupied=occupied=>{if(g.userData.occupied===occupied)return;g.userData.occupied=occupied;for(const {mesh,rest}of pieces){const attr=mesh.geometry.attributes.position;for(let i=0;i<attr.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];attr.setXYZ(i,x,y+duvetHeight(x,z+mesh.position.z,occupied),z);}attr.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}for(const line of seams){const attr=line.geometry.attributes.position;for(let i=0;i<attr.count;i++)attr.setY(i,.052+duvetHeight(attr.getX(i),attr.getZ(i),occupied));attr.needsUpdate=true;line.geometry.computeBoundingBox();line.geometry.computeBoundingSphere();}};
 g.userData.setOccupied(false);return g;
}
export function updateBed(living,occupied,time=0){const duvet=living.userData.blanket;duvet.userData.setOccupied(occupied);duvet.position.y=BED.blanketY+(occupied?Math.sin(time*.0012)*.003:0);}

export function actorActivity(s){const p=presence(s);if(p.kind==='sleep')return 'sleep';if(p.kind==='away'||p.kind==='remote'&&!canRunHumanTask(s))return 'office';if(p.kind==='rest')return 'office';return 'workshop';}

// Decorative rooms live outside the workshop's editable 8 × 6 grid.
// They neither add production capacity nor change equipment or expenses.
export function buildLivingSpace({box,cylinder,material,plant}){
 const g=new THREE.Group();g.name='Le bureau et la chambre';
 box(g,3.48,.19,6.42,5.98,-.14,0,'#b9ad94');
 for(let x=0;x<3;x++)for(let z=0;z<6;z++)box(g,1.10,.025,1.01,4.84+x*1.12,.025,-2.55+z*1.02,z<3?'#dcd7bc':'#d7ced0');
 // Soft low cutaway walls keep the machines and both rooms in sight.
 const back=new THREE.Group(),side=new THREE.Group();g.add(back,side);
 box(back,3.5,1.55,.10,5.98,.77,-3.17,'#b2c0aa');box(back,3.5,.06,.16,5.98,1.57,-3.17,'#e6d8bb');
 box(side,.10,1.45,6.35,7.74,.72,0,'#bdbaa6');box(side,.16,.06,6.38,7.74,1.48,0,'#e6d8bb');
 box(g,2.36,.65,.09,6.53,.325,.05,'#c5b6b5');box(g,2.42,.06,.15,6.53,.67,.05,'#e0cbb4');
 box(g,.16,.04,1.1,4.23,.027,.02,'#bb9974');
 // A separate salaried / telework desk, with a fabric chair and a real screen.
 const desk=new THREE.Group();desk.position.set(6.02,0,-2.13);g.add(desk);
 box(desk,1.91,.09,.84,0,.77,0,'#c69f7a');for(const x of [-.78,.78])for(const z of [-.29,.29])box(desk,.065,.74,.065,x,.37,z,'#76846b');
 box(desk,.68,.43,.038,-.15,1.14,-.12,'#4d6257');const screen=box(desk,.60,.34,.008,-.15,1.14,-.096,'#7ca89c',false);screen.material=new THREE.MeshStandardMaterial({color:'#7ca89c',emissive:'#527a6c',emissiveIntensity:.35,roughness:.8});
 for(let i=0;i<4;i++)box(desk,.29+(i%2)*.13,.012,.008,-.22,1.23-i*.055,-.088,'#d4dfbc',false);
 box(desk,.045,.22,.06,-.15,.92,-.12,'#536c5b');box(desk,.28,.022,.17,-.15,.815,-.10,'#8d9a82');box(desk,.47,.028,.14,-.13,.826,.20,'#e5dfc5');for(let i=0;i<6;i++)box(desk,.035,.003,.10,-.32+i*.068,.843,.20,'#c0c7ab');
 cylinder(desk,.065,.065,.12,.60,.87,.18,'#d9b48d',20);box(desk,.20,.034,.28,.58,.82,-.17,'#91a493');plant?.(desk,.72,.82,-.19,.27);
 const chair=new THREE.Group();chair.position.set(5.86,0,-1.40);g.add(chair);box(chair,.46,.09,.44,0,.49,0,'#95ac9b');box(chair,.46,.48,.075,0,.75,.22,'#95ac9b');cylinder(chair,.035,.035,.42,0,.25,0,'#77866c',12);for(let i=0;i<4;i++){const angle=i*Math.PI/2;box(chair,.045,.055,.50,Math.sin(angle)*.11,.07,Math.cos(angle)*.11,'#77866c').rotation.y=angle;}
 // The bedroom is open toward the camera. The blanket covers the sleeping body.
 box(g,1.57,.27,2.47,5.98,.28,1.55,'#b9967b');const mattress=box(g,1.49,.19,2.35,5.98,.50,1.55,'#e8dec7');box(g,1.68,.73,.11,5.98,.55,.34,'#ae8a75');
 const pillow=box(g,.90,.14,.43,5.98,.68,.91,'#eee3c9');pillow.rotation.y=-.05;
 const blanket=makeDuvet(material);g.add(blanket);
 for(const x of [5.34,6.62])for(const z of [.52,2.58])box(g,.10,.15,.10,x,.09,z,'#8d8069');
 box(g,.62,.51,.57,7.13,.27,.91,'#c0a17e');box(g,.66,.045,.60,7.13,.55,.91,'#d4b78d');cylinder(g,.13,.15,.035,7.13,.59,.91,'#9b9474',20);cylinder(g,.025,.025,.27,7.13,.73,.91,'#918866',12);cylinder(g,.17,.24,.28,7.13,.98,.91,'#efdab1',28);
 const lamp=new THREE.PointLight('#ffd9a0',1,4,2);lamp.position.set(7.10,1.06,.89);g.add(lamp);
 box(g,1.90,.018,.53,5.98,.049,2.91,'#b99fa5');for(let i=0;i<13;i++)box(g,.012,.003,.46,5.14+i*.14,.061,2.91,'#d7bec1');
 const frame=box(back,.80,.57,.025,6.94,1.10,-3.10,'#e8d9b9');box(back,.67,.44,.016,6.94,1.10,-3.08,'#91ad9f');cylinder(back,.11,.11,.018,6.94,1.14,-3.057,'#e6c48e',28).rotation.x=Math.PI/2;
 g.userData={back,side,screen,blanket,lamp,mattress,pillow,anchors:LIVING_ANCHORS};return g;
}
