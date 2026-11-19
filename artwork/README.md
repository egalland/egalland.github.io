# Direction artistique de Strigius

Les fichiers utilisés par le jeu sont dans `public/art/`. Les versions WebP conservent leurs dimensions et leur canal alpha. Les six cartes de relief sont régénérées par `node scripts/bake-field-surfaces.mjs` avec ImageMagick. Les quatre matières déterminent à la fois la teinte du terrain, son nom et la répartition du décor. Les décors sont visuels et ne modifient ni la collision ni la grille de construction.

Les planches se lisent de gauche à droite. Les six décors forment deux rangées de trois. Les effets suivent trois rangées de quatre poses (poussière, vapeur, étincelles). La milice comporte huit directions et deux pas. La vérification des planches s’exécute avec `python scripts/check-sprites.py`.

## Briefs des illustrations

### Matières

`public/art/terrain-materials.webp`

Create a production videogame texture atlas for STRATE, hand-built needle-felted desert RTS. Square 2048x2048, exactly 2 columns x 2 rows of equal square texture swatches, touching at the exact centerlines. True orthographic overhead, physically photographed miniature wool, flat soft studio illumination, fine matted fibres, restrained tonal contrast, no perspective. NW warm sandy ochre with faint wind comb lines and a few tiny flecks; NE muted smokey umber slate with thin broken strata; SW dusty honey-pale dry salt/clay flat with sparse shallow fissures; SE dry sage-olive lichen felt and tiny taupe threads on an ochre base. Each surface should fill its quadrant edge to edge with no margins, uniform overall value and a repeatable non-directional basecloth. The four material samples are not landscape illustrations. Close miniature read, weathered post-apocalyptic natural materials. No words, no symbols, no characters, NO loose boulders or shadows, no black outlines, no swatch dividers or frame.

### Décors

`public/art/terrain-scenery.webp`

A production game asset atlas, 3 equal columns × 2 equal rows precisely, six isolated prop sprites on true transparent background. Landscape sheet 1536x1024, each centered inside its cell with generous transparent padding and the same world scale. Orthographic isometric tabletop photo, 38-degree elevation, natural warm key light from upper left. Handmade post-apocalyptic desert of needle-felted wool and stitched cloth, muted ochre, terracotta, dusty sage, graphite. ROW 1 (left to right): cluster of 3 low layered shale boulders with subtle ochre strata; small sun-bleached slab of felt sandstone with a seam of cream; a squat sculptural tuft of sage desert grass made of visibly spiraled felt fibres. ROW 2: a small low patch of rust-red dry brush, wiry embroidered twigs; low stacked dark basalt cairn with tiny moss tuft; fallen piece of half-buried weathered industrial pipe scrap wrapped in canvas, dull desaturated bronze, clearly not a usable resource node. Rich tactile craftsmanship, strong distinct small silhouettes, delicate contact shading immediately under each prop. No floors or bases, no scenery, no separate background shadows, absolutely no words no frames or cell borders. Keep every whole object isolated within its cell, consistent camera and crisp in-focus details.

### Effets

`public/art/activity-effects.webp`

Game VFX sprite sheet, exactly 4 columns by 3 rows, twelve cells, true transparent background, no extra symbols or text. Orthographic screen-facing VFX for a handmade miniature wool desert strategy game. Each cell an isolated small effect with identical anchor at center bottom of that cell and generous transparent padding, no ground or characters. Four sequential hand-animated stop motion poses left to right in each row, visibly changing silhouette, each row one continuous effect in warm side light. TOP ROW a puff of tan wool dust, from low compact dust kick through rising billow and broken little wisps dissolving. MIDDLE ROW a curl of soft ivory wool steam, from a tiny curl through a taller twisted cotton plume to two wisps dispersing. BOTTOM ROW the sparks of a hot industrial furnace, a few fine bright amber sparks and copper-orange flecks jumping apart from a common low center, then glowing faintly and vanishing. Palette tan, warm off-white and warm amber, realistic cotton fibres but simplified silhouettes that read at 16-32px in game. Consistent bounding cells, no outlines, absolutely no fixed background, no tiles, no glow rectangles, no labels.

### Approche de Strigius

`public/art/sector-arrival.webp`

Cinematic establishing shot for the loading screen of STRATE, sophisticated worn industrial desert RTS on a cube-shaped world, every object hand constructed from needle-felted wool, worn canvas and yarn stitching in the detailed style of a high-budget photographed stop-motion tabletop miniature. Landscape 16:9, 2048x1152. Panoramic composition: a tiny turquoise expedition camp in the lower right third under an ochre sky, winding yarn road across rugged terraced ochre and dark umber felt ridges to a distant trading town with a slim pennant, two small field trucks, a few warm copper lights and coiled cable, seams and filaments visible. Upper LEFT half large dark airy atmospheric ochre sky and distant mountains free of text for a real UI overlay. Beautiful cinematic side light, dramatic afternoon long soft shadows, fine filmic sand haze, dramatic near/far depth. Distinct silhouette even at small scale. No lettering, no logos, no overlays, no borders, no title, no UI. Not plastic, no cartoon outlines.

