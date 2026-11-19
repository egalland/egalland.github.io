"""Create twelve original typographic friezes with outlined, scalable lettering.

All SVG and PDF exports use the same glyph geometry and physical dimensions.
Typeface files and their licenses are tracked in typefaces/. No raster artwork
or external fonts are required to display or print the resulting designs.
"""
from pathlib import Path
from html import escape
import json
import argparse

from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.reportLabPen import ReportLabPen
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor


class PDFGlyphPen(ReportLabPen):
    """Adapt FontTools' graphics path closing to ReportLab's PDF path API."""
    def _closePath(self):
        self.path.close()


ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description="Générer des frises calendaires typographiques.")
parser.add_argument("--out", type=Path, default=Path("rendus"), help="Dossier des fichiers générés")
DIST = parser.parse_args().out
OUT = DIST / "designs"
OUT.mkdir(parents=True, exist_ok=True)
MONTHS = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"]
W, H, CELL = 3000, 150, 250

DESIGNS = [
    dict(id="force", name="FORCE", family="Archivo Black", file="ArchivoBlack-400.ttf", category="sport", tag="CONTRASTE", description="Blocs très gras, fond noir et accent citron.", bg="#090a08", fg="#d7ff38", accent="#d7ff38", line=0, padding=10, tracking=-22, recommended=True, fill_cell=True),
    dict(id="brut", name="BRUT", family="Anton", file="Anton-400.ttf", category="brutaliste", tag="FORÊT / IVOIRE", description="Une typo haute et massive, vert profond sur ivoire. Le bois tient dans un trait.", bg="#f1ede2", fg="#123b2b", accent="#ba9059", line=5, padding=7, tracking=-12, recommended=True),
    dict(id="sprint", name="SPRINT", family="Barlow Condensed Black Italic", file="BarlowCondensed-900-Italic.ttf", category="sport", tag="AFFICHE DE SPORT", description="Des lettres inclinées, serrées et nerveuses, sur un rouge franc.", bg="#e94731", fg="#fff5df", accent="#fff5df", line=3, padding=8, tracking=-22, recommended=True, fill_cell=True),
    dict(id="totem", name="TOTEM", family="Teko Bold", file="Teko-700.ttf", category="brutaliste", tag="VERT / CHÊNE", description="Des formes hautes, rectangulaires et compactes, dans une palette forêt et chêne.", bg="#173b2b", fg="#f4eede", accent="#c69b66", line=5, padding=7, tracking=-10),
    dict(id="pochoir", name="POCHOIR", family="Black Ops One", file="BlackOpsOne-400.ttf", category="brutaliste", tag="ATELIER / MATIÈRE", description="Des lettres découpées, comme un marquage d’atelier, sur un aplat kraft.", bg="#c6a16e", fg="#171c17", accent="#171c17", line=0, padding=9, tracking=-4),
    dict(id="circuit", name="CIRCUIT", family="Chakra Petch Bold", file="ChakraPetch-700.ttf", category="sport", tag="PERFORMANCE", description="Une écriture angulaire et technique, avec un accent bleu électrique.", bg="#101715", fg="#66d9ff", accent="#66d9ff", line=2, padding=10, tracking=-16),
    dict(id="tribune", name="TRIBUNE", family="Bungee", file="Bungee-400.ttf", category="sport", tag="CLUB / VARSITY", description="Des capitales carrées et épaisses, inspirées des affiches et maillots de club.", bg="#172b43", fg="#f0e8d5", accent="#d34f37", line=5, padding=10, tracking=-22, fill_cell=True),
    dict(id="contour", name="CONTOUR", family="Anton Outline", file="Anton-400.ttf", category="brutaliste", tag="PLEIN / VIDE", description="Une alternance de contours et de lettres pleines, sur fond presque noir.", bg="#131612", fg="#eee8d9", accent="#bd935d", line=3, padding=9, tracking=-8, outline=True),
    dict(id="affiche", name="AFFICHE", family="Fjalla One", file="FjallaOne-400.ttf", category="editorial", tag="ÉDITION / ARCHITECTURE", description="Une silhouette étroite et précise, avec une respiration plus régulière.", bg="#e9e5da", fg="#353b31", accent="#ad744d", line=5, padding=23, tracking=22),
    dict(id="rallye", name="RALLYE", family="Racing Sans One", file="RacingSansOne-400.ttf", category="sport", tag="RACING", description="Une italique large et musclée, dans un esprit course automobile.", bg="#e8d96a", fg="#252b24", accent="#252b24", line=3, padding=10, tracking=-18),
    dict(id="atelier", name="ATELIER", family="Space Grotesk Bold", file="SpaceGrotesk-700.ttf", category="editorial", tag="ÉDITION CONTEMPORAINE", description="Une écriture géométrique en minuscules, avec un trait chêne discret.", bg="#f4f1e8", fg="#263c32", accent="#b3895a", line=6, padding=30, tracking=-18, lowercase=True),
    dict(id="pulse", name="PULSE", family="Fugaz One", file="FugazOne-400.ttf", category="sport", tag="SPORT / MOUVEMENT", description="Une écriture oblique et ronde, plus expressive, en noir sur citron.", bg="#d7ff38", fg="#131713", accent="#131713", line=0, padding=10, tracking=-15),
]

def record_word(font, word, tracking):
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    pen = DecomposingRecordingPen(glyphs)
    x = 0
    for char in word:
        assert ord(char) in cmap, f"Missing glyph: {char}"
        name = cmap[ord(char)]
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, 1, x, 0)))
        x += glyphs[name].width + tracking
    bounds = BoundsPen(None)
    pen.replay(bounds)
    return pen, bounds.bounds

