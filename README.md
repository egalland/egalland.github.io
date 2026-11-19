# Configurateur de cuisine

Dessiner les murs, placer les équipements et calculer les matériaux pour une pièce. Le plan de départ est un exemple rectangulaire de 4,20 × 3,60 m. Les projets sont conservés par le navigateur.

## Démarrage

Utiliser Node.js 22.13 ou supérieur. Installer les dépendances avec `npm ci`, puis lancer `npm run dev:public`.

## Version statique

Construire avec `npm run build:public`. Le dossier `dist-public/` est prêt à servir avec un serveur HTTP, par exemple `python3 -m http.server --directory dist-public 8000`. Ouvrir `http://localhost:8000`.

## Version Worker

Le même composant d’édition sert également de page au Worker. Les commandes `npm run dev` et `npm test` utilisent la chaîne de construction Vinext. Le manifeste local définit les liaisons de stockage du projet de démonstration.
