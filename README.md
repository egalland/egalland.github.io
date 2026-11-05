# Projets d’Emmanuel

Le [portfolio d’Emmanuel](https://egalland.github.io/) présente un seul document HTML et un switch permanent Points / Curseurs / Glitch. Le choix active les moteurs d’animation correspondants sans rechargement ni remplacement du contenu. Le [calendrier Inktober 2026](https://egalland.github.io/inktober-2026/) donne accès aux applications, statistiques et dépôts sources.

## Organisation

- `index.html` : document unique, contenu actuel et switch de thème dans l’en-tête. Les descriptions, formulaires, états et ancres restent les mêmes pendant les changements.
- `portfolio-assets/portfolio.mjs` et `theme-manager.mjs` : choix mémorisé, chargement à la demande, composition Glitch et cycle de vie des moteurs.
- `portfolio-assets/themes/` : moteurs Points, Curseurs et Glitch, construction, formations et nettoyage des animations/écouteurs/éléments temporaires.
- `portfolio-assets/portfolio-content.mjs` : interactions communes, mini-démo Kikalmo, onglets, modale et copie du profil, initialisés une seule fois.
- `points/assets/` : ressources et polices du modèle original, conservées sans altération. `/points/` et `/curseurs/` redirigent vers le document commun, en préservant le thème et la section.
- `portfolio/content.json` : source commune des textes et liens extraits du commit `8e4a64746f8fd3e1354867cc92fdcb24292e6902`. `scripts/build-portfolio.mjs` génère la page commune depuis `portfolio/page.template.html`, les modules de contenu et les deux redirections de compatibilité.
- `inktober-2026/` : calendrier, registre des projets, statistiques et leurs sources ; `/inktober/` reste aussi une adresse d’accès.
- Un dossier portant le nom du projet : version jouable ou accès à sa version serveur.
- Les anciens noms et les numéros de jours : raccourcis vers les adresses nommées, pour conserver les liens partagés.
- `arrival/` : introduction du calendrier ; `tests/` : contrôles du calendrier et des routes.
- `elec/` : configurateur pédagogique de tableau électrique en 3D ([démo](https://egalland.github.io/elec/), [sources et historique](https://github.com/egalland/elec)).
- `redim/` et `livre/` : outils autonomes ; `kikalmo/` : accès au jeu multijoueur hébergé ; `sans-voyelles/` : ancienne adresse conservée.

## Applications

| Jour | Application | Accès | Hébergement | Sources |
|---|---|---|---|---|
| 01 | One More Thing | [/one-more-thing/](https://egalland.github.io/one-more-thing/) | GitHub Pages | [egalland/one-more-thing](https://github.com/egalland/one-more-thing) |
| 02 | Le Reliquaire | [https://inktober-2026.emmanuel-galland117.chatgpt.site/reliquaire/](https://inktober-2026.emmanuel-galland117.chatgpt.site/reliquaire/) | Serveur externe | [egalland/le-reliquaire](https://github.com/egalland/le-reliquaire) |
| 03 | Micro · Habitudes | [/micro-habitudes/](https://egalland.github.io/micro-habitudes/) | GitHub Pages | [egalland/micro-habitudes](https://github.com/egalland/micro-habitudes) |
| 04 | Cactocalypse | [/cactocalypse/](https://egalland.github.io/cactocalypse/) | GitHub Pages | [egalland/cactocalypse](https://github.com/egalland/cactocalypse) |
| 05 | Ghost Slap | [/ghost-slap/](https://egalland.github.io/ghost-slap/) | GitHub Pages | [egalland/ghost-slap](https://github.com/egalland/ghost-slap) |
| 06 | Le garde du pont | [/le-garde-du-pont/](https://egalland.github.io/le-garde-du-pont/) | GitHub Pages | [egalland/le-garde-du-pont](https://github.com/egalland/le-garde-du-pont) |
| 07 | Panique | [/panique/](https://egalland.github.io/panique/) | GitHub Pages | [egalland/panique](https://github.com/egalland/panique) |
| 08 | Carnet du compost | [/carnet-du-compost/](https://egalland.github.io/carnet-du-compost/) | GitHub Pages | [egalland/carnet-du-compost](https://github.com/egalland/carnet-du-compost) |
| 09 | ASTRE BRUT | [/astre-brut/](https://egalland.github.io/astre-brut/) | GitHub Pages | [egalland/astre-brut](https://github.com/egalland/astre-brut) |
| 10 | Archives du Voile | [/archives-du-voile/](https://egalland.github.io/archives-du-voile/) | GitHub Pages | [egalland/archives-du-voile](https://github.com/egalland/archives-du-voile) |
| 12 | La fronde de Cthulhu | [/la-fronde-de-cthulhu/](https://egalland.github.io/la-fronde-de-cthulhu/) | GitHub Pages | [egalland/la-fronde-de-cthulhu](https://github.com/egalland/la-fronde-de-cthulhu) |
| 13 | Priorités fragiles | [/priorites-fragiles/](https://egalland.github.io/priorites-fragiles/) | GitHub Pages | [egalland/priorites-fragiles](https://github.com/egalland/priorites-fragiles) |
| 14 | Dames de porcelaine | [/dames-de-porcelaine/](https://egalland.github.io/dames-de-porcelaine/) | Serveur externe | [egalland/dames-de-porcelaine](https://github.com/egalland/dames-de-porcelaine) |
| 15 | Petites victoires | [/petites-victoires/](https://egalland.github.io/petites-victoires/) | GitHub Pages | [egalland/petites-victoires](https://github.com/egalland/petites-victoires) |
| 16 | Pas maladroits | [/pas-maladroits/](https://egalland.github.io/pas-maladroits/) | GitHub Pages | [egalland/pas-maladroits](https://github.com/egalland/pas-maladroits) |
| 19 | Labyrinthe mouvant | [/labyrinthe-mouvant/](https://egalland.github.io/labyrinthe-mouvant/) | GitHub Pages | [egalland/labyrinthe-mouvant](https://github.com/egalland/labyrinthe-mouvant) |
| 21 | Atelier Héros | [/atelier-heros/](https://egalland.github.io/atelier-heros/) | GitHub Pages | [egalland/atelier-heros](https://github.com/egalland/atelier-heros) |
| 22 | Innsmouth — Le port oublié | [/phare/](https://egalland.github.io/phare/) | GitHub Pages | [egalland/egalland.github.io](https://github.com/egalland/egalland.github.io) |

## Sauvegardes et hébergement

Atelier Héros et Priorités fragiles fonctionnent sur GitHub Pages avec une sauvegarde locale. Pour récupérer les données de leur ancienne adresse ChatGPT, exporter puis importer le fichier JSON dans la nouvelle version. Aucun transfert automatique entre origines.

Le Reliquaire, Dames de porcelaine et Kikalmo utilisent un serveur pour leurs données ou salons partagés. Une page GitHub qui redirige vers eux ne constitue pas un hébergement autonome du jeu.

## Statistiques

Les durées et tarifs sont dans `inktober-2026/calendar.json`. Les estimations complétées le 23 octobre sont justifiées dans `inktober-2026/metrics-sources.json`. Les coûts sont des valorisations indicatives à 35 €/h et 40 €/h, pas des factures ou une économie mesurée. Les deux nouvelles estimations Atelier Héros et Innsmouth ont une confiance faible.

## Vérification

```sh
node tests/check-calendar.mjs
node tests/check-routes.mjs
```

Les dépôts sources conservent leur historique. Les archives `source-history/atelier-heros.bundle` et `source-history/priorites-fragiles.bundle` contiennent aussi tous leurs commits, auteurs et dates, récupérables avec `git clone <archive.bundle>`. La publication du contenu Pages passe par un commit d’intégration via la connexion GitHub ; le push Git natif n’était pas authentifié.

## Historique du portfolio

Les huit commits disponibles du portfolio d’origine sont conservés exactement dans `source-history/portfolio-cursors.bundle`, avec leurs auteurs, dates, parents et identifiants Git. Le détail et les commandes de restauration figurent dans `source-history/portfolio-cursors.md`. La publication Pages est un commit d’intégration via la connexion GitHub, car le push Git natif n’est pas authentifié. Aucun commit antérieur n’a été reconstruit ou inventé.


## Cartographie Market Plus

La carte réelle des composants et de leurs dépendances est disponible à part sur [/map/](https://egalland.github.io/map/) : 259 composants, 925 liaisons, filtres par famille, recherche et fiches de dépendances. Elle reprend la vue « Explorer le code » de Point marché, avec son moteur Three.js et une projection 2D de secours. Les références et les quatre étapes de source disponibles sont conservées dans `map/SOURCE.md` et `map/source-history.patch`.

L’accueil conserve la présentation de Market Plus et son aperçu schématique, sans carte embarquée ni lien vers l’outil interne. Les dates du parcours et les autres sous-sites sont préservés.

## Thèmes du portfolio

Pour changer le contenu, modifier `portfolio/content.json`, puis exécuter :

```sh
node scripts/build-portfolio.mjs
node --test tests/portfolio-*.test.mjs
```

Le switch conserve le document, la saisie, les états des démonstrations et la position de lecture. Le choix est mémorisé et partageable avec `?theme=points`, `?theme=curseurs` ou `?theme=glitch`. Sans JavaScript, le document reste lisible et ses liens restent accessibles.

Points dessine les formations dans les emplacements des aperçus et conserve le déplacement continu de la matière. Curseurs assemble les fenêtres, écrit puis positionne le contenu au défilement. Glitch dispose de sa propre composition : une fracture oblique irrégulière révèle le monde clair des points à travers le monde sombre des curseurs. Onze objets partagent une géométrie unique, rendue en tracés continus d’un côté et en particules de l’autre. Les petites fenêtres entrent après l’ouverture ; un décalage de fragments de l’image accompagne brièvement la déchirure, sans texture de papier, secousse globale ni clignotement répété. Le registre charge ce moteur seul ; ses sources visuelles sont Points et Curseurs. Ajouter un futur univers à la fusion demande un adaptateur de rendu explicite, sans dupliquer le contenu HTML.

Chaque moteur fournit une fonction d’arrêt : boucle d’animation, écouteurs, sélections, transformations et éléments temporaires sont nettoyés. Un chargement devenu obsolète ne lance aucun moteur. La préférence de mouvement réduit est respectée ; les animations s’arrêtent lorsque l’onglet est masqué. Les unités déjà construites restent mémorisées et les fenêtres contenant une saisie ne recommencent pas leur agrandissement. Glitch garde également les apparitions déjà vues : revenir en arrière ne déclenche pas à nouveau la déchirure. Les aperçus Market Plus et la mini-démo Kikalmo restent accessibles par un bouton sur leurs scènes ; ouvrir ou fermer la fusion conserve leur état et leur saisie.

Aucune application existante n’est déplacée : les arbres Git de `/inktober/`, `/inktober-2026/`, `/livre/`, `/redim/`, `/elec/`, `/map/` et de tous les autres sous-sites sont conservés. L’accès à l’outil Market Plus interne demeure absent ; son bouton ouvre uniquement la carte publique des composants.

Les huit commits disponibles du modèle Points sont conservés dans les parties `source-history/portfolio-points.bundle.b64.*`, avec leurs auteurs, dates, identifiants et parents. Leur intégrité est testée. La publication conserve l’historique GitHub existant ; aucun commit passé n’est reconstruit. Voir `source-history/portfolio-points.md`.

Validation : dix-huit tests de contenu, routes, sélection des moteurs, courses entre chargements, nettoyage, réduction des mouvements, géométrie de la fracture, durée bornée de la rupture et intégrité des ressources. Contrôle navigateur bureau et vues mobiles de 390 et 320 px : absence de débordement, bascule entre les trois modes, saisie conservée et mini-démo fonctionnelle sur petit écran. Contrôle du moteur à mouvement réduit : un rendu initial puis arrêt de la boucle. Un téléphone physique reste à contrôler.

### Moteur de fusion

- `portfolio-assets/themes/fracture.mjs` : frontière irrégulière déterministe, interpolation de la coupe, projection et phases d’arrivée.
- `portfolio-assets/themes/fusion-shapes.mjs` : géométries communes des onze objets et échantillonnage sur leurs segments.
- `portfolio-assets/themes/glitch.mjs` : masque partagé, construction, points, curseurs, découpes locales de l’image, interactions et nettoyage.
- `portfolio-assets/glitch.css` : composition dédiée, grille mobile, contrôle des aperçus et conservation des interfaces interactives.

Le rendu vise 30 images/s, limite la densité à 2 800 points par objet sur petit écran (4 400 sur bureau) et ne dessine que les scènes visibles. Le navigateur arrête la boucle dans un onglet masqué et lorsqu’aucune scène n’est visible. Aucun nouveau service, image distante ou bibliothèque n’est nécessaire pour Glitch.
