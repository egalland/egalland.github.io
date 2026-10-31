# Inktober 2026 · Le calendrier des ombres

Calendrier : https://egalland.github.io/ — copie accessible sur `/inktober-2026/`.

## Ouverture et mises à jour

Toutes les cases jusqu’au jour courant s’ouvrent automatiquement, à minuit dans le fuseau Europe/Paris. Avant octobre 2026, aucune case n’est ouverte ; après le 31 octobre, les 31 sont visibles. Le thème et les projets futurs restent masqués dans l’interface. Aucune action ni sauvegarde locale n’est nécessaire pour ouvrir les cases.

Le site est public et en lecture seule : aucune connexion, aucun jeton GitHub et aucune écriture depuis le navigateur. Les projets, descriptions, liens, statuts, durées et tarifs sont publiés via `inktober-2026/calendar.json` dans le dépôt. Les mises à jour du calendrier sont effectuées avec Codex puis déployées sur GitHub Pages. Le fichier public est chargé à chaque ouverture ; le bouton d’actualisation a été retiré. Les statistiques affichent les tarifs fixes : 35 €/h en Vibe Coding et 40 €/h en développement classique. Aucun onglet Paramétrage.

## Fond et mouvement

`atmosphere.css` et `parallax.js` composent un décor inspiré des plans indépendants des Archives du Voile : trois images (paysage lointain, lisière de forêt, branches proches avec citrouilles), deux bancs de brume, lumière de lune et lueurs chaudes. Les images transparentes ont un centre vide pour laisser lire les tuiles. Des braises, feuilles et petites chauves-souris parcourent le décor, toujours derrière le contenu et sans capturer les interactions.

Chaque plan suit une profondeur différente au défilement et à la souris. Les mouvements autonomes lents sont séparés du parallax ; le traitement JavaScript ne tourne que pendant les transitions et s’arrête au repos. L’onglet masqué met aussi les animations CSS en pause. Sur mobile, le nombre de particules est divisé par deux et les images sont cadrées pour garder une lisière visible de chaque côté. `prefers-reduced-motion` coupe les mouvements, la brume et les particules, et conserve le décor fixe. Chaque image est décodée séparément : un fichier décoratif manquant n’empêche ni le chargement ni l’utilisation du calendrier.

Les trois plans totalisent environ 1,2 Mo en WebP ; aucun service externe ni son n’est ajouté. L’introduction photographique existante reste indépendante. Les chemins absolus des images fonctionnent depuis les deux pages d’entrée.

## Vérifications

```sh
node tests/check-calendar.mjs
```

Les tests vérifient l’ouverture automatique aux limites de date parisiennes, le passage de minuit sans rechargement, l’absence de connexion et d’écritures, les liens et statistiques, le rechargement des projets et les mouvements du fond.

## Projets intégrés

Les six projets des jours 1, 3, 4, 5, 6 et 7 sont publiés directement sous `/one-more-thing/`, `/micro-habitudes/`, `/cactocalypse/`, `/ghost-slap/`, `/le-garde-du-pont/` et `/panique/`. Les liens « Ouvrir l’app » et « Voir le code » sont publics dans les cases et leurs fenêtres. `projects.json` précise le dépôt et le commit source de chaque version. Les apps sont des copies statiques ; leurs dépôts gardent leurs sources et leur historique. Les futures mises à jour doivent être construites et recopiées ici avant publication.

Micro · Habitudes utilise sa version Pages avec stockage local vérifié, export/import JSON et aucun serveur. Une sauvegarde Sites existante peut être exportée puis importée ; elle n’est pas copiée automatiquement. Les temps des six apps sont des estimations ajoutées le 8 octobre ; les compléments du 23 octobre et leurs sources sont détaillés plus bas. Les dossiers `/redim/` et `/livre/` sont conservés sans modification.

## Durées et coûts

Le Vibe Coding affiche une durée unique par app, sans fourchette, dans les statistiques et les cases. `vibeMinutes` conserve cette durée en minutes. `vibeBasis` distingue `estimated` des durées reconstituées à partir des sessions (`session_elapsed`). Pour ces dernières, `vibeObservedSeconds` conserve la durée écoulée avant arrondi à la minute. Les valeurs existantes restent des estimations lorsqu’aucun suivi exact n’a été retrouvé : supprimer une fourchette ne transforme pas une estimation en mesure. Aucun découpage fictif entre utilisateur et ChatGPT : les deux champs historiques restent inconnus.

Les coûts utilisent les minutes affichées × tarif horaire, arrondis au centime par app. Ils valorisent des heures à 35 €/h et 40 €/h, sans représenter des dépenses payées ni une économie démontrée.

| Jour / app | Vibe Coding affiché | Origine | Dev classique équivalent |
|---|---|---|---|
| 01 · One More Thing | 3 h | Estimation antérieure | 80 h · 60–100 h |
| 02 · Le Reliquaire | 59 min | Session retrouvée : 58 min 51 s | 120 h · 80–160 h |
| 03 · Micro · Habitudes | 1 h 30 | Estimation antérieure | 18 h · 12–24 h |
| 04 · Cactocalypse | 2 h 15 | Estimation antérieure | 75 h · 55–95 h |
| 05 · Ghost Slap | 2 h 15 | Estimation antérieure | 36 h · 24–48 h |
| 06 · Le garde du pont | 1 h 08 | Estimation antérieure | 12 h · 8–16 h |
| 07 · Panique | 33 min | Estimation antérieure | 4 h 30 · 3–6 h |
| 08 · Carnet du compost | 31 min | Trois sessions retrouvées : 31 min 01 s | 12 h · 8–16 h |
| 09 · ASTRE BRUT | 1 h 30 | Estimation antérieure | 16 h · 12–20 h |
| 10 · Archives du Voile | 6 h | Estimation antérieure | 80 h · 60–100 h |

