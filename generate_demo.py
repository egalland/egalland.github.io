"""Générer les affiches vectorielles et la galerie statique."""
from html import escape
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parent
DEST = ROOT / 'affiches'
DEST.mkdir(exist_ok=True)
POSTERS = [
    ('orbites', 'Orbites', 'Trois trajectoires se rencontrent sur un fond nocturne.', '#242139', '#ffc778',
     '<g fill="none" stroke="#ffc778" stroke-width="4">' +
     ''.join(f'<ellipse cx="305" cy="321" rx="{r}" ry="132" transform="rotate({a} 305 321)"/>' for r,a in [(222,-32),(204,23),(159,77)]) +
     '</g><circle cx="305" cy="321" r="33" fill="#f4b1cf"/>'),
    ('gradins', 'Gradins', 'Sept marches composent une montagne de papier.', '#ecdfc6', '#344c42',
     ''.join(f'<rect x="{75+i*30}" y="{164+i*52}" width="{78+i*40}" height="50" fill="{["#497162","#ac5d4a","#344c42"][i%3]}"/>' for i in range(7))),
    ('onde', 'Onde', 'Une série de courbes trace le mouvement de l’eau.', '#123c50', '#ccf3dd',
     '<g fill="none" stroke="#ccf3dd" stroke-width="6">' +
     ''.join(f'<path d="M-20 {172+i*28} Q 105 {75+i*28} 237 {218+i*28} T 445 {209+i*28} T 640 {122+i*28}"/>' for i in range(10)) + '</g>'),
]

def build_poster(slug, name, description, background, ink, drawing):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 595 842" role="img">
<title>{escape(name)}</title><desc>{escape(description)}</desc>
<rect width="595" height="842" fill="{background}"/>{drawing}
<text x="42" y="704" fill="{ink}" font-family="sans-serif" font-size="78" font-weight="bold">{escape(name.upper())}</text>
<path d="M44 726H552" stroke="{ink}" stroke-width="3"/>
</svg>'''

def card(slug, name, description, featured):
    article = ' class="current"' if featured else ''
    priority = ' fetchpriority="high"' if featured else ' loading="lazy"'
    return f'''<article{article}>
<div class="visual"><img src="affiches/{slug}.svg" width="595" height="842" alt="{escape(description)}"{priority}></div>
<div class="content"><h2>{escape(name)}</h2><p class="description">{escape(description)}</p>
<div class="actions">
<a class="button" href="affiches/{slug}.pdf" download>Télécharger le PDF A4</a>
<a class="button secondary" href="affiches/{slug}.svg" download>Télécharger le SVG</a>
<a class="button secondary" href="affiches/{slug}.svg" target="_blank" rel="noopener">Voir en grand</a>
</div></div></article>'''

def main():
    cards = []
    for index, poster in enumerate(POSTERS):
        slug, name, description, *_ = poster
        svg = build_poster(*poster)
        (DEST / f'{slug}.svg').write_text(svg + '\n', encoding='utf-8')
        with fitz.open(stream=svg.encode(), filetype='svg') as image:
            content = image.convert_to_pdf()
        with fitz.open(stream=content, filetype='pdf') as draft:
            with fitz.open() as export:
                page = export.new_page(width=595.2756, height=841.8898)
                page.show_pdf_page(page.rect, draft, 0)
                export.save(DEST / f'{slug}.pdf', no_new_id=True, deflate=True)
        cards.append(card(slug, name, description, index == 0))
    (ROOT/'index.html').write_text('''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Galerie d’affiches</title><link rel="stylesheet" href="gallery.css"></head><body><main>
<header><h1>Galerie d’affiches</h1><p class="summary">Trois compositions vectorielles à explorer, télécharger ou imprimer au format A4.</p></header>
<section class="gallery" aria-label="Affiches à télécharger">''' + '\n'.join(cards) + '</section></main></body></html>\n', encoding='utf-8')

if __name__ == '__main__':
    main()
