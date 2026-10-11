# Emmanuel Galland — landing animée

Version personnelle, statique et autonome de l’animation d’arrivée créée à partir de la vidéo de référence. Elle se trouve à `/landing/`, avec un lien dans l’en-tête du calendrier à la racine et à `/inktober-2026/`.

L’arrivée dure 3,744 secondes : les illustrations d’Inktober et d’Archives du Voile se révèlent successivement au centre du fond bleu, puis le rideau remonte. Le texte « Créer. Explorer. » défile derrière l’image. Le menu permet de rejouer la séquence.

Le bouton « Mes projets » ouvre une sélection de projets déjà publiés, avec accès direct à Redim, Livre et au calendrier. La composition s’adapte au mobile et respecte la préférence de réduction des animations.

Fichiers : `index.html`, `styles.css`, `arrival.js`. Aucun serveur, compte, dépendance ou build n’est nécessaire. Les illustrations sont servies depuis leurs chemins déjà présents dans le dépôt. Les liens d’apps utilisent les routes GitHub Pages existantes.

Validation : syntaxe JavaScript, liens et fichiers, et absence de contexte d’empilement masquant les images de l’introduction. Aucun navigateur de vérification pris en charge n’était disponible lors de cette édition.
