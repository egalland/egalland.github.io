# Sans voyelles

Jeu multijoueur en français : retrouver des mots, titres de films, personnalités, lieux et animaux sans leurs voyelles.

- **Jouer** : https://egalland.github.io/sans-voyelles/
- **Site du jeu** : https://sans-voyelles.emmanuel-galland117.chatgpt.site/
- **Sources** : [`source/`](source/)

Le bouton « Sans voyelles » figure dans l’en-tête du calendrier, à côté de Redim et Livre. GitHub Pages redirige vers le jeu : les salons synchronisés nécessitent le serveur et la base D1 de la version Sites. L’accès au site est géré séparément ; la mise en public du code ne change pas l’accès au jeu.

## Règles

5 salons, 10 manches, 20 secondes de recherche puis 5 secondes de révélation illustrée. Si tous les joueurs présents ont trouvé, la révélation commence immédiatement. Un indice apparaît lorsqu’il reste 10 secondes. Le podium final dure une minute. Le vainqueur conserve une couronne pendant la partie suivante tant qu’il reste dans le salon. Une réponse rapporte de 1 000 à 100 points selon la rapidité. Les arrivées en cours sont autorisées. Un salon vide ne déclenche aucune boucle serveur ni tâche planifiée.

## Banque de réponses

2 000 réponses : 500 films, 500 personnalités, 500 lieux et 500 animaux. Le salon généraliste mélange les quatre thèmes. La sélection privilégie les références populaires et noms familiers ; méthode et sources dans [`source/data/BANK_SOURCES.md`](source/data/BANK_SOURCES.md). Les variantes usuelles sont acceptées et les illustrations disponibles sont préparées à l’avance.

## Réponses et chat

Les propositions apparaissent dans un fil commun. Les bonnes réponses sont remplacées par une annonce de réussite, sans révéler le mot. Dès qu’un joueur a trouvé, son champ devient un chat réservé aux joueurs ayant trouvé ; la révélation ouvre ces messages à tous. Les essais faux sont affichés en rouge et les essais proches en jaune, avec leur texte et un verdict public. Dix émotes publiques sont disponibles depuis le panneau des joueurs et apparaissent uniquement en bulles près des avatars : 👏 😂 🤔 🔥 🎉 ❤️ 👍 👎 🦆 🐶. Chaque émote possède un son synthétisé distinct, désactivable avec le bouton haut-parleur. Aucun délai ne limite les envois. Seule la réaction actuelle est conservée par personnage, sans historique ni message dans le chat. Les messages du chat portent une heure à la seconde. Sur ordinateur, trois panneaux de hauteur fixe placent le classement à gauche, le mot et l’affiche au centre, et le chat avec sa saisie à droite. Sur mobile, ces panneaux sont empilés avec des hauteurs réservées pour éviter les déplacements à la révélation. La saisie reste montée et active pendant les requêtes ; le texte est vidé à l’envoi et les réponses réseau ne suppriment pas le brouillon suivant. Le fil conserve les 100 derniers événements du salon, jusqu’à ce qu’il se vide.

Accents, espaces, ponctuation et ligatures œ/æ sont normalisés. Une faute (y compris une inversion) est tolérée à partir de 5 caractères normalisés, deux à partir de 12 ; les mots courts restent stricts. Une réponse voisine déclenche un signal public « Tu es proche ». Un autre nom exact de la même catégorie n’est pas validé comme faute de frappe.

## Profils

Pseudo et avatar personnalisables, sauvegardés dans le navigateur. Marionnettes en feutre composées de six catégories : visage, coiffure, yeux, bouche, accessoires et vêtements, plus dix couleurs. Choix visuels par vignettes et prévisualisation animée ; aléatoire pour chaque élément, pour le pseudo et pour tout mélanger. Les modifications en partie conservent le score. Les anciens profils sont migrés avec une tenue par défaut. Les yeux, les bouches et les poses du buste sont des images de sprite distinctes, assemblées en couches et animées sans transformation CSS du personnage. Les vignettes restent statiques ; les animations respectent le mouvement réduit et s’arrêtent lorsque l’onglet est caché. L’interface reprend le papier, le tissu et les coutures de l’atelier. Les affiches de réponse remplissent la place disponible sans déformation ni déplacement du chat. Les pièces sont recalées sur le même ancrage du nez pour toutes les poses, sans fragments de cellules voisines ; le nez repasse devant les yeux et le buste reste derrière la tête. Les rangées de choix partagent sept colonnes et des vignettes carrées. Détails dans [`source/data/PUPPET_ASSETS.md`](source/data/PUPPET_ASSETS.md).

## Architecture

TypeScript, React, Vinext / Vite, Cloudflare Workers et D1. Validation des réponses, chronomètre et points côté serveur ; écritures concurrentes protégées par un numéro de révision. Les réponses ne sont pas envoyées au navigateur avant la révélation. Illustrations depuis Wikipédia / Wikimedia Commons, avec lien vers les crédits et affichage de secours.

Les sources publiées correspondent à la version déployée `07110513cf9c4a9b24f113a4e088e1645ba8930a`. Aucun identifiant de déploiement, secret ou état de base de données n’est inclus.

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
node tests/puppet.test.mjs
node tests/countdown.test.mjs
node tests/chat.test.mjs
node tests/rounds.test.mjs
node tests/emote-sound.test.mjs
node tests/bank.test.mjs
node tests/illustration.test.mjs
```

L’en-tête principal et la redirection sont hébergés dans le dépôt public `egalland/egalland.github.io`.
