# Le Reliquaire englouti

Un jeu isométrique où chaque maison construit son château et lance des raids. Le client, les décors, le moteur de combat et le serveur sont inclus.

Avec Node.js 22.13 ou supérieur, exécuter `npm run build` puis `npm run dev`. Ouvrir `http://localhost:4173` après le démarrage. Le développement local utilise SQLite. Le déploiement utilise un Worker et une base D1 nommée `DB`, initialisée avec `drizzle/0000_castles.sql`.
