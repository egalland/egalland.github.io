import json, math, pathlib
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from scipy.ndimage import gaussian_filter, distance_transform_edt,zoom
ROOT=pathlib.Path(__file__).parent; OUT=ROOT/'dist/assets'
BOUNDS={1:[.013,-.0105,.0225,-.0035],2:[.010,-.023,.034,-.004],3:[.024,-.0225,.045,-.006]}
rng=np.random.default_rng(42)
for age in [1,2,3]:
 b=BOUNDS[age]; W=3072;H=round(W*(b[3]-b[1])/(b[2]-b[0])); print('Terrain',age,W,H,flush=True)
 def pos(c):return ((c[0]-b[0])/(b[2]-b[0])*W,(b[3]-c[1])/(b[3]-b[1])*H)
 def features(layer):return [f for f in json.load(open(ROOT/f'raw/{age}-{layer}.json'))['features'] if f.get('geometry')]
 def mask(layer):
  im=Image.new('L',(W,H));dr=ImageDraw.Draw(im)
  for f in features(layer):
   g=f['geometry']; polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
   for poly in polys:
    if not poly:continue
    dr.polygon([pos(c) for c in poly[0]],fill=255)
    for ring in poly[1:]:dr.polygon([pos(c) for c in ring],fill=0)
  return np.asarray(im).astype(np.float32)/255
 land=mask('poly_outline'); water=mask('poly_lake'); low=mask('poly_mountainlow'); high=mask('poly_mountainhigh'); forest=mask('poly_forest')
 def noise(scale):
  a=rng.random((max(3,H//scale),max(3,W//scale)),dtype=np.float32)
  return zoom(a,(H/a.shape[0],W/a.shape[1]),order=1)[:H,:W]
 n1=noise(110);n2=noise(32);n3=noise(9);n4=noise(3)
 # Smoothed geographic footprints, ridged fractal variation and continuous foothills.
 dist=distance_transform_edt(low>.1); outside=distance_transform_edt(low<.5)
 ridge=np.clip(dist/20,0,1)
 foothills=np.exp(-outside/24)*.22*(1-low)
 ridged=1-np.abs(n2*2-1)
 fine=1-np.abs(n3*2-1)
 m=(gaussian_filter(low,4)*(.25+ridge*.65)+foothills)*(.33+ridged*.55+fine*.25)
 h=land*(2+n1*3+n2*1.8)+m*50+gaussian_filter(high,5)*(.25+ridged*.55+fine*.22)*24
 h*=1-water*.96
 h=gaussian_filter(h,.7)
 dy,dx=np.gradient(h);shade=np.clip(.94+(-dx*.5-dy*.65)/3,.58,1.28)
 base=np.zeros((H,W,3),np.float32);base[:]=[156,174,131]
 base+=(n1[:,:,None]-.5)*30+(n2[:,:,None]-.5)*12+(n4[:,:,None]-.5)*12
 f=gaussian_filter(forest,1.8)[:,:,None]*.83
 base=base*(1-f)+np.array([59,88,65])*f
 base+=(n4[:,:,None]-.5)*f*25
 amount=np.clip(m*1.5,0,1)[:,:,None]
 base=base*(1-amount)+np.array([149,152,134])*amount
 snow=np.clip((h-40)/19,0,1)[:,:,None]
 base=base*(1-snow)+np.array([232,234,220])*snow
 contour=np.exp(-np.square(((h%2.7)-1.35)/.10))[:,:,None]
 base-=contour*2.4
 # Dry lands in the east and the volcanic plateau.
 yy,xx=np.mgrid[0:H,0:W]
 if age==3:
  gx=b[0]+xx/W*(b[2]-b[0]);gy=b[3]-yy/H*(b[3]-b[1])
  east=np.clip((gx-.040)/.004,0,1)[:,:,None]*.45
  base=base*(1-east)+np.array([191,171,125])*east
  mordor=((gx>.0399)&(gy<-.016)&(gy>-.0205)).astype(float)
  mordor=gaussian_filter(mordor,40)[:,:,None]*.75
  base=base*(1-mordor)+np.array([103,103,86])*mordor
 base*=shade[:,:,None]
 coast=distance_transform_edt(land<.5)
 sea=np.zeros_like(base);sea[:]=[69,123,127];sea+=(n1[:,:,None]-.5)*8
 sea+=np.exp(-coast[:,:,None]/30)*17
 contour=(np.cos(coast/8)>.98)&(coast<60)&(land<.5)
 sea[contour]+=5
 base=base*land[:,:,None]+sea*(1-land[:,:,None])
 lake=water[:,:,None];base=base*(1-lake)+np.array([88,145,144])*lake
 im=Image.fromarray(np.clip(base,0,255).astype('uint8'));dr=ImageDraw.Draw(im)
 for f in features('line_river'):
  g=f['geometry'];lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
  for line in lines:
   if len(line)>1:dr.line([pos(c) for c in line],fill=(106,148,144),width=2)
 # Canopy, outcrops and secondary settlements, painted on the geographic footprints.
 pixels=im.load()
 for i in range(47000):
  x=int(rng.integers(2,W-3));y=int(rng.integers(2,H-3))
  if forest[y,x]>.6 and land[y,x]>.6:
   rad=float(rng.uniform(1,3.5));col=pixels[x,y]
   dr.ellipse((x-rad+.8,y-rad+1.5,x+rad+.8,y+rad+1.5),fill=tuple(max(0,int(c*.72)) for c in col))
   dr.ellipse((x-rad,y-rad,x+rad,y+rad),fill=tuple(min(255,int(c*1.13+4)) for c in col))
  elif low[y,x]>.6 and rng.random()<.3:
   col=pixels[x,y];dr.line((x,y,x+3,y+2),fill=tuple(min(255,c+16) for c in col),width=1)
 for ftr in features('point_city'):
  px,py=pos(ftr['geometry']['coordinates'])
  if not (30<px<W-30 and 30<py<H-30):continue
  for k in range(26):
   xx=int(px+rng.normal(0,10));yy=int(py+rng.normal(0,7))
   if land[yy,xx]>.5 and water[yy,xx]<.5:
    dr.rectangle((xx,yy,xx+3,yy+2),fill=(149,138,108));dr.line((xx,yy,xx+3,yy),fill=(211,204,172),width=1)
 for ftr in features('line_river'):
  g=ftr['geometry'];lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
  for line in lines:
   if len(line)>1:
    dr.line([pos(c) for c in line],fill=(126,170,156),width=3)
    dr.line([pos(c) for c in line],fill=(70,128,131),width=1)
 if age==3:
  x,y=pos([.04028810775207,-.017364241777332]);r=14
  dr.ellipse((x-r,y-r*.65,x+r,y+r*.65),outline=(74,70,58),width=5)
  dr.ellipse((x-r*.38,y-r*.25,x+r*.38,y+r*.25),fill=(102,65,42),outline=(175,104,52),width=2)
 im.save(OUT/f'terrain-{age}.webp',quality=93)
 # Deterministic geographic scatter for small forest/rock geometry.
 scatter={'trees':[],'rocks':[]}
 for i in range(18000):
  x=int(rng.integers(2,W-3));y=int(rng.integers(2,H-3))
  if forest[y,x]>.6 and len(scatter['trees'])<2400:
   scatter['trees'].append([round(x/W*1800,2),round(y/H*(1800*H/W),2),round(float(rng.uniform(.8,1.8)),2)])
  elif low[y,x]>.6 and len(scatter['rocks'])<550:
   scatter['rocks'].append([round(x/W*1800,2),round(y/H*(1800*H/W),2),round(float(rng.uniform(.9,2.2)),2)])
 (OUT/f'scatter-{age}.json').write_text(json.dumps(scatter,separators=(',',':')))

 # Cartographic, warmer alternate view.
 a=np.array(im).astype(float);a=a*.58+np.array([224,210,168])*.42
 Image.fromarray(a.astype('uint8')).save(OUT/f'parchment-{age}.webp',quality=87)
 # Terrain heights for a real Three.js mesh.
 hs=Image.fromarray(np.uint8(np.clip(h/80,0,1)*255)).resize((512,round(512*H/W)))
 hs.save(OUT/f'height-{age}.png')
 dat={'bounds':b,'width':1800,'height':1800*H/W,'places':[],'regions':[],'roads':[]}
 def norm(c):
  p=pos(c);return [round(p[0]/W*1800,2),round(p[1]/H*dat['height'],2)]
 for layer in ['point_city','point_place','point_mount']:
  for f in features(layer):
   pt=norm(f['geometry']['coordinates'])
   if 0<pt[0]<1800 and 0<pt[1]<dat['height']:
    dat['places'].append({'id':f['properties']['eventname'],'p':pt,'type':{'point_city':'cité','point_place':'lieu','point_mount':'sommet'}[layer],'size':f['properties'].get('size',1)})
 for f in features('poly_region'):
  g=f['geometry'];polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
  for poly in polys:dat['regions'].append({'id':f['properties'].get('eventname','Royaume'),'rings':[[norm(c) for c in ring[::2]] for ring in poly]})
 for f in features('line_road'):
  g=f['geometry'];lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
  for line in lines:dat['roads'].append([norm(c) for c in line[::2]])
 (OUT/f'map-{age}.json').write_text(json.dumps(dat,separators=(',',':')))
print('Done')
