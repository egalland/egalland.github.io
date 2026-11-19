# Les Banars — Rencontre du troisième fruit

Un court film interactif en français, inspiré d’un souvenir de Gartic Phone : quatre canards-bananes sont enlevés par une soucoupe verte, puis dansent avec son pilote bleu.

Les quatre créatures ont des silhouettes distinctes — petit trapu, grand élancé, rond et personnage à huppe — et leurs propres rythmes. Le pilote regarde vers la droite, dans le sens du départ. Il tient le volant pendant l’approche et le départ, puis rejoint la danse en vol stationnaire.

## Animation articulée

Chaque personnage possède des pièces photoréalistes séparées : corps, tête, mandibule, bras de peau de banane, segments de jambes et pieds. Ces pièces pivotent autour de leurs articulations ; aucun maillage ne déforme l’image complète du personnage.

- Marche avec pieds de profil orientés dans le sens du déplacement, appuis fixes, pas courts et faible levée des pieds. La cadence varie selon le personnage. Les phases de départ et d’arrêt commencent et finissent sur deux pieds posés ; les pieds ne sont pas interpolés vers une pose de repos, ce qui produisait un glissement. Le corps transfère son poids, la tête compense légèrement et les jambes se raccordent par cinématique inverse sous le corps.
- Becs articulés avec des séquences de parole décalées, mouvements de tête et bras indépendants.
- Quatre danses avec des rythmes, amplitudes, mouvements de bras et appuis différents. Les pieds posés restent fixes et au moins un pied porte le corps pendant les pas dansés.
- Un même alien articulé passe de la conduite à la danse en plusieurs étapes : il lâche le volant, range sa console, se lève puis danse. Au retour, il se rassoit, attend le retour de la console puis reprend le volant. Les formes de mains se raccordent progressivement. Les banars continuent à danser pendant la reprise du pilotage.
- Verrière fermée : parois courbes, reflets et collier métallique continu entre le verre et la coque, y compris sur les côtés.
- Échelle du vaisseau constante et caméra sans zoom automatique. L’arrivée, l’enlèvement, la fête et le départ gardent le même cadrage large.

## Rendu

Images photoréalistes générées et compositées en plusieurs plans : paysage nocturne, reflets, personnages articulés, coque métallique, verrière, brume, lumière et particules. Il s’agit d’une animation 2D articulée, pas de modèles 3D complets. WebGL 2 est utilisé lorsqu’il est disponible, avec un rendu Canvas 2D de secours.

Le réglage 4K porte le rendu du canvas à 3840 × 2160 en paysage et à une hauteur de 3840 pixels en portrait, en préservant le format de l’écran. Les textures générées possèdent leurs propres résolutions natives ; elles ne sont pas présentées comme des prises de vue natives en 4K.

## Commandes et vérifications

Lecture/pause, reprise au début, chronologie, chapitre suivant, plein écran et réglages de définition, de lumière et de profondeur. Les réglages sont conservés dans le navigateur. Les préférences de réduction des mouvements suspendent la lecture automatique.

Le site est statique et autonome dans `dist/`, sans service externe à connecter.

```sh
node --check dist/app.js
node --check dist/rigs.mjs
node --check dist/canopy.mjs
node --test tests/animation.test.mjs
```

Les huit tests vérifient les longueurs des articulations, les appuis fixes au sol au départ et à l’arrêt, le contact jambes-chevilles, la faible rotation des pieds, les appuis pendant la danse, l’ordre des gestes du pilote, l’échelle constante du vaisseau et les ouvertures des becs. La scène est aussi vérifiée visuellement sur ordinateur et dans un cadre portrait de 390 × 844 pixels, ainsi qu’avec le réglage 4K paysage.
