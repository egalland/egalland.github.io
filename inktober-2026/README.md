# Inktober 2026 · Le calendrier des ombres

Calendrier : https://egalland.github.io/ — copie accessible sur `/inktober-2026/`.

## Ouverture et mises à jour

Toutes les cases jusqu’au jour courant s’ouvrent automatiquement, à minuit dans le fuseau Europe/Paris. Avant octobre 2026, aucune case n’est ouverte ; après le 31 octobre, les 31 sont visibles. Le thème et les projets futurs restent masqués dans l’interface. Aucune action ni sauvegarde locale n’est nécessaire pour ouvrir les cases.

Le site est public et en lecture seule : aucune connexion, aucun jeton GitHub et aucune écriture depuis le navigateur. Les projets, descriptions, liens, statuts, durées et tarifs sont publiés via `inktober-2026/calendar.json` dans le dépôt. Les mises à jour du calendrier sont effectuées avec Codex puis déployées sur GitHub Pages. Le bouton **Actualiser les projets** recharge le fichier public. Les statistiques et les tarifs restent consultables.

## Fond et mouvement

`atmosphere.css` et `parallax.js` définissent trois plans : paysage, brume et particules. Chacun se déplace à une vitesse différente pendant tout le défilement ; la souris ajoute une profondeur indépendante. Le traitement suit requestAnimationFrame, s’arrête lorsque les valeurs se stabilisent ou lorsque la page est masquée, et respecte prefers-reduced-motion. L’image WebP est chargée localement et ses chemins fonctionnent depuis les deux pages d’entrée.

## Vérifications

```sh
node tests/check-calendar.mjs
```

Les tests vérifient l’ouverture automatique aux limites de date parisiennes, le passage de minuit sans rechargement, l’absence de connexion et d’écritures, les liens et statistiques, le rechargement des projets et les mouvements du fond.

## Projets intégrés

Les six projets des jours 1, 3, 4, 5, 6 et 7 sont publiés directement sous `/pomme/`, `/miniature/`, `/cactus/`, `/claque/`, `/ogre/` et `/panique/`. Les liens « Ouvrir l’app » et « Voir le code » sont publics dans les cases et leurs fenêtres. `projects.json` précise le dépôt et le commit source de chaque version. Les apps sont des copies statiques ; leurs dépôts gardent leurs sources et leur historique. Les futures mises à jour doivent être construites et recopiées ici avant publication.

Micro · Habitudes utilise sa version Pages avec stockage local vérifié, export/import JSON et aucun serveur. Une sauvegarde Sites existante peut être exportée puis importée ; elle n’est pas copiée automatiquement. Les temps et tarifs absents ne sont pas estimés par l’intégration. Les dossiers `/redim/` et `/livre/` sont conservés sans modification.
