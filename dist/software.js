import * as THREE from './vendor/three.module.js';

// Depth-buffered rendering of the same UV-mapped meshes on devices without WebGL.
export class SoftwareRenderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images=new WeakMap();this.ratio=1;this.isSoftware=true;}
  setPixelRatio(value){this.ratio=Math.min(value,1.45);}
  setSize(w,h){
    const scale=Math.min(this.ratio,1000/Math.max(w,h));
    this.canvas.width=Math.max(1,Math.round(w*scale));this.canvas.height=Math.max(1,Math.round(h*scale));
    this.frame=this.ctx.createImageData(this.canvas.width,this.canvas.height);
    this.z=new Float32Array(this.canvas.width*this.canvas.height);
  }
  texture(mesh){
    const canvas=mesh.material.map?.image;if(!canvas)return null;
    let tex=this.images.get(canvas);
    if(!tex){try{const image=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);tex={data:image.data,w:canvas.width,h:canvas.height};this.images.set(canvas,tex);}catch{return null;}}
    return tex;
  }
  render(scene,camera){
    if(!this.frame)return;
    const W=this.canvas.width,H=this.canvas.height,out=this.frame.data,depth=this.z;
    out.fill(0);depth.fill(Infinity);
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const projection=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
    scene.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.visible)return;
      const geom=mesh.geometry,vertices=geom.attributes.position,normals=geom.attributes.normal,uvs=geom.attributes.uv;
      if(!vertices||!normals)return;
      const matrix=projection.clone().multiply(mesh.matrixWorld),nm=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
      const tex=this.texture(mesh),c=mesh.material.color.clone().convertLinearToSRGB(),fallback=[c.r*255,c.g*255,c.b*255];
      const points=[],vec=new THREE.Vector3(),n=new THREE.Vector3(),insideShade=mesh.userData.knit?.inside ? .68 : 1;
      for(let i=0;i<vertices.count;i++){
        vec.fromBufferAttribute(vertices,i).applyMatrix4(matrix);n.fromBufferAttribute(normals,i).applyMatrix3(nm).normalize();
        const light=Math.max(0,n.x*(-.46)+n.y*.66+n.z*.6);
        const rim=Math.max(0,n.x*.73+n.y*.45-n.z*.51);
        points.push({x:(vec.x+1)*W/2,y:(1-vec.y)*H/2,z:vec.z,u:uvs?.getX(i)||0,v:1-(uvs?.getY(i)||0),light:(.68+.38*light+.07*rim)*insideShade});
      }
      const idx=geom.index,limit=idx?idx.count:vertices.count;
      for(let t=0;t<limit;t+=3){
        const a=points[idx?idx.getX(t):t],b=points[idx?idx.getX(t+1):t+1],c=points[idx?idx.getX(t+2):t+2];
        const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
        if(Math.abs(den)<.0001)continue;
        const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(W-1,Math.ceil(Math.max(a.x,b.x,c.x)));
        const y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(H-1,Math.ceil(Math.max(a.y,b.y,c.y)));
        const inv=1/den,dx1=(b.y-c.y)*inv,dx2=(c.y-a.y)*inv;
        for(let y=y0;y<=y1;y++){
          let f=((b.y-c.y)*(x0+.5-c.x)+(c.x-b.x)*(y+.5-c.y))*inv;
          let g=((c.y-a.y)*(x0+.5-c.x)+(a.x-c.x)*(y+.5-c.y))*inv;
          for(let x=x0;x<=x1;x++,f+=dx1,g+=dx2){
            const h=1-f-g;if(f<-.00003||g<-.00003||h<-.00003)continue;
            const at=y*W+x,z=f*a.z+g*b.z+h*c.z;if(z>=depth[at])continue;depth[at]=z;
            const lighting=Math.min(1.15,f*a.light+g*b.light+h*c.light);
            let r=fallback[0],green=fallback[1],blue=fallback[2];
            if(tex){
              const u=Math.max(0,Math.min(1,f*a.u+g*b.u+h*c.u))*(tex.w-1);
              const v=Math.max(0,Math.min(1,f*a.v+g*b.v+h*c.v))*(tex.h-1);
              const tx=Math.floor(u),ty=Math.floor(v),fx=u-tx,fy=v-ty;
              const i0=(ty*tex.w+tx)*4,i1=(ty*tex.w+Math.min(tx+1,tex.w-1))*4;
              const j0=(Math.min(ty+1,tex.h-1)*tex.w+tx)*4,j1=j0+i1-i0;
              const p0=(1-fx)*(1-fy),p1=fx*(1-fy),p2=(1-fx)*fy,p3=fx*fy,d=tex.data;
              r=d[i0]*p0+d[i1]*p1+d[j0]*p2+d[j1]*p3;
              green=d[i0+1]*p0+d[i1+1]*p1+d[j0+1]*p2+d[j1+1]*p3;
              blue=d[i0+2]*p0+d[i1+2]*p1+d[j0+2]*p2+d[j1+2]*p3;
            }
            const pos=at*4;out[pos]=r*lighting;out[pos+1]=green*lighting;out[pos+2]=blue*lighting;out[pos+3]=255;
          }
        }
      }
    });this.ctx.putImageData(this.frame,0,0);
  }
}
