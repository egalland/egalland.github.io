# Atelier Héros

Générateur local de marionnettes super-héros en pied, en français. Site statique sans dépendances externes ni service de génération à connecter. Ouvrir via un serveur HTTP qui sert `dist/`.

## Fonctionnement

- Six visages, huit coiffures Kikalmo (dont chauve et mèche Titeuf), afro procédurale, six yeux, sept nez et sept accessoires.
- Corps à proportions variables : taille, largeur, musculature, jambes et tête. Combinaison et costume-cravate, cape et masque optionnels.
- Cinq vues du corps dessinées, trois orientations gauches par miroir. Les visages latéraux sont des compositions 2D adaptées des pièces originales ; il ne s’agit pas d’un modèle 3D.
- Huit expressions. PNG avec alpha jusqu’à 2048 × 2560 px, GIF à palette adaptative, ZIP stocké avec CRC32, 16 PNG + planche + réglages + animation.
- État et collection conservés dans localStorage (clés atelier-heros-v1 et atelier-heros-collection-v1). Import/export JSON pour transfert entre navigateurs.
- Respect de prefers-reduced-motion, navigation clavier, labels, états de chargement/échec, lien de téléchargement persistant après génération.

## Sources graphiques

Les fichiers `dist/assets/puppets`, registration et morphologies proviennent du projet Kikalmo, copie locale du dépôt egalland/kikalmo du 21 octobre 2026. Ils sont conservés pour réutiliser les visages et accessoires déjà créés.

Les dix corps ont été créés avec l’outil image_gen intégré, puis découpés en WebP dans `dist/assets/body-*.webp`. Prompt : atlas transparent 5 colonnes × 2 lignes, marionnettes en feutrine sans tête, cinq directions (face, 3/4 avant droit, profil droit, 3/4 dos droit, dos), première ligne combinaison bleue avec bottes et ceinture, seconde ligne bodybuilder massif en costume anthracite à rayures, chemise blanche et cravate bordeaux. Pas de cape dans l’atlas ; celle-ci est dessinée par le moteur. Les couleurs et proportions sont adaptées au rendu sans nouvelle génération distante.

## Vérification

Vérification de syntaxe de tous les modules, parcours navigateur (silhouette, orientations, sauvegarde, collection, export), décodage des huit images du GIF par Pillow et vérification du format ZIP, des CRC32 et des données par Python (téléchargement ZIP non récupérable dans le navigateur de prévisualisation HTTP). Vérification mobile via iframe à largeur 390 px, sans dépendance de test livrée.
