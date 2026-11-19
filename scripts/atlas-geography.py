#!/usr/bin/python3
"""Refresh the compact municipal atlas using GDAL and official geographic boundaries."""
import json
from pathlib import Path
from urllib.request import Request, urlopen
from osgeo import ogr

root=Path(__file__).resolve().parents[1]
cache=Path('/tmp')
def load(key,url):
    file=cache/('maille-'+key+'.json')
    if not file.exists():
        with urlopen(Request(url,headers={'User-Agent':'Maille City - atlas'}),timeout=30) as response:
            file.write_bytes(response.read())
    return json.loads(file.read_text())['features']

features=[]
def add(feat,name,code,dept):
    geom=ogr.CreateGeometryFromJson(json.dumps(feat['geometry']))
    simple=geom.SimplifyPreserveTopology(.00022)
    point=simple.PointOnSurface()
    polygons=[simple] if simple.GetGeometryName()=='POLYGON' else [simple.GetGeometryRef(i) for i in range(simple.GetGeometryCount())]
    rings=[]
    for part in polygons:
        for i in range(part.GetGeometryCount()):
            ring=part.GetGeometryRef(i)
            pts=[[round(x,5),round(y,5)] for x,y,*_ in ring.GetPoints()][:-1]
            if len(pts)>=3:rings.append(pts)
    features.append({'name':name,'code':str(code),'dept':dept,'center':[round(point.GetX(),5),round(point.GetY(),5)],'rings':rings})

for feat in load('arrondissements','https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arrondissements/exports/geojson?limit=-1'):
    p=feat['properties'];num=p['c_ar'];label=f'Paris {num}'+('er' if num==1 else 'e')+' · '+p['l_aroff']
    add(feat,label,p['c_arinsee'],'75')
for dept in ('92','93','94'):
    for feat in load('communes-'+dept,'https://geo.api.gouv.fr/departements/'+dept+'/communes?format=geojson&geometry=contour&fields=nom,code,centre'):
        p=feat['properties'];add(feat,p['nom'],p['code'],dept)

features.sort(key=lambda f:(f['dept'],f['code'] if f['dept']=='75' else f['name'].casefold()))
data=json.dumps(features,ensure_ascii=False,separators=(',',':'))
(root/'public'/'atlas-outlines.js').write_text('// Paris Open Data, arrondissements. API Découpage administratif, communes. See licenses/atlas.md.\nexport const areas='+data+';\n')
print(f'{len(features)} areas, {len(data):,} characters')
