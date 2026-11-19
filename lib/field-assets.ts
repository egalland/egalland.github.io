// Canvas, CSS sprites and the arrival screen share the same versioned files.
export type FieldAsset = {image:HTMLImageElement; ready:Promise<boolean>};
const files=new Map<string,FieldAsset>();
let revision=0;
export const artworkRevision=()=>revision;
export const artUrl=(name:string)=>'/art/'+name+'.webp';

export function requestArtwork(name:string):FieldAsset | undefined {
  if(typeof Image==='undefined')return;
  const cached=files.get(name);
  if(cached)return cached;
  const image=new Image();
  image.decoding='async';
  const ready=new Promise<boolean>(resolve=>{
    const finish=(ok:boolean)=>{revision++;resolve(ok);};
    image.onload=()=>finish(true);
    image.onerror=()=>finish(false);
  });
  const file={image,ready};
  files.set(name,file);
  image.src=artUrl(name);
  return file;
}
export function artwork(name:string):HTMLImageElement | undefined {
  const image=requestArtwork(name)?.image;
  return image?.complete&&image.naturalWidth?image:undefined;
}