def svg_document(content, design, width=3000):
    full = width == W
    width_attr, height_attr = ("300cm", "15cm") if full else ("750", "150")
    title = f"{design['name']} - frise annuelle 300 × 15 cm"
    desc = ", ".join(MONTHS) if full else "Détail des trois premiers mois : janvier, février, mars."
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width_attr}" height="{height_attr}" '
            f'viewBox="0 0 {width} {H}" role="img" aria-labelledby="title desc">'
            f'<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>'
            + "".join(content) + '</svg>')

catalog = []
validation = []
for number, design in enumerate(DESIGNS, 1):
    font = TTFont(ROOT / "typefaces" / design['file'])
    words = [s.lower() for s in MONTHS] if design.get('lowercase') else MONTHS
    records = [record_word(font, word, design['tracking']) for word in words]
    global_min = min(b[1] for _, b in records)
    global_max = max(b[3] for _, b in records)
    available = H - design['line'] - 2 * design['padding']
    sy = available / (global_max - global_min)
    sx = min(sy, (CELL - 24) / max(b[2] - b[0] for _, b in records))
    baseline = design['padding'] + global_max * sy

    svg_parts = [f'<rect width="{W}" height="{H}" fill="{design["bg"]}"/>']
    preview_parts = svg_parts.copy()
    path = OUT / f"{design['id']}-300x15cm.pdf"
    pdf = canvas.Canvas(str(path), pagesize=(300 * cm, 15 * cm), pageCompression=1, invariant=1)
    pdf.setTitle(f"{design['name']} - frise annuelle 300 × 15 cm")
    pdf.setSubject("Douze mois en français. Impression à 100 %, sans ajuster à la page. Lettres vectorielles.")
    pdf.setViewerPreference("PrintScaling", "None")
    pdf.translate(0, 15 * cm)
    pdf.scale(300 * cm / W, -15 * cm / H)
    pdf.setFillColor(HexColor(design['bg']))
    pdf.rect(0, 0, W, H, stroke=0, fill=1)

    for i, (recording, bounds) in enumerate(records):
        xmin, ymin, xmax, ymax = bounds
        word_sx = (CELL - 24) / (xmax - xmin) if design.get("fill_cell") else sx
        tx = CELL * (i + .5) - (xmin + xmax) / 2 * word_sx
        transform = (word_sx, 0, 0, -sy, tx, baseline)
        placed_bounds = (xmin*word_sx+tx, baseline-ymax*sy, xmax*word_sx+tx, baseline-ymin*sy)
        assert placed_bounds[0] >= i*CELL + 10
        assert placed_bounds[2] <= (i+1)*CELL - 10
        assert placed_bounds[1] >= design['padding'] - .01
        assert placed_bounds[3] <= H-design['line']-design['padding']+.01
        validation.append(dict(design=design['id'], month=MONTHS[i], bounds=placed_bounds))
        is_outline = design.get('outline', False) and i % 3 != 0
        fill = 'none' if is_outline else design['fg']
        svg_pen = SVGPathPen(None)
        recording.replay(TransformPen(svg_pen, transform))
        stroke = f' stroke="{design["fg"]}" stroke-width="1.65" stroke-linejoin="round"' if is_outline else ''
        group = f'<g role="img" aria-label="{escape(words[i])}"><path d="{svg_pen.getCommands()}" fill="{fill}"{stroke}/></g>'
        svg_parts.append(group)
        if i < 3:
            preview_parts.append(group)
        pdf_path = pdf.beginPath()
        pdf_pen = PDFGlyphPen(None, pdf_path)
        recording.replay(TransformPen(pdf_pen, transform))
        pdf.setFillColor(HexColor(design['fg']))
        pdf.setStrokeColor(HexColor(design['fg']))
        pdf.setLineWidth(1.65)
        pdf.setLineJoin(1)
        pdf.drawPath(pdf_path, stroke=int(is_outline), fill=int(not is_outline), fillMode=1)

    if design['line']:
        stripe = f'<rect x="0" y="{H-design["line"]}" width="{W}" height="{design["line"]}" fill="{design["accent"]}"/>'
        svg_parts.append(stripe)
        preview_parts.append(stripe)
        pdf.setFillColor(HexColor(design['accent']))
        pdf.rect(0, H-design['line'], W, design['line'], stroke=0, fill=1)
    pdf.showPage()
    pdf.save()
    (OUT / f"{design['id']}-300x15cm.svg").write_text(svg_document(svg_parts, design), encoding='utf-8')
    (OUT / f"{design['id']}-detail.svg").write_text(svg_document(preview_parts, design, 750), encoding='utf-8')
    item = {k:v for k,v in design.items() if k in ('id','name','family','category','tag','description','bg','fg','recommended')}
    item.update(number=f"{number:02d}", pdf=f"designs/{design['id']}-300x15cm.pdf", svg=f"designs/{design['id']}-300x15cm.svg", preview=f"designs/{design['id']}-detail.svg")
    catalog.append(item)
    print(f"{number:02d} {design['name']} - 12 outlined months, SVG + PDF 300 × 15 cm")

(DIST / 'catalog.js').write_text('window.FRISE_DESIGNS = ' + json.dumps(catalog, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
(DIST / 'design-validation.json').write_text(json.dumps(validation, ensure_ascii=False, indent=2)+'\n')

(DIST / 'catalogue.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
