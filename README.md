# Atelier Héros

Générateur local de marionnettes super-héros en pied, en français. Site statique sans dépendances externes ni service de génération à connecter. Ouvrir via un serveur HTTP qui sert `dist/`.

## Fonctionnement

- Six visages, huit coiffures Kikalmo (dont chauve et mèche Titeuf), afro procédurale, six yeux, sept nez et sept accessoires.
- Version 2 : sept morphologies réellement dessinées (fin, standard, rond, sportif, bodybuilder, petit trapu, grand longiligne). Dix sprites par morphologie : deux tenues × cinq directions, soit 70 corps. Aucune déformation non uniforme du corps ; seules l’échelle globale et la taille de tête sont ajustables.
- Cinq vues du corps dessinées, trois orientations gauches par miroir. Les visages latéraux sont des compositions 2D adaptées des pièces originales ; il ne s’agit pas d’un modèle 3D.
- Huit expressions. PNG avec alpha jusqu’à 2048 × 2560 px, GIF à palette adaptative, ZIP stocké avec CRC32, 16 PNG + planche + réglages + animation.
- État et collection conservés dans localStorage (clés atelier-heros-v1 et atelier-heros-collection-v1). Import/export JSON pour transfert entre navigateurs.
- Respect de prefers-reduced-motion, navigation clavier, labels, états de chargement/échec, lien de téléchargement persistant après génération.

## Sources graphiques

Les fichiers `dist/assets/puppets`, registration et morphologies proviennent du projet Kikalmo, copie locale du dépôt egalland/kikalmo du 21 octobre 2026. Ils sont conservés pour réutiliser les visages et accessoires déjà créés.

Les soixante-dix corps ont été créés avec l’outil image_gen intégré, puis découpés en WebP dans `dist/assets/body-*.webp` et `dist/assets/bodies/`. Prompt : atlas transparent 5 colonnes × 2 lignes, marionnettes en feutrine sans tête, cinq directions (face, 3/4 avant droit, profil droit, 3/4 dos droit, dos), première ligne combinaison bleue avec bottes et ceinture, seconde ligne bodybuilder massif en costume anthracite à rayures, chemise blanche et cravate bordeaux. Pas de cape dans l’atlas ; celle-ci est dessinée par le moteur. Les couleurs et proportions sont adaptées au rendu sans nouvelle génération distante.

## Vérification

Vérification de syntaxe de tous les modules, parcours navigateur (silhouette, orientations, sauvegarde, collection, export), décodage des huit images du GIF par Pillow et vérification du format ZIP, des CRC32 et des données par Python (téléchargement ZIP non récupérable dans le navigateur de prévisualisation HTTP). Vérification mobile via iframe à largeur 390 px, sans dépendance de test livrée.

## Évolution du format

Les sauvegardes et imports v1 sont acceptés. La silhouette v2 est choisie selon les anciennes valeurs de jambes, taille, musculature et largeur. Les nouvelles sauvegardes conservent `silhouette` explicitement et utilisent `version: 2`. Le stockage garde les mêmes clés pour retrouver les personnages existants.

## Validation de la version 2

70 fichiers WebP distincts vérifiés : toutes les combinaisons silhouette/tenue/angle existent, dimensions et ancres du cou correctes. Migration des sauvegardes v1 et format v2 testés via `node tests/body-state.test.mjs`. Parcours navigateur : fin, rond de profil, changement de tenue conservé, sauvegarde après rechargement et sélection mobile à 390 px. Export PNG 1024 × 1280 RGBA téléchargé et vérifié avec Pillow.