### Milice

`public/art/guard-directions.webp`

CHARACTER SPRITES. A single needle-felted guard in a graphite coat, rust scarf and turquoise-striped helmet, carrying a compact rifle. Transparent square atlas, four columns × four rows. The first two rows document clockwise screen directions starting east in one walk pose. The last two rows show the alternate step for the same eight directions.


### Formations du terrain

`public/art/terrain-landforms.webp`

Production videogame terrain decal atlas, EXACTLY TWO COLUMNS by TWO ROWS, four equal square cells, true transparent background. Four richly detailed contiguous landscape formations for an overhead strategy map. Strict straight-down 90 degree camera, NO perspective, a studio macro photograph of handmade dyed wool, weathered needle-felted desert material with fine fibers and embroidered geological seams. Each cell contains a distinct irregular, low-profile complete patch, isolated with padding: TOP LEFT a braided dry wash in tan earth, three tapering sinuous eroded channels and gravel bars, dark inside edges with tiny cream stones. TOP RIGHT a weathered crescent escarpment of layered dark gray-brown sandstone slabs, ochre terraces, clearly visible strata and shadows directly at the lip. BOTTOM LEFT an irregular cream salt pan with branching polygonal mud cracks, thinner at the ragged edges. BOTTOM RIGHT a tufted olive sage-lichen island of scrub around a low diagonal spine of tan rock in ochre dust. Broad natural forms with interesting asymmetric silhouettes. Gradually torn irregular feathered borders blending into alpha, no square ground tile or vignette. Lighting directional but soft, clear details that read at 150 pixels. No horizon, structures, characters, ore deposits, text, lines between cells or shadows outside patches.

### Chargements industriels et porteurs

`public/art/cargo-goods.webp` contient les neuf marchandises en trois rangées. `public/art/carrier-directions.webp` contient huit directions et quatre phases de marche chargée. Le mouvement de la matière suit les transferts confirmés. Les coordonnées des colis sont projetées sur la même grille que les machines.

Production game art: an exact THREE-COLUMN by THREE-ROW contact sheet of nine different industrial cargo SPRITES for STRATE. Genuinely transparent background, zero text, no shadows outside individual items, no borders. Orthographic isometric 35° overhead tabletop photo. Hand needle-felted miniature objects with crisp wool stitches, clear chunky silhouettes, legible when each cargo icon is 14px in game. Each centered object fills about 72% of its square cell, aligned on the same middle baseline, evenly sized 3x3 grid. EXACT objects row by row: ROW ONE 1) single jagged dark iron ore lump with cool silver exposed facets; 2) single rich orange copper ore nodule with copper highlights, asymmetric and rounder; 3) stack of two rectangular silvery steel plates with bright stitched edges. ROW TWO 4) stack of two terracotta copper plates with bright copper edges; 5) one graphite steel cogwheel with a central hole, strong spokes; 6) one orange coil of wrapped copper wire. ROW THREE 7) square green circuit board with stitched gold circuit traces; 8) dark purple compact electric motor with a short projecting brass shaft; 9) cream-bound turquoise folded research document with a stitched strap. Each sprite a single object/group with distinct silhouette, consistent camera, warm lighting from upper left, no stands, boxes, decorations, captions, numerals, grid guidelines, symbols, text or extraneous items. Transparent negative space around every sprite. Square atlas.

Make a second uniform animation sheet using the attached character sheet as an identity, art style AND exact 8-column × 4-row layout reference. Exactly same small turquoise work-suited wool puppet with ochre goggle helmet, backpack and dark boots. This is his LOADED WALK: leans slightly back, both gloved hands support a shallow OPEN ochre canvas sling or flat carrying tray directly in front at lower chest/belly height. Keep the tray empty so a separate resource sprite can be placed on top in game. Arms bent and steady, believable weight; legs alternate in four distinct walking poses. Exactly 8 columns (left to right facing screen RIGHT, down-right, DOWN, down-left, LEFT, up-left, UP, up-right) and 4 rows (walking phases), full figure centered in each transparent cell, precisely aligned same baseline as original. Make front/back and left/right genuinely distinct. Keep physical wool fibers, warm muted light, overalls, same proportions, no ore printed in the image. No typography, no frames, no floor, no captions, no watermark, true transparent background. Landscape sheet twice as wide as it is high.
