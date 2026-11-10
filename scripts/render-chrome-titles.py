"""Render the registered portfolio type as inflated silver with a studio horizon."""
from pathlib import Path
from io import BytesIO
import json
import subprocess
import numpy as np
from scipy.ndimage import gaussian_filter, distance_transform_edt
from PIL import Image, ImageFont, ImageDraw
from fontTools.ttLib import TTFont

dist = Path(__file__).resolve().parents[1] / 'chrome'
font = TTFont(dist / 'display.woff')
font.flavor = None
buffer = BytesIO()
font.save(buffer)
buffer.seek(0)
em = 176
face = ImageFont.truetype(buffer, em)
out = dist / 'lettering'
out.mkdir(exist_ok=True)
chapters = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import('./chrome/chapters.js').then(({chapters})=>console.log(JSON.stringify(chapters.map(c=>[c.id,c.title]))))"
], cwd=dist.parent))
metrics = {}
for chapter, title in chapters:
    words = (title + '.').split()
    metrics[chapter] = []
    for number, word in enumerate(words):
        pad = 10
        width = int(face.getlength(word)) + pad * 2
        mask = Image.new('L', (width, em + pad))
        ImageDraw.Draw(mask).text((pad, 143), word, font=face, fill=255, anchor='ls', stroke_width=4, stroke_fill=255)
        raw = np.asarray(mask) / 255
        # Round the ends of each stroke before inflating it into a soft tube.
        core = distance_transform_edt(raw > .5) > 6
        field = gaussian_filter((distance_transform_edt(~core) <= 7).astype(float), 1.35)
        depth = distance_transform_edt(field > .48)
        height = gaussian_filter(np.sqrt(depth)*10.5, 4.0)
        dy, dx = np.gradient(height)
        ny, nx = -dy, -dx
        nz = 1 / np.sqrt(1 + nx*nx + ny*ny)
        ry, rx, rz = 2*ny*nz*nz, 2*nx*nz*nz, 2*nz*nz-1
        y,x = np.indices(raw.shape)
        horizon = ry + .22*rx + .14*np.sin(x/78+y/95) + .08*rz
        stops = [-2,-.94,-.7,-.47,-.31,-.18,-.10,.03,.18,.30,.43,.58,.72,.81,.90,2]
        colors=np.array([[36,35,50],[88,107,124],[175,195,211],[228,246,244],[255,252,241],[211,224,230],[77,88,108],[24,26,43],[54,37,53],[115,58,68],[177,123,126],[228,195,183],[253,250,237],[162,188,200],[67,87,102],[224,231,233]])
        base=np.stack([np.interp(horizon,stops,colors[:,i]) for i in range(3)],axis=-1)
        box=np.exp(-((rx+.23*rz+.14*np.sin(y/39))/.15)**2)*(.38+.50*np.maximum(0,rz))
        aqua=np.exp(-((rx-.68)/.25)**2)*.34
        base+=(255-base)*box[:,:,None] + aqua[:,:,None]*np.array([-41,35,32])
        rgba=np.dstack((np.clip(base,0,255),255*np.clip((field-.32)/.34,0,1))).astype('uint8')
        Image.fromarray(rgba).save(out / f'{chapter}-{number}.webp', quality=94,method=6)
        metrics[chapter].append(round(width/em,4))
(out / 'metrics.js').write_text('export const advances='+json.dumps(metrics,separators=(',',':'))+';\n')
