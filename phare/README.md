# Innsmouth — Inktober 2026, jour 22 « Phare »

[Ouvrir la démo](https://egalland.github.io/phare/) · [Version Sites](https://phare-lumiere.emmanuel-galland117.chatgpt.site)


Le port est désormais un fond HD fixe sans brume. Seules les lettres réagissent au faisceau du phare. Déplacer la souris ou glisser le doigt pour guider la lumière ; maintenir pour resserrer le faisceau ; flèches au clavier. Balayage automatique, intensité et qualité réglables, son optionnel, sauvegarde locale des réglages.

## Images
Créées avec l’outil intégré Imagegen, sans images externes à charger :
- `dist/assets/innsmouth-port-hd.webp` — 1536 × 1024, cadrage bureau.
- `dist/assets/innsmouth-port-mobile-hd.webp` — 941 × 1672, composition portrait dédiée.
- Sources PNG dans `design-assets/`.

Brief de génération : peinture réaliste détaillée du port fictif d’Innsmouth en 1927 au clair de lune, maisons et quais lisibles, bateaux, fenêtres chaudes, phare à droite, mer dégagée sous la ville pour les lettres. Pas de brume, de texte ou de faisceau peint. Adaptation portrait avec recomposition de la même ville et du phare pour le téléphone. Une minuscule silhouette de Dagon reste intégrée à l’image au loin.

## Rendu
Three.js rend uniquement les lettres sur un canvas transparent. Le décor est une image HTML et ne reçoit aucun éclairage dynamique. Le faisceau graphique part de la lanterne, dont la position tient compte du recadrage de l’image ; sa proximité règle l’émission des lettres. Pas de fog, de particules ou de décor 3D. Mode Canvas 2D si WebGL indisponible, signalé à l’écran. Préférence de mouvement réduit respectée.

## Validation
Syntaxe et dépendances locales vérifiées. Fond et illumination des lettres inspectés dans le navigateur en mode 2D, sur bureau et dans un cadre mobile de 390 × 844. Balayage et réglages simplifiés contrôlés. Le navigateur QA désactive WebGL : le rendu Three.js réel reste à vérifier sur un appareil compatible. Aucun service externe à l’exécution. Police Pirata One sous SIL OFL dans `dist/vendor/OFL.txt`.

## Port animé
`harbor-motion.js` ajoute des ondulations limitées à l’eau et déforme doucement les reflets de l’image. La rive est fondue dans la source pour éviter une coupure ; les bâtiments et les lettres ne sont pas déformés. Les lumières de 40 fenêtres par cadrage varient lentement, sur des points issus des pixels chauds de chaque image (`window-lights.json`). Ces lueurs sont indépendantes du faisceau qui continue à éclairer uniquement les lettres. Le rendu est limité à 30 images/s et à un ratio de pixels de 1,5. Le bouton « Animations du port » conserve sa position après rechargement. Le mouvement réduit désactive ces animations automatiquement. Rendu et pause vérifiés dans le navigateur en mode 2D ; pas de nouvelle dépendance à WebGL.
