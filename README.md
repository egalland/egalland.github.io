# ARDA — Atlas de la Terre du Milieu

Un atlas interactif des âges de Tolkien. On peut y explorer six panoramas illustrés, examiner les modèles d’architecture et suivre les trajets des personnages. Le rendu combine Three.js et un mode Canvas 2D. Ce projet de fans est indépendant des ayants droit.

## Lancer l’atlas

Les six panoramas sont accessibles dès le premier lancement, avant la préparation de la carte.

Les cartes se construisent localement à partir de 33 couches GeoJSON. Le dépôt contient le moteur, les scripts de préparation, les panoramas générés pour le projet et le grain de cuir original. Il faut fournir les données géographiques compatibles au premier démarrage.

1. Préparer une copie locale du projet **Arda Maps** ou un jeu de couches compatible. Le script lit l’organisation des fichiers `QGIS/first age/arda1`, `QGIS/second age/arda2` et `QGIS/third age/arda3`. [Données géographiques utilisées par la maquette](https://github.com/kwoxer/Arda-Maps)
2. Installer les dépendances avec `python -m pip install Pillow numpy scipy`.
3. Exécuter `python import_maps.py /chemin/vers/Arda-Maps`, puis `python prepare.py` et `python build_leather.py`. La préparation complète utilise des textures de 3072 pixels de large.
4. Vérifier les cartes avec `node check.mjs`. Pour contrôler aussi les modèles 3D, lancer `npm ci` puis `node check-architecture.mjs`.
5. Exécuter `python -m http.server 8000 --directory dist`, puis ouvrir `http://localhost:8000`.

Le JavaScript compilé est inclus. Après modification de `src/`, lancer `npm ci` puis `npm run build`. L’affichage utilise une famille de caractères disponible sur l’appareil. Les couches importées et les cartes calculées restent locales.

Les reliefs, territoires, trajets et distances sont des interprétations au service de l’exploration. Les descriptions du projet s’appuient sur les romans de Tolkien, *Le Silmarillion* et les appendices du *Seigneur des anneaux*. Les panoramas ont été créés pour cet atlas.
