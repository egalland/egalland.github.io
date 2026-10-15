# Sans voyelles

Jeu multijoueur en français : retrouver des mots, titres de films, personnalités, lieux et animaux sans leurs voyelles.

- **Jouer** : https://egalland.github.io/sans-voyelles/
- **Site du jeu** : https://sans-voyelles.emmanuel-galland117.chatgpt.site/
- **Sources** : [`source/`](source/)

Le bouton « Sans voyelles » figure dans l’en-tête du calendrier, à côté de Redim et Livre. GitHub Pages redirige vers le jeu : les salons synchronisés nécessitent le serveur et la base D1 de la version Sites. L’accès au site est géré séparément ; la mise en public du code ne change pas l’accès au jeu.

## Règles

5 salons, 10 manches, 15 secondes de recherche puis 5 secondes de révélation illustrée. Si tous les joueurs présents ont trouvé, la révélation commence immédiatement. Une réponse rapporte de 1 000 à 100 points selon la rapidité. Les arrivées en cours sont autorisées. Un salon vide ne déclenche aucune boucle serveur ni tâche planifiée.

## Banque de réponses

2 000 réponses : 500 films, 500 personnalités, 500 lieux et 500 animaux. Le salon généraliste mélange les quatre thèmes. La sélection privilégie les références populaires et noms familiers ; méthode et sources dans [`source/data/BANK_SOURCES.md`](source/data/BANK_SOURCES.md). Les variantes usuelles sont acceptées et les illustrations disponibles sont préparées à l’avance.

## Profils

Pseudo et avatar personnalisables, sauvegardés dans le navigateur. Visage, cheveux, yeux, bouche, accessoire et couleur ; aléatoire pour chaque élément, pour le pseudo et pour tout mélanger. Les modifications en partie conservent le score.

## Architecture

TypeScript, React, Vinext / Vite, Cloudflare Workers et D1. Validation des réponses, chronomètre et points côté serveur ; écritures concurrentes protégées par un numéro de révision. Les réponses ne sont pas envoyées au navigateur avant la révélation. Illustrations depuis Wikipédia / Wikimedia Commons, avec lien vers les crédits et affichage de secours.

Les sources publiées correspondent à la version déployée `5ff78265dea90fa5d6b602a72fe152fb9caa6bca`. Aucun identifiant de déploiement, secret ou état de base de données n’est inclus.

## Développement

Le projet complet se trouve dans `source/`. Node.js récent (22.13 ou supérieur) et pnpm sont nécessaires. Depuis ce dossier :

```sh
pnpm install
pnpm dev
```

Déclarer et initialiser une base D1 pour tester le multijoueur. La migration figure dans `drizzle/`. Le manifeste `.openai/hosting.json` est volontairement fourni sans identifiant de projet ; créer son propre projet pour un nouveau déploiement.

Tests du moteur, des accès simultanés et des profils :

```sh
node tests/game.test.mjs
node tests/api.test.mjs
node tests/profile.test.mjs
node tests/countdown.test.mjs
node tests/bank.test.mjs
node tests/illustration.test.mjs
```

L’en-tête principal et la redirection sont hébergés dans le dépôt public `egalland/egalland.github.io`.
