import * as T from './vendor/three.module.js';
/* A real scene object: framed volumetric tiles, glyph textures and grounded supports. */
export function createSudokuBoard(){
 const group=new T.Group(),supports=new T.Group(),tiles=[],owned=[],tileGeometry=new T.BoxGeometry(.986,.986,.10),labelGeometry=new T.PlaneGeometry(.92,.92),frameGeometry=new T.BoxGeometry(9.65,9.65,.36);
 group.name='Sudoku plateau 3D';group.userData.sudokuBoard=true;supports.name='Pieds du plateau';
 function mesh(geo,mat,parent,x=0,y=0,z=0){let m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const wood=new T.MeshStandardMaterial({color:'#bca98d',roughness:.7}),edge=new T.MeshStandardMaterial({color:'#718d7d',roughness:.75}),legMaterial=new T.MeshStandardMaterial({color:'#a2947d',roughness:.8});owned.push(wood,edge,legMaterial);
 mesh(frameGeometry,wood,group,0,0,-.16);
 const trimGeo=new T.BoxGeometry(9.2,.075,.065);for(let y of [-4.58,4.58])mesh(trimGeo,edge,group,0,y,.055);for(let x of [-4.58,4.58]){let m=mesh(trimGeo,edge,group,x,0,.055);m.rotation.z=Math.PI/2}
 for(let i=0;i<81;i++){let tile=new T.Group();tile.position.set(i%9-4,4-Math.floor(i/9),.025);tile.userData.interaction={id:'cell',index:i,label:'Ligne '+(Math.floor(i/9)+1)+' · colonne '+(i%9+1)};tile.userData.sudokuCell=i;
  let material=new T.MeshStandardMaterial({color:'#fffef4',roughness:.85});owned.push(material);let block=mesh(tileGeometry,material,tile);let c=document.createElement('canvas');c.width=c.height=128;let tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearFilter;tex.generateMipmaps=false;let ink=new T.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false});owned.push(ink);let text=mesh(labelGeometry,ink,tile,0,0,.057);text.castShadow=false;group.add(tile);tiles.push({group:tile,block,canvas:c,texture:tex,ink,key:'',pulse:null})}
 const separatorGeo=new T.BoxGeometry(9.02,.043,.022);for(let p of [-1.5,1.5]){mesh(separatorGeo,edge,group,0,p,.10);let m=mesh(separatorGeo,edge,group,p,0,.10);m.rotation.z=Math.PI/2}
 const footGeometry=new T.BoxGeometry(1,.09,.7),postGeometry=new T.CylinderGeometry(.075,.095,1,16),posts=[];
 for(let side of [-1,1]){let post=mesh(postGeometry,legMaterial,supports),foot=mesh(footGeometry,legMaterial,supports);posts.push({side,post,foot})}
 let current={values:Array(81).fill(0),puzzle:Array(81).fill(0),notes:Array.from({length:81},()=>[]),hinted:[]},selected=-1,theme='spring';
 function update(s,index,season){current=s;selected=index;theme=season;const autumn=theme==='autumn',winter=theme==='winter',ink=autumn?'#60483e':winter?'#3b596e':'#31554d';
  tiles.forEach((tile,i)=>{let r=Math.floor(i/9),c=i%9,sr=Math.floor(index/9),sc=index%9,value=s.values[i],given=!!s.puzzle[i],hint=s.hinted?.includes(i),peer=index>=0&&(r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3))),same=value&&index>=0&&value===s.values[index];
   let bg=peer?(autumn?'#f0e5d4':winter?'#e5f0f5':'#e9f0e5'):'#fffef7';if(same)bg=autumn?'#e9d4b2':winter?'#c8e0ec':'#d2e7d9';if(i===index)bg=autumn?'#e8bd88':winter?'#a2ccdf':'#a9d5be';tile.block.material.color.set(bg);
   let color=hint?'#a47a28':given?ink:autumn?'#a66d3f':winter?'#527d99':'#43876d',notes=(s.notes?.[i]||[]),key=[value,given,hint,notes.join(','),color].join('|');if(tile.key!==key){tile.key=key;let ctx=tile.canvas.getContext('2d');ctx.clearRect(0,0,128,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';if(value){ctx.font=(given?'700':'500')+' 78px Arial';ctx.fillText(value,64,69)}else{ctx.font='28px Arial';for(let n of notes)ctx.fillText(n,25+((n-1)%3)*39,26+Math.floor((n-1)/3)*39)}tile.texture.needsUpdate=true}
  })
 }
 function fit(camera,width,height,rect){let worldW=(camera.right-camera.left)*rect.width/width,worldH=(camera.top-camera.bottom)*rect.height/height,scale=Math.min(worldW,worldH)/9;group.scale.setScalar(scale);group.quaternion.copy(camera.quaternion);
  const projectedOrigin=new T.Vector3(0,0,0).project(camera);group.position.set((rect.left+rect.width/2)/width*2-1,1-(rect.top+rect.height/2)/height*2,projectedOrigin.z).unproject(camera);
  const up=new T.Vector3(0,1,0).applyQuaternion(group.quaternion),normal=new T.Vector3(0,0,1).applyQuaternion(group.quaternion),clearance=Math.abs(up.y)*scale*4.83+.32;
  if(group.position.y<clearance&&normal.y>.05)group.position.addScaledVector(normal,(clearance-group.position.y)/normal.y);
  group.updateMatrixWorld(true);posts.forEach(({side,post,foot})=>{let p=new T.Vector3(side*3.8,-4.83,-.15).applyMatrix4(group.matrixWorld),height=Math.max(.2,p.y);post.position.set(p.x,height/2,p.z);post.scale.set(scale*.9,height,scale*.9);foot.position.set(p.x,.045,p.z);foot.scale.setScalar(scale)});supports.updateMatrixWorld(true)
 }
 function cellWorld(i){return tiles[i]?.group.getWorldPosition(new T.Vector3())||group.position.clone()}
 function pulse(type,i,time){if(tiles[i])tiles[i].pulse={type,time}}
 function animate(time,reduced){for(let tile of tiles){if(!tile.pulse)continue;let age=time-tile.pulse.time;if(age>1||reduced){tile.group.position.z=.025;tile.group.position.x=tiles.indexOf(tile)%9-4;tile.group.scale.setScalar(1);tile.pulse=null;update(current,selected,theme);continue}let a=Math.sin(age*Math.PI),type=tile.pulse.type;if(type==='error'){tile.group.position.x=(tiles.indexOf(tile)%9-4)+Math.sin(age*35)*.045*a;tile.block.material.color.set('#e2a68d')}else{tile.group.position.z=.025+a*.13;if(type==='hint')tile.block.material.color.set('#f3d999')}}}
 function dispose(){for(let tile of tiles)tile.texture.dispose();for(let mat of owned)mat.dispose();for(let geo of [tileGeometry,labelGeometry,frameGeometry,trimGeo,separatorGeo,footGeometry,postGeometry])geo.dispose()}
 update(current,-1,'spring');return{group,supports,tiles,update,fit,pulse,animate,cellWorld,dispose};
}
