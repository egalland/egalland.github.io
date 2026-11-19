#!/usr/bin/python3
"""Regenerate the real Paris–La Défense game map from IGN WFS. Requires Python 3 and GDAL."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
import gzip, json, math, os, sys, tempfile, time
from osgeo import ogr

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(tempfile.gettempdir()) / 'maille-city-ign-20261119'
CACHE.mkdir(exist_ok=True)
URL = 'https://data.geopf.fr/wfs/ows'
AXIS = [(2.295028,48.873778),(2.28238,48.87794),(2.25730,48.88600),(2.25035,48.88802),(2.23556,48.8925)]
EAST = [(2.33651,48.86103),(2.3369,48.86256),(2.3229,48.86655),(2.32115,48.86563),(2.31347,48.86893),AXIS[0]]
MAP_AXIS = EAST[:-1] + AXIS
LAYERS = {
    'batiment':['geometrie','cleabs','usage_1','nature','hauteur','nombre_d_etages','etat_de_l_objet'],
    'troncon_de_route':['geometrie','cleabs','nature','etat_de_l_objet','importance','nom_voie_ban_gauche','nom_voie_ban_droite','nom_collaboratif_gauche','nom_collaboratif_droite','largeur_de_chaussee','nombre_de_voies','position_par_rapport_au_sol','prive','sens_de_circulation'],
    'zone_de_vegetation':['geometrie','cleabs','nature'],
    'surface_hydrographique':['geometrie','cleabs','nature','persistance'],
    }
RADIUS = 650
PAGE_SIZE = 1000

def project(lon,lat):
    return ((lon-2.25)*73190,(48.88-lat)*111320)
def unproject(x,y):
    return (2.25+x/73190,48.88-y/111320)
def recipe(layer, b, start):
    edges = ','.join(f'{v:.7f}' for v in b)
    return dict(SERVICE='WFS',VERSION='2.0.0',REQUEST='GetFeature',TYPENAMES='BDTOPO_V3:'+layer,
        SRSNAME='CRS:84',BBOX=edges+',CRS:84',COUNT=PAGE_SIZE,STARTINDEX=start,
        SORTBY='cleabs',PROPERTYNAME=','.join(LAYERS[layer]),OUTPUTFORMAT='application/json')
def acquire(job):
    tile,layer,b=job
    features=[]
    for start in range(0,60000,PAGE_SIZE):
        version=2 if layer=='troncon_de_route' else 1
        cache=CACHE / f'{tile}-{layer}-{start}-v{version}.json'
        if cache.exists():
            data=json.loads(cache.read_bytes())
        else:
            req=Request(URL+'?'+urlencode(recipe(layer,b,start)),headers={'User-Agent':'Maille-City/2.0 (geographic level extraction)', 'Accept':'application/json'})
            for attempt in range(4):
                try:
                    raw=urlopen(req,timeout=65).read()
                    data=json.loads(raw)
                    cache.write_bytes(raw)
                    break
                except (ValueError,HTTPError,URLError,TimeoutError) as err:
                    if attempt==3:
                        raise RuntimeError(f'Failed WFS fetch {tile} {layer} {start}: {err} {raw[:500] if "raw" in locals() else ""}') from err
                    time.sleep(1.4*(2**attempt))
        features.extend(data['features'])
        if len(data['features'])<PAGE_SIZE or start+PAGE_SIZE>=int(data.get('numberMatched',60000)):break
    print(tile,layer,len(features),flush=True)
    return layer,features
def geometry(kind,coords):
    # Project before simplification, preserving XY only.
    def convert(c):
        if c and isinstance(c[0],(int,float)):return list(project(c[0],c[1]))
        return [convert(g) for g in c]
    return ogr.CreateGeometryFromJson(json.dumps(dict(type=kind,coordinates=convert(coords))))
def lines(g):
    typ=g.GetGeometryName()
    if typ in ('LINESTRING','LINEARRING'):yield g
    elif typ in ('MULTILINESTRING','GEOMETRYCOLLECTION'):
        for i in range(g.GetGeometryCount()):yield from lines(g.GetGeometryRef(i))
def polygons(g):
    if g.GetGeometryName()=='POLYGON':yield g
    elif g.GetGeometryName() in ('MULTIPOLYGON','GEOMETRYCOLLECTION'):
        for i in range(g.GetGeometryCount()):yield from polygons(g.GetGeometryRef(i))
def simple_points(line,closed=False):
    pts=[]
    for x,y,*_ in line.GetPoints():
        val=[int(round(x)),int(round(y))]
        if not pts or pts[-1]!=val:pts.append(val)
    if closed and pts and pts[-1]==pts[0]:pts.pop()
    return pts
def ids(identifier):return identifier.lstrip('ABCDEFGHIJKLMNOPQRSTUVWXYZ0') or identifier

def travel_direction(value,points,original_lines):
    """Match the clipped road's vertex order with IGN's digitized direction."""
    sign={'Sens direct':1,'Sens inverse':-1}.get(value,0)
    if not sign:return 0
    # Centres of long retained edges are less sensitive to metre rounding at clipped ends.
    a,b=max(zip(points,points[1:]),key=lambda pair:math.dist(pair[0][:2],pair[1][:2]))
    x,y=(a[0]+b[0])/2,(a[1]+b[1])/2
    best=(float('inf'),0);order=1
    for line in original_lines:
        for u,v in zip(line,line[1:]):
            dx,dy=v[0]-u[0],v[1]-u[1];length2=dx*dx+dy*dy
            if not length2:continue
            t=max(0,min(1,((x-u[0])*dx+(y-u[1])*dy)/length2))
            dot=(b[0]-a[0])*dx+(b[1]-a[1])*dy
            rank=((x-u[0]-t*dx)**2+(y-u[1]-t*dy)**2,-abs(dot)/math.sqrt(length2))
            if rank<best:best=rank;order=1 if dot>=0 else -1
    return sign*order
PRESETS = {'eiffel': (2.29232,48.85935,'Tour Eiffel'), 'notre-dame': (2.34790,48.85348,'Notre-Dame de Paris'), 'sacre-coeur': (2.34318,48.88480,'Sacré-Cœur')}

def emit(preset=None):
    axis=geometry('LineString',MAP_AXIS)
    if preset:
        lon,lat,preset_name=PRESETS[preset]
        cx,cy=map(round,project(lon,lat))
        radius=660
        ring=[(cx-radius,cy-radius),(cx+radius,cy-radius),(cx+radius,cy+radius),(cx-radius,cy+radius),(cx-radius,cy-radius)]
        boundary=geometry('Polygon',[[unproject(x,y) for x,y in ring]])
    else:
        boundary=axis.Buffer(RADIUS,14)
    minx,maxx,miny,maxy=boundary.GetEnvelope()
    jobs=[]
    tile=0
    for x in range(math.floor(minx/620)*620,math.ceil(maxx/620)*620,620):
        for y in range(math.floor(miny/620)*620,math.ceil(maxy/620)*620,620):
            corners=[unproject(x,y),unproject(x+620,y),unproject(x+620,y+620),unproject(x,y+620),unproject(x,y)]
            part=geometry('Polygon',[corners])
            if not boundary.Intersects(part):continue
            west,south=unproject(x,y+620); east,north=unproject(x+620,y)
            jobs.extend((f'grid{x}_{y}',l,[west,south,east,north]) for l in ('batiment','troncon_de_route'))
            tile+=1
    jobs.extend((('preset-'+preset if preset else 'all-'+str(round(maxx))),l,[*unproject(minx,maxy),*unproject(maxx,miny)]) for l in ('surface_hydrographique','zone_de_vegetation'))
    collected={layer:{} for layer in LAYERS}
    with ThreadPoolExecutor(max_workers=5) as pool:
        for l,ff in pool.map(acquire,jobs):
            for f in ff:collected[l][f['properties']['cleabs']]=f
    bld=[];st=[];waters=[];green=[];actual=0;estimated=0;level_skips=0
    for layer,features in collected.items():
        for key,f in sorted(features.items()):
            p=f['properties'];g=geometry(f['geometry']['type'],f['geometry']['coordinates'])
            if not boundary.Intersects(g):continue
            if layer=='batiment':
                if p.get('etat_de_l_objet') not in (None,'En service'):continue
                h=p.get('hauteur')
                observed=bool(h and 0.8<=h<=350)
                if not observed:h = max(2.5,(p.get('nombre_d_etages') or (4 if p.get('usage_1')=='Résidentiel' else 2))*3.0)
                h=round(h,1)
                kind={'Résidentiel':'residential','Industriel':'industrial','Religieux':'religious','Sportif':'sports','Agricole':'agricultural','Commercial et services':'commercial','Annexe':'annex','Indifférencié':'mixed'}.get(p.get('usage_1'),'mixed')
                g=g.SimplifyPreserveTopology(.65)
                for n,poly in enumerate(polygons(g)):
                    outer=simple_points(poly.GetGeometryRef(0),True)
                    if len(outer)<3 or poly.GetArea()<5:continue
                    holes=[simple_points(poly.GetGeometryRef(i),True) for i in range(1,poly.GetGeometryCount())]
                    holes=[ring for ring in holes if len(ring)>=3]
                    bld.append([ids(key)+(f'-{n}' if n else ''),outer,h,kind,holes or None,int(observed)])
                    if observed:actual+=1
                    else:estimated+=1
            elif layer=='troncon_de_route':
                nature=p['nature'] or '';level=int(p.get('position_par_rapport_au_sol') or 0)
                if p.get('etat_de_l_objet') not in (None,'En service'):continue
                # Surface terrain only. Negative-level tunnels cannot be rendered as open roads.
                if level<0:level_skips+=1;continue
                importance=int(p.get('importance') or 6)
                path=nature in ('Sentier','Escalier','Chemin','Piste cyclable')
                kind='path' if path else 'motorway' if nature in ('Autoroute','Bretelle','Type autoroutier') else 'primary' if importance<=3 else 'secondary' if importance==4 else 'residential'
                width=p.get('largeur_de_chaussee')
                if not width or width<.5:width=2.4 if path else max(4,(p.get('nombre_de_voies') or (2 if importance<=4 else 1))*3.35)
                name=p.get('nom_voie_ban_gauche') or p.get('nom_voie_ban_droite') or p.get('nom_collaboratif_gauche') or p.get('nom_collaboratif_droite') or ''
                cut=g.Intersection(boundary).Simplify(.6)
                original_lines=[line.GetPoints() for line in lines(g)]
                for n,part in enumerate(lines(cut)):
                    points=simple_points(part)
                    if len(points)<2:continue
                    direction=travel_direction(p.get('sens_de_circulation'),points,original_lines)
                    st.append([ids(key)+(f'-{n}' if n else ''),points,round(float(width),1),kind,name,level,direction])
            else:
                cut=g.Intersection(boundary).SimplifyPreserveTopology(1.25 if layer=='zone_de_vegetation' else .8)
                for n,poly in enumerate(polygons(cut)):
                    r=simple_points(poly.GetGeometryRef(0),True)
                    if len(r)<3:continue
                    holes=[simple_points(poly.GetGeometryRef(i),True) for i in range(1,poly.GetGeometryCount())]
                    rings=[h for h in holes if len(h)>=3]
                    if layer=='zone_de_vegetation':green.append([r,rings,p['nature']])
                    else:waters.append([r,rings])
    bound=simple_points(boundary.GetGeometryRef(0),True)
    meta=dict(source='IGN • BD TOPO®',attribution='© IGN, BD TOPO® · Licence Ouverte 2.0',url='https://geoservices.ign.fr/bdtopo',license='https://www.etalab.gouv.fr/licence-ouverte-open-licence/',extracted=datetime.now(timezone.utc).date().isoformat(),projection='XY en mètres. Origine 2.25° E, 48.88° N, x vers l’est et y vers le sud.',radius=RADIUS,axis=[list(map(round,project(*a))) for a in AXIS],mapAxis=[list(map(round,project(*a))) for a in MAP_AXIS],boundary=bound,observedHeight=actual,estimatedHeight=estimated,undergroundRoadsOmitted=level_skips,counts=dict(buildings=len(bld),streets=len(st),water=len(waters),green=len(green)))
    def js(o):return json.dumps(o,ensure_ascii=False,separators=(',',':'))
    if preset:
        meta.update(radius=radius,sector=dict(name=preset_name,lon=lon,lat=lat,x=cx,y=cy),bounds=[round(minx),round(miny),round(maxx),round(maxy)],axis=[[cx-200,cy],[cx+200,cy]],mapAxis=[[cx-200,cy],[cx+200,cy]])
        data=dict(metadata=meta,buildings=bld,streets=st,water=waters,green=green)
        compressed=gzip.compress(js(data).encode('utf8'),compresslevel=9,mtime=0)
        (ROOT/'public'/('sector-'+preset+'.gz')).write_bytes(compressed)
        print('Ready',preset,len(compressed),meta['counts'],flush=True)
        return
    content="/* IGN BD TOPO®, Licence Ouverte 2.0. See licenses/geography.md and scripts/geo-extract.py. */\n"
    content+="export const buildings="+js(bld)+".map(([id,poly,h,kind,holes,observed])=>({id,poly,h,kind,holes:holes||[],observedHeight:!!observed}));\n"
    content+="export const streets="+js(st)+".map(([id,path,w,kind,name,level,oneway=0])=>({id,path,w,kind,name,level,bridge:level>0,oneway}));\n"
    content+="export const water="+js(waters)+".map(([poly,holes])=>({poly,holes}));\n"
    content+="export const green="+js(green)+".map(([poly,holes,kind])=>({poly,holes,kind}));\n"
    content+="export const metadata="+js(meta)+";\n"
    (ROOT/'public'/'paris-core.js').write_text(content)
    print('Complete:',len(content),meta['counts'],actual,estimated,level_skips,flush=True)
if __name__=='__main__':emit(sys.argv[1] if len(sys.argv)>1 else None)
