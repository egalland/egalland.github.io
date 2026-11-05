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

Points dessine les formations dans les emplacements des aperçus et conserve le déplacement continu de la matière. Curseurs assemble les fenêtres, écrit puis positionne le contenu au défilement. Glitch déchire la page elle-même : quatre grandes zones irrégulières traversent le fond, les titres, les textes et les projets. Des sections entières appartiennent au monde clair des Points ou au monde sombre des Curseurs. Une seule frontière traverse aussi la vraie mini-démo Kikalmo : les mêmes lettres passent de HTML à particules, avec leurs positions de glyphes mesurées dans le document. La saisie reste accessible. Le registre charge l’orchestrateur Glitch, qui réutilise les curseurs dans les seules zones sombres. Un bref décalage du trait accompagne l’arrivée d’une nouvelle déchirure ; aucun effet n’est répété sur chaque aperçu et aucun contenu HTML n’est dupliqué.

Chaque moteur fournit une fonction d’arrêt : boucle d’animation, écouteurs, sélections, transformations et éléments temporaires sont nettoyés. Un chargement devenu obsolète ne lance aucun moteur. La préférence de mouvement réduit est respectée ; les animations s’arrêtent lorsque l’onglet est masqué. Les unités déjà construites restent mémorisées et les fenêtres contenant une saisie ne recommencent pas leur agrandissement. Glitch garde les apparitions déjà vues et conserve la saisie lors des changements de thème. Les fenêtres sombres sont directement utilisables ; le mode Curseurs conserve aussi l’aperçu interactif complet de Market Plus.

Aucune application existante n’est déplacée : les arbres Git de `/inktober/`, `/inktober-2026/`, `/livre/`, `/redim/`, `/elec/`, `/map/` et de tous les autres sous-sites sont conservés. L’accès à l’outil Market Plus interne demeure absent ; son bouton ouvre uniquement la carte publique des composants.

Les huit commits disponibles du modèle Points sont conservés dans les parties `source-history/portfolio-points.bundle.b64.*`, avec leurs auteurs, dates, identifiants et parents. Leur intégrité est testée. La publication conserve l’historique GitHub existant ; aucun commit passé n’est reconstruit. Voir `source-history/portfolio-points.md`.

Validation : vingt et un tests de contenu, routes, sélection des moteurs, courses entre chargements, nettoyage, réduction des mouvements, géométrie des déchirures, découpe commune et budget de particules. Contrôle navigateur bureau du nouveau Glitch : déchirures à l’échelle de la page, absence de débordement horizontal, bascule entre les trois thèmes sans doublon de moteurs, saisie conservée et mini-démo Kikalmo fonctionnelle. Les contrôles géométriques couvrent 320, 390 et 1440 px. Le navigateur connecté n’étant pas disponible pendant cette révision, la nouvelle composition mobile n’a pas été contrôlée visuellement sur un petit viewport ni sur un téléphone physique.

### Déchirures de page

- `portfolio-assets/themes/page-rifts.mjs` : bords irréguliers déterministes, polygones, découpe d’un même masque entre fond, particules et HTML.
- `portfolio-assets/themes/rift-points.mjs` : projection et échantillonnage lors du calcul de mise en page ; dessin des points groupé par couleur, avec un léger mouvement continu.
- `portfolio-assets/themes/glitch.mjs` : quatre zones de page, raccord Kikalmo, budget partagé des scènes visibles et nettoyage.
- `portfolio-assets/themes/cursors.mjs` : moteur Curseurs partagé ; sélection des zones sombres, réduction du nombre de curseurs et arrêt lorsqu’il n’y a rien à animer dans Glitch.
- `portfolio-assets/glitch.css` : typographie par univers, composition bureau/mobile et bref effet d’arrivée des déchirures.

Le fond est un SVG statique recalculé uniquement lorsque la mise en page change. Le rendu animé est limité à 24 images/s sur bureau et 20 sur mobile, avec au maximum deux scènes et un budget total de 1 600 points sur bureau ou 1 000 sur mobile. Les projections, les couleurs et les masques sont précalculés. Aucun readback de canvas, copie d’image ni projection 3D n’est fait à chaque image. La mesure ponctuelle des pixels du texte Kikalmo intervient uniquement lors du calcul de mise en page. Sur l’aperçu bureau, le dessin des points mesuré par le moteur a pris environ 0,5 ms à l’accueil et 0,8 ms pour Atlas et les minuteurs ; ces mesures ne représentent pas le coût complet du navigateur ni une garantie de fluidité sur tous les appareils. Le navigateur arrête les boucles dans un onglet masqué et quand aucune scène n’est visible. Aucun nouveau service, image distante ou bibliothèque n’est nécessaire.
