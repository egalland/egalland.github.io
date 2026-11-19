# Maille · L’atelier tricot

Atelier mobile en français pour préparer des vêtements, des accessoires, des ouvrages pour la maison ou une pièce libre. Cinq étapes relient le choix de l’ouvrage, les dimensions finies, les laines, le dessin et la préparation du tricot. Les 21 modèles et les 28 grilles sont intégrés à l’application.

Les dimensions pilotent les volumes Three.js. La texture de maille, les motifs de jacquard et le mélange de deux brins sont rendus localement. Sur les appareils sans WebGL, un moteur logiciel affiche les mêmes géométries avec textures et gestion de la profondeur. Le motif peut être placé au doigt, à la souris ou avec les flèches à l’écran.

Les pelotes sont estimées à partir de la surface, de l’échantillon, de la répartition physique des couleurs, du métrage indiqué sur chaque étiquette et des marges choisies. Les fils tenus ensemble sont comptés séparément. Une pesée de l’échantillon sec affine la fourchette. Pour le modèle Pull, le calcul utilise toutes les mailles du patron, y compris les deux manches et le col. Les autres ouvrages conservent leur fiche de préparation et leur grille de motif.

Le pull raglan se tricote à plat, du bas vers le haut. Le patron couvre le dos, le devant, les deux manches, les coutures du raglan, le col et les finitions. Chaque pièce a sa propre grille éditable. Les instructions, la texture 3D et les quantités par fil utilisent les mêmes mailles. Le suivi mémorise le prochain rang de chaque pièce. La fiche imprimable comprend les cinq diagrammes et les instructions de construction. Le lien `/#patron` ouvre le patron courant ou propose de choisir un pull dans le carnet.

Le carnet est conservé dans le navigateur. Les exports JSON permettent de transférer un ouvrage ou tout le carnet. Un ancien projet Maille est repris à la première ouverture, et les fichiers de la première version peuvent être importés.

## Développement

Les fichiers servis se trouvent dans `dist/`. Three.js 0.180.0 est fourni dans `dist/vendor/` avec sa licence. Le site fonctionne sans serveur de données ni CDN.

## Vérification

`node --test checks/*.mjs`
