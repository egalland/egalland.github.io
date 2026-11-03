# Biscuit du jour — Inktober 2026, jour 30

Application statique en français inspirée du mot « Biscuit » : tirage de messages personnalisables façon biscuit surprise, avec illustration SVG vintage / flash tattoo.

## Accès

Site public : https://egalland.github.io/biscuit-du-jour/

`index.html` est une version HTML **totalement autonome**, sans dépendance externe. Les fichiers `src/main.js` et `src/styles.css` contiennent une copie lisible des scripts et styles inclus dans l'HTML.

## Fonctionnement

- Ouvrir le biscuit en cliquant sur le dessin ou le bouton de tirage.
- 12 messages initiaux sont des démonstrations ; ajout, modification et suppression possibles.
- Pas de répétition par défaut jusqu'à épuisement. L'option « Biscuits à volonté » autorise les doublons.
- Les données (messages, préférences, tirages) sont stockées localement dans le navigateur (localStorage, clé `biscuit-du-jour:v1`). Export/import JSON disponibles.
- Pas de compte, pas de serveur, pas de synchronisation entre appareils.

## Tests

La version source locale TypeScript V2 a passé la compilation TypeScript (`npm run build`), la vérification des types (`npm run typecheck`) et 5 tests Node (`npm test`) le 3 novembre 2026. Ces vérifications ne remplacent pas un test de sauvegarde sur le domaine HTTPS de production.

## Historique

Deux versions de livraison ont été récupérées : V1 autonome et V2 corrigée (dessin flash tattoo, script chargé après le DOM, adaptation mobile). **Le dépôt Git de travail d'origine n'était pas disponible.** Les commits de publication sont une reconstruction documentaire des livraisons, pas leurs SHA originaux ni des horodatages historiques. Aucun historique Git introuvable n'a été inventé.

Le code original TypeScript et les tests figurent dans le ZIP V2 de livraison de la conversation ; la version publiée dans ce dépôt expose la version JavaScript compilée.
