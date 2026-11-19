# STRATE animation sources

Generated with the built-in image-generation tool. The RGBA sources are retained in `public/art/animated-factory.png`, `animated-world.png` and `animated-actors.png`. Runtime metadata is in `lib/sprite-animation.ts`.

## Shared production brief

Production game animation sprite sheet for STRATE, a wool-felt post-apocalyptic factory strategy game. Transparent alpha around each subject, no floor, border, labels or text. Needle-felt wool and stitched fabric, turquoise, rusty ochre, cream and charcoal. Fixed three-quarter isometric camera. Four equal columns are successive animation frames, identical position, scale and baseline per row. Genuine changes in mechanical/character poses, never a rotation, translation or scaling of the entire sprite. Keep foundations fixed. Fully isolated cutouts in a regular cell grid.

## Factory atlas

Four rows, four columns. Furnace with four different flame/smoke/pouring-metal poses. Metal press with raised, descending, pressing and lifting ram. Wire mill with changing internal spokes, rollers and copper loops. Assembler with robotic arm picking, lowering, pressing and retracting a cog onto a green circuit board.

## World atlas

Four rows, four columns. Trading city with rippling fabric flags and lanterns. Depot with a loading door at different heights and moving crates. Drill with distinct auger positions and piston extensions. Freight truck with different wheel spokes and suspension travel, fixed overall position.

## Actors atlas

Five rows, four columns. Hooded turquoise scout in four walking strides. Two wool soldiers in four running/weapon-ready poses. Burgundy horned beetle in four crawling/mandible poses. Research lab with moving dish and probe. Storage chest with closed, raised, open and lowering lid. The actors sheet received a second background-extraction pass, preserving all twenty subjects, positions and cell dimensions while removing the white backdrop and external shadows.

## Playback

The canvas samples source rectangles from the RGBA atlas; UI previews animate background-position with discrete steps. Machines play during real jobs. Stopped machines, stationary units and reduced-motion views hold frame zero. Cities and depots now always hold a static pose, including their lights and foundations. Utility machinery and ore highlights use separately rasterized four-pose canvas atlases. They are code-native mechanical parts and do not deform a static illustration.

## Close-up detail revision — 8 November 2026

`detail-drill.png`, `detail-furnace.png`, `detail-press.png`, `detail-wiremill.png` and `detail-assembler.png` each contain four 627-pixel poses in a transparent 2×2 sheet. The canvas composites the first pose's fixed body with only the current mechanical region, preventing whole-building wobble. `detail-city.png` and `detail-depot.png` each contain one static 1254-pixel subject. `detail-buildings.png` contains four static subjects: MAM, warehouse, barracks and repair bay. All are generated wool-and-felt originals, retained unmodified except a background extraction pass for the press.

## Illustrated view restored — 8 November 2026

The default fixed-perspective wool view reuses the original detailed building sheets. The optional free 3D view keeps projected textile volumes. Two new transparent atlases, `wool-worker-directions.png` and `wool-truck-directions.png`, have eight columns of facing directions and four rows of actual poses. Each is 1774×887 pixels. The truck received a background-extraction pass preserving the grid. `wool-felt-material.png` is a generated ivory needle-felt macro material tinted at runtime and projected onto the volumetric faces. All assets were produced using the built-in image generation tool, with no external stock assets.

Worker prompt: one identical turquoise-suited, ochre-hooded wool worker with cream goggles and a backpack; eight facing directions from right clockwise around the screen, four walk-cycle rows; transparent RGBA, equal cells, full-body fixed baseline, handmade fibers and stitched seams.

Truck prompt: one identical six-wheel turquoise and ochre wool freight truck; eight facing directions and four rolling poses, fixed body and moving wheels/suspension; transparent RGBA, equal cells and baseline. The extraction pass removed only gray backdrop/halos.

Material prompt: seamless, evenly lit ivory needle-felt macro tile, dense tiny organic interlocking fibers and subtle strands, no scene, labels, objects or shadows; grayscale-compatible for runtime tinting.

## Readable ore seams

`public/art/wool-ore-deposits.png` is a two-cell transparent original atlas generated with the built-in image tool: left iron outcrop in charcoal/silver felt with embroidered silver veins, right copper outcrop in rust/orange felt with bright copper veins and small teal patina seams; identical scale, overhead three-quarter view, low oval silhouettes, detailed wool fibers, no text, buildings or floor. These static outcrops replace the procedural cylinders in the illustrated view.
