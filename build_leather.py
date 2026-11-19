"""Create geographically registered, dyed-leather map surfaces from atlas assets."""
import json, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy.ndimage import gaussian_filter, distance_transform_edt, map_coordinates

ROOT=pathlib.Path(__file__).parent
OUT=ROOT/'dist/assets'
GRAIN=Image.open(OUT/'leather-grain.webp').convert('L')
PALETTE=[(134,153,103),(177,133,79),(100,139,139),(154,112,117),(191,152,93),(110,139,108),(155,131,96)]

for age in (1,2,3):
 data=json.loads((OUT/f'map-{age}.json').read_text())
 natural=Image.open(OUT/f'terrain-{age}.webp').convert('RGB')
 W,H=natural.size; bounds=data['bounds']; rng=np.random.default_rng(190+age)
 def pos(c): return ((c[0]-bounds[0])/(bounds[2]-bounds[0])*W,(bounds[3]-c[1])/(bounds[3]-bounds[1])*H)
 def raw_features(layer):return [f for f in json.loads((ROOT/f'raw/{age}-{layer}.json').read_text())['features'] if f.get('geometry')]
 def layer_mask(layer):
  im=Image.new('L',(W,H));d=ImageDraw.Draw(im)
  for f in raw_features(layer):
   g=f['geometry'];polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
   for poly in polys:
    if not poly:continue
    d.polygon([pos(c) for c in poly[0]],fill=255)
    for ring in poly[1:]:d.polygon([pos(c) for c in ring],fill=0)
  return np.asarray(im,dtype=np.float32)/255
 land=layer_mask('poly_outline');forest=layer_mask('poly_forest');water=layer_mask('poly_lake');mount=layer_mask('poly_mountainlow')
 height=np.asarray(Image.open(OUT/f'height-{age}.png').convert('L').resize((W,H),Image.Resampling.BICUBIC),dtype=np.float32)/255*70
 sea_dist=distance_transform_edt(land<.5)
 # Leather is part of the map itself, registered to its geography and UVs.
 tile=np.asarray(ImageOps.autocontrast(GRAIN).resize((760,760)),dtype=np.float32)
 grain=np.tile(tile,(H//760+1,W//760+1))[:H,:W]
 grain=(grain-gaussian_filter(grain,6))/40
 yy,xx=np.mgrid[:H,:W]
 broad=gaussian_filter(rng.normal(size=(H,W)).astype(np.float32),24)
 broad/=max(broad.std(),.01)
 leather=grain*6.5 + np.clip(grain-np.roll(grain,1,axis=0),-2,2)*2.5 + broad*2.1
 # Smoothly warped joins avoid ruler-straight, rectangular color blocks.
 warp=[]
 for _ in range(2):
  small=Image.fromarray(np.uint8(rng.random((12,16))*255)).resize((W,H),Image.Resampling.BICUBIC)
  warp.append((np.asarray(small,dtype=np.float32)-127.5)*.65)
 colors=np.empty((H,W,3),dtype=np.float32);colors[:]=[118,147,108]
 ids=np.zeros((H,W),dtype=np.uint8)
 def patch(points,color,number,normalized=False):
  im=Image.new('L',(W,H));d=ImageDraw.Draw(im)
  pts=[(p[0]/1800*W,p[1]/data['height']*H) for p in points] if normalized else [pos(p) for p in points]
  d.polygon(pts,fill=255)
  field=gaussian_filter(np.asarray(im,dtype=np.float32)/255,10)
  alpha=map_coordinates(field,[yy+warp[0],xx+warp[1]],order=1,mode='nearest')*land
  valid=alpha>.5;colors[valid]=color;ids[valid]=number
 if age==3:
  # Broad geographical color fields, editorial rather than surveyed political boundaries.
  patch([[.0368,.01],[.07,.01],[.07,-.04],[.039,-.04],[.0375,-.015],[.0356,-.011]],(166,130,82),1)
  patch([[.01,.01],[.0285,.01],[.0285,-.009],[.0291,-.012],[.0285,-.016],[.01,-.02]],(81,131,121),2)
  patch([[.0325,-.0142],[.0352,-.0140],[.0388,-.0149],[.0400,-.0175],[.0358,-.0181],[.032,-.017]],(185,144,82),4)
  patch([[.01,-.0190],[.0290,-.0183],[.0337,-.0170],[.0360,-.0173],[.0397,-.0176],[.041,-.022],[.04,-.04],[.01,-.04]],(107,141,150),5)
  patch([[.0395,-.0160],[.0434,-.0158],[.047,-.0165],[.06,-.04],[.041,-.04],[.0404,-.0205],[.0394,-.0188]],(139,81,89),6)
  for r in data['regions']:
   if 'farthing' in r['id'].lower():patch(r['rings'][0],(164,163,103),3,True)
 else:
  for i,r in enumerate(data['regions']):
   if r['rings'] and len(r['rings'][0])>2:patch(r['rings'][0],PALETTE[i%len(PALETTE)],i+1,True)
 # Woods are dark embossed fields, retaining their original cartographic footprints.
 f=gaussian_filter(forest,2)[...,None]*.66
 colors=colors*(1-f)+np.array([62,104,83],np.float32)*f
 # Raised mountain chains in pale unpolished leather, with directional embossed shading.
 m=np.clip(gaussian_filter(mount,4)*.45+np.clip((height-18)/45,0,1)*.45,0,.83)[...,None]
 colors=colors*(1-m)+np.array([191,174,133],np.float32)*m
 dx=np.gradient(height,axis=1);dy=np.gradient(height,axis=0)
 emboss=np.clip(-dx*1.5-dy*2.1,-18,22)
 detail=np.asarray(natural.convert('L'),dtype=np.float32)
 detail=(detail-gaussian_filter(detail,5))*mount*.38
 contours=np.exp(-np.square(((height%3.1)-1.55)/.115))*mount*3.0
 colors+=(emboss+detail-contours+leather)[...,None]
 sea=np.empty_like(colors);sea[:]=[54,100,111]
 sea+=(leather*.85 + np.exp(-sea_dist/50)*7)[...,None]
 colors=colors*land[...,None]+sea*(1-land[...,None])
 colors=colors*(1-water[...,None])+np.array([58,113,124],np.float32)*water[...,None]
 # Recessed join with a lit lip, followed by a fine thread-like seam.
 signed=distance_transform_edt(land>.5)-sea_dist
 edge_dark=np.exp(-((signed+1)/2.3)**2)*15
 edge_light=np.exp(-((signed-3)/2.0)**2)*21
 colors+=(edge_light-edge_dark)[...,None]
 seam=np.zeros((H,W),dtype=bool)
 seam[:,1:]|=ids[:,1:]!=ids[:,:-1];seam[1:,:]|=ids[1:,:]!=ids[:-1,:]
 seam&=land>.5
 dist=distance_transform_edt(~seam)
 seam_mask=np.exp(-(dist/1.4)**2)*land
 colors-=seam_mask[...,None]*23
 colors+=np.exp(-((dist-3)/1.3)**2)[...,None]*land[...,None]*11
 # Paired punctures and short linen stitches sit inside the leather join.
 thread=(np.abs(dist-6)<.75)&(((xx+yy)//5)%3==0)&(land>.5)
 colors[thread]=colors[thread]*.45+np.array([221,194,134])*.55
 im=Image.fromarray(np.uint8(np.clip(colors,0,255)));d=ImageDraw.Draw(im)
 def line_stamp(points,width=1):
  if len(points)<2:return
  d.line([(x+1,y+2) for x,y in points],fill=(44,78,77),width=width+2)
  d.line(points,fill=(145,176,160),width=width)
 for feat in raw_features('line_river'):
  g=feat['geometry'];lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
  for line in lines:line_stamp([pos(p) for p in line],2)
 # Tiny stamped forest marks are bounded to actual forest footprints.
 for _ in range(14000):
  x=int(rng.integers(4,W-5));y=int(rng.integers(4,H-5))
  if forest[y,x]>.8 and land[y,x]>.5 and water[y,x]<.5:
   r=float(rng.uniform(1.1,2.4))
   d.line([(x-r,y+1),(x,y-r*2),(x+r,y+1)],fill=(47,83,64),width=1)
   d.line([(x-r+.7,y+2),(x+.7,y-r*2+1)],fill=(121,145,102),width=1)
 # Sparse warm linen stitches follow the coastline's inset distance field.
 inside=distance_transform_edt(land>.5)
 stitch=(np.abs(inside-8)<.6)&(((xx+yy)//5)%3==0)
 a=np.array(im);a[stitch]=(174,163,112)
 Image.fromarray(a).save(OUT/f'leather-{age}.webp',quality=92)
 print('Leather surface',age,W,H,flush=True)
print('All leather maps ready')