### Sessions retrouvées des jours 2 et 8

- Reliquaire : 8 octobre 2026, 15:34:24Z à 16:33:15Z, soit 3 531 secondes. Création/tests/publication du Site dans la session identifiée. La conception antérieure et les actions non tracées ne sont pas ajoutées.
- Compost : création 14:07:46Z à 14:23:32Z (946 s), build HTML 14:46:08Z à 14:51:28Z (320 s), publication 19:54:08Z à 20:04:03Z (595 s), toutes le 8 octobre 2026. Total : 1 861 secondes. Les intervalles entre les trois sessions sont exclus.

Ces horodatages viennent des échanges retrouvés. Ils décrivent des durées écoulées, incluant l’attente à l’intérieur d’une session ; ce ne sont pas des chronométrages du temps actif utilisateur ou du temps processeur ChatGPT, ni une garantie d’exhaustivité de l’effort sur le projet.

### Estimations développeur des jours 2 et 8

Reliquaire : valeur centrale de 120 h pour une réalisation manuelle du même périmètre, avec une fourchette de 80–160 h. Périmètre lu dans le dépôt source : client React/TypeScript, serveur Worker, D1 et R2, autorisations maître/capitaines, GPS, équipes, scores et délais, messagerie, galerie photo, exports et tests d’intégration. Ce n’est pas un multiplicateur du temps IA.

Compost : valeur centrale de 12 h, fourchette de 8–16 h, pour le journal CRUD, contrôles datés et cas limites, sauvegarde locale vérifiée, import/export, adaptation mobile, accessibilité, build autonome et tests du carnet. La version serveur optionnelle ne fait pas partie de la publication Pages.

## Revue du 23 octobre 2026

Les quatre statistiques auparavant absentes sont renseignées comme **estimations** dans `calendar.json`. `metrics-sources.json` conserve leur origine, leur périmètre et les limites des horodatages retrouvés. Aucune durée de commit ni fenêtre entre deux messages n’est présentée comme du temps actif. Atelier Héros et Innsmouth ont de nouvelles estimations de confiance faible ; leurs coûts restent indicatifs.

| Projet | Vibe Coding estimé | Dev manuel estimé |
|---|---:|---:|
| Pas maladroits | 38 min (ancienne fourchette 30–45 min) | 8 h · 6–10 h |
| Labyrinthe mouvant | 38 min (ancienne fourchette 30–45 min) | 8 h · 6–10 h |
| Atelier Héros | 2 h, confiance faible | 40 h · 24–64 h |
| Innsmouth | 3 h, confiance faible | 32 h · 16–48 h |

Les totaux sont calculés depuis l’ensemble du calendrier et sont contrôlés par les tests. Ils combinent des estimations et des durées de sessions partielles ; ils ne mesurent ni une dépense, ni un gain de productivité, ni un temps actif total.

Atelier Héros et Priorités fragiles sont publiés en statique, sans dépendance au serveur ChatGPT. Le stockage reste local au navigateur et à l’origine : l’export/import JSON est nécessaire pour transférer les données de l’ancienne adresse. Les versions Sites existantes restent disponibles.

Les noms des dossiers correspondent désormais aux dépôts sources. Les anciens noms (`pomme`, `miniature`, etc.) et les numéros des jours publiés sont des redirections conservant les paramètres et l’ancre. `projects.json` répertorie tous les projets publiés et indique leur hébergement. Le Reliquaire, Dames de porcelaine et Kikalmo restent sur leur serveur pour leurs fonctions partagées.

Les historiques complets des deux dépôts nouvellement intégrés sont conservés dans `source-history/*.bundle`, avec leurs commits, dates et auteurs d’origine. Le contenu Pages est publié par un commit d’intégration via la connexion GitHub, car le push Git natif n’est pas authentifié dans cet environnement. Les archives permettent de retrouver exactement les graphes sources ; elles ne sont pas une reconstruction de commits. Les builds statiques sont copiés dans leurs dossiers nommés ; les dépôts sources restent les références pour les évolutions.

## Jour 17 · ENGIN — Dispano Tycoon (31 octobre 2026)

Le jour 17 est renseigné dans le calendrier et les totaux : 35 min de Vibe Coding estimées (valorisation 20,42 € à 35 €/h), 64 h de développement manuel équivalent estimées (48–96 h ; valorisation centrale 2 560 € à 40 €/h). Ces chiffres ne sont pas des mesures de temps actif ni des dépenses réelles. La provenance et le périmètre sont détaillés dans `metrics-sources.json`.

Le jeu et son code complet sont hébergés par le dépôt public `egalland/engin-dispano`, avec GitHub Pages à `/engin-dispano/`. La route `/17/` redirige vers le jeu. Les deux versions de développement sont reprises séparément sur GitHub et l’historique original exact est conservé dans le bundle du dépôt source.
