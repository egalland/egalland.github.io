"""Convert the bundled OFL font into the outline format used by Three.js."""
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
font=TTFont(root/'vendor/pirata.ttf')
glyphset=font.getGlyphSet(); cmap=font.getBestCmap(); scale=1000/font['head'].unitsPerEm
class OutlinePen(BasePen):
 def __init__(self):super().__init__(glyphset);self.ops=[]
 def coords(self,*pts):return ' '.join(str(round(v*scale,3)) for p in pts for v in p)
 def _moveTo(self,p):self.ops.append('m '+self.coords(p))
 def _lineTo(self,p):self.ops.append('l '+self.coords(p))
 def _curveToOne(self,p1,p2,p3):self.ops.append('b '+self.coords(p3,p1,p2))
 def _qCurveToOne(self,p1,p2):self.ops.append('q '+self.coords(p2,p1))
 def _closePath(self):pass
 def _endPath(self):pass
glyphs={}
for c in 'INNSMOUTH? ':
 name=cmap.get(ord(c),cmap.get(ord('?')));pen=OutlinePen();glyphset[name].draw(pen)
 glyphs[c]={'ha':round(font['hmtx'][name][0]*scale,3),'x_min':0,'x_max':1000,'o':' '.join(pen.ops)}
data={'glyphs':glyphs,'familyName':'Pirata One','ascender':font['hhea'].ascent*scale,'descender':font['hhea'].descent*scale,'underlinePosition':-100,'underlineThickness':50,'boundingBox':{'xMin':-200,'xMax':1500,'yMin':-400,'yMax':1500},'resolution':1000,'original_font_information':{'license':'SIL Open Font License 1.1; see OFL.txt'}}
(root/'vendor/innsmouth.typeface.json').write_text(json.dumps(data))
print('Pirata One outlines converted.')
