# Inktober 2026 · Le calendrier des ombres

Calendrier : https://egalland.github.io/ — copie accessible sur `/inktober-2026/`.

## Ouverture et mises à jour

Toutes les cases jusqu’au jour courant s’ouvrent automatiquement, à minuit dans le fuseau Europe/Paris. Avant octobre 2026, aucune case n’est ouverte ; après le 31 octobre, les 31 sont visibles. Le thème et les projets futurs restent masqués dans l’interface. Aucune action ni sauvegarde locale n’est nécessaire pour ouvrir les cases.

Le site est public et en lecture seule : aucune connexion, aucun jeton GitHub et aucune écriture depuis le navigateur. Les projets, descriptions, liens, statuts, durées et tarifs sont publiés via `inktober-2026/calendar.json` dans le dépôt. Les mises à jour du calendrier sont effectuées avec Codex puis déployées sur GitHub Pages. Le bouton **Actualiser les projets** recharge le fichier public. Les statistiques affichent les tarifs fixes : 35 €/h en Vibe Coding et 40 €/h en développement classique. Aucun onglet Paramétrage.

## Fond et mouvement

`atmosphere.css` et `parallax.js` définissent trois plans : paysage, brume et particules. Chacun se déplace à une vitesse différente pendant tout le défilement ; la souris ajoute une profondeur indépendante. Le traitement suit requestAnimationFrame, s’arrête lorsque les valeurs se stabilisent ou lorsque la page est masquée, et respecte prefers-reduced-motion. L’image WebP est chargée localement et ses chemins fonctionnent depuis les deux pages d’entrée.

## Vérifications

```sh
node tests/check-calendar.mjs
```

Les tests vérifient l’ouverture automatique aux limites de date parisiennes, le passage de minuit sans rechargement, l’absence de connexion et d’écritures, les liens et statistiques, le rechargement des projets et les mouvements du fond.

## Projets intégrés

Les six projets des jours 1, 3, 4, 5, 6 et 7 sont publiés directement sous `/pomme/`, `/miniature/`, `/cactus/`, `/claque/`, `/ogre/` et `/panique/`. Les liens « Ouvrir l’app » et « Voir le code » sont publics dans les cases et leurs fenêtres. `projects.json` précise le dépôt et le commit source de chaque version. Les apps sont des copies statiques ; leurs dépôts gardent leurs sources et leur historique. Les futures mises à jour doivent être construites et recopiées ici avant publication.

Micro · Habitudes utilise sa version Pages avec stockage local vérifié, export/import JSON et aucun serveur. Une sauvegarde Sites existante peut être exportée puis importée ; elle n’est pas copiée automatiquement. Les temps des six apps sont des estimations ajoutées le 8 octobre ; les durées inconnues des autres cases restent vides. Les dossiers `/redim/` et `/livre/` sont conservés sans modification.

## Estimations des temps et coûts

Les valeurs Vibe Coding centrales sont les milieux des fourchettes discutées, arrondis à la minute : 180, 90, 135, 135, 68 et 33 minutes. Aucun découpage fictif entre utilisateur et ChatGPT : les deux champs historiques restent inconnus, `vibeMinutes` contient le total estimé (conception, prompts, génération, tests, corrections). Hors intégration au calendrier. Les bornes sont conservées en minutes et visibles dans le détail et les statistiques.

| App | Vibe Coding | Dev classique équivalent | Hypothèse de périmètre classique |
|---|---|---|---|
| One More Thing | 2–4 h, centre 3 h | 60–100 h, centre 80 h | Économie, recherches, progression, produits, prestige, sauvegarde, interface mobile et tests |
| Micro · Habitudes | 1–2 h, centre 1 h 30 | 12–24 h, centre 18 h | Habitudes, grilles annuelles, séries, sauvegarde locale et import/export |
| Cactocalypse | 1 h 30–3 h, centre 2 h 15 | 55–95 h, centre 75 h | Combat, personnages, mutations, objets, trois mondes et boss, animations et tests |
| Ghost Slap | 1 h 30–3 h, centre 2 h 15 | 24–48 h, centre 36 h | Jeu tactile, suivi mains/visage avec MediaPipe, caméra, worker, scores et tests mobiles |
| Le garde du pont | 45 min–1 h 30, centre 1 h 08 | 8–16 h, centre 12 h | Dialogues, ressources, cinq fins, interface, sauvegarde et import/export |
| Panique | 20–45 min, centre 33 min | 3–6 h, centre 4 h 30 | Effets visuels et audio, scénarios aléatoires, clavier et remise à zéro |

Les fourchettes classiques sont des estimations de réalisation manuelle du même périmètre, avec intégration des assets disponibles et bibliothèques existantes. Elles ne proviennent pas d’un multiplicateur fixe, ne constituent ni devis ni chronométrage et excluent la création artistique originale, les abonnements et l’hébergement. Les coûts utilisent les valeurs centrales × tarifs horaires, arrondis au centime par app. Total central : 641 min (10 h 41), 13 530 min (225 h 30), 373,92 € et 9 020 €. Les totaux sont des sommes de scénarios, pas un temps réel observé ni une économie démontrée.
