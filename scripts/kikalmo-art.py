"""Build original Kikalmo equipment art for the street renderer.
Usage: python scripts/kikalmo-art.py /path/to/kikalmo-checkout /path/to/esbuild
Only a regeneration requires Pillow, esbuild and the upstream source.
"""
from pathlib import Path
from PIL import Image
import subprocess, tempfile, sys, json, itertools

source = Path(sys.argv[1]).resolve()
esbuild = Path(sys.argv[2]).resolve()
public = Path(__file__).resolve().parents[1] / "public"
with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    shim = tmp / "jsx.js"
    shim.write_text("""
let seq = 0;
export function useId(){ return 'kcl'+(++seq); }
export function resetId(){ seq=0; }
export function jsx(type,props){return h(type,props,...(Array.isArray(props?.children)?props.children:[props?.children]));}
export const jsxs=jsx;
export const Fragment=Symbol('fragment');
export function h(type,props,...children){
  if(type===Fragment)return children;
  if(typeof type==='function')return type({...props,children});
  return {type,props:props||{},children};
}
// Only the pure PuppetArt entry point is used; React subscription hooks are tree-shaken.
export const useEffect=()=>{},useState=()=>{},useRef=()=>{},useSyncExternalStore=()=>{};
""")
    entry = tmp / "entry.ts"
    entry.write_text(f"""
import {{ PuppetArt }} from {json.dumps(str(source/'app/components/Avatar.tsx'))};
import {{ puppetPose }} from {json.dumps(str(source/'lib/puppet.ts'))};
import {{ ULTIMATE_SPRITE_IDS }} from {json.dumps(str(source/'lib/ultimate-sprites.ts'))};
import {{ resetId }} from './jsx';
import {{ COSMETICS }} from {json.dumps(str(source/'lib/cosmetics.ts'))};
import {{ shopSlot }} from {json.dumps(str(source/'lib/profile.ts'))};
export const equipment=Object.fromEntries(COSMETICS.map(v=>[v.id,[shopSlot(v.id),v.name]]));
export function buildKikalmoArt(a,pose=0){{
 resetId();
 const time=[0,260,520,1040,1560,4150,4850,5750][pose]||0;
 const ultimate=ULTIMATE_SPRITE_IDS.includes(a.costume)||a.costume===233||a.costume===234;
 const frame=puppetPose(a.premiumEyes===36?0:a.premiumEyes===37?2:a.premiumEyes===38?1:a.eyes,a.mouth,'idle',0,0,false);
 return PuppetArt({{value:a,frame,id:'ka',expression:'idle',effectsMotion:ultimate,motionTime:time,sizing:'uniform'}});
}}
""")
    subprocess.run([str(esbuild), str(entry), "--bundle", "--format=esm", "--platform=browser",
                    "--tree-shaking=true", "--jsx=transform", "--jsx-factory=h", "--jsx-fragment=Fragment",
                    "--inject:"+str(shim), "--alias:react/jsx-runtime="+str(shim), "--alias:react="+str(shim), "--minify-whitespace",
                    "--banner:js=// Generated from Kikalmo PuppetArt, registrations, catalogue and morphology data. See scripts/kikalmo-art.py.",
                    "--outfile="+str(public/"kikalmo-art.js")],check=True)

root = source/"public"
files = [p for p in sorted((root/"puppets").rglob("*.webp")) if p.name not in ("body.webp",) and
         not (p.parent.name=="v2" and p.stem in ("heads","outfits","hair","tuft"))]
files += [root/"seasonal"/("wool-gift-"+k+".webp") for k in ("base","lid")]
# Group commonly co-equipped pieces. Keep pages small for mobile decoding and lazy downloads.
def family(p):
    if p.parent.name=="costumes": return "costumes"
    if p.parent.name=="ultimate-sprites": return "ultimate"
    if p.parent.name in ("accessories-v2","christmas","hair-shop","seasonal"): return "gear"
    return "identity"
index, page_names = {}, []
for name, assets in itertools.groupby(sorted(files,key=lambda p:(family(p),p.name)),family):
    packed=[]
    for p in assets:
        im=Image.open(p).convert("RGBA")
        if name=="identity": ratio=.56
        elif name=="ultimate": ratio=.41
        else: ratio=min(1,320/max(im.size))
        im=im.resize(tuple(max(1,round(v*ratio)) for v in im.size),Image.Resampling.LANCZOS)
        packed.append((p,im))
    packed.sort(key=lambda v:-v[1].height)
    rows=[]; n=-1
    for p,im in packed:
        found=None
        for rid,row in enumerate(rows):
            if row[2]>=im.height and row[1]+im.width+2<=1280: found=row;break
        if found is None:
            y=rows[-1][0]+rows[-1][2]+2 if rows else 0
            if n<0 or y+im.height>1280:
                if n>=0: page.crop((0,0,1280,max(y,r_extent))).save(public/page_names[-1],"WEBP",quality=84,method=6)
                n+=1; rows=[]; y=0;r_extent=0;page=Image.new("RGBA",(1280,1280));page_names.append("kikalmo-"+name+"-"+str(n)+".webp")
            found=[y,0,im.height];rows.append(found)
        y,x=found[:2];page.paste(im,(x,y));found[1]+=im.width+2;r_extent=max(r_extent,y+im.height)
        index["/"+p.relative_to(root).as_posix()] = [len(page_names)-1,x,y,*im.size]
    page.crop((0,0,1280,r_extent)).save(public/page_names[-1],"WEBP",quality=84,method=6)
(public/"kikalmo-atlas.js").write_text("// Generated from the original Kikalmo fabrics and costume sheets.\nexport const pages="+json.dumps(page_names,separators=(",",":"))+";\nexport const sources="+json.dumps(index,separators=(",",":"))+";\n")
print(f"{len(index)} original sheets on {len(page_names)} pages ({sum((public/p).stat().st_size for p in page_names):,} bytes)")
