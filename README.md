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

Points et Glitch partagent maintenant les mêmes modèles XYZ animés : rotation continue, perspective, profondeur, orientation au pointeur et déplacement des points lorsqu’on maintient la souris. Les volumes restent calculés en 3D à chaque image, par des shaders WebGL ou par une projection Canvas compatible. Les anciens échantillonnages de photos ont été remplacés par un personnage et un lettrage construits en géométrie. Les interfaces conservent des couches à différentes profondeurs.

Glitch garde ses quatre grandes zones de page Points / Curseurs et son raccord avec la vraie mini-démo Kikalmo. Les frontières sont découpées en blocs de pixels, avec de courtes désynchronisations : fragments de texte cyan/magenta et paquets de particules qui s’écartent du raccord puis disparaissent. Une perturbation dure au maximum 620 ms, à l’arrivée puis ponctuellement ; elle ne fait pas clignoter toute la page. Le fond, les lettres et les particules utilisent le même masque. Les lettres de Kikalmo sont mesurées dans le document pour préserver le raccord et la saisie.

Le menu orbital d’origine est rétabli au clic droit sur le fond dans les trois vues. Il donne accès aux projets, à l’atelier et au parcours, permet de choisir une vue et de réduire/réactiver les effets. La préférence de pause est mémorisée ; la réduction des mouvements du système reste respectée. Les liens, champs, sélections de texte et le clic droit avec Maj gardent le menu natif du navigateur. Le bouton « Explorer » et le raccourci Maj + F10 donnent aussi accès au menu. Dans Glitch, une commande permet de provoquer une impulsion numérique.
Chaque moteur fournit une fonction d’arrêt : boucle d’animation, écouteurs, sélections, transformations et éléments temporaires sont nettoyés. Un chargement devenu obsolète ne lance aucun moteur. La préférence de mouvement réduit est respectée ; les animations s’arrêtent lorsque l’onglet est masqué. Les unités déjà construites restent mémorisées et les fenêtres contenant une saisie ne recommencent pas leur agrandissement. Glitch garde les apparitions déjà vues et conserve la saisie lors des changements de thème. Les fenêtres sombres sont directement utilisables ; le mode Curseurs conserve aussi l’aperçu interactif complet de Market Plus.

Aucune application existante n’est déplacée : les arbres Git de `/inktober/`, `/inktober-2026/`, `/livre/`, `/redim/`, `/elec/`, `/map/` et de tous les autres sous-sites sont conservés. L’accès à l’outil Market Plus interne demeure absent ; son bouton ouvre uniquement la carte publique des composants.

Les huit commits disponibles du modèle Points sont conservés dans les parties `source-history/portfolio-points.bundle.b64.*`, avec leurs auteurs, dates, identifiants et parents. Leur intégrité est testée. La publication conserve l’historique GitHub existant ; aucun commit passé n’est reconstruit. Voir `source-history/portfolio-points.md`.

Validation : vingt-six tests de contenu, routes, sélection des moteurs, courses entre chargements, nettoyage, réduction des mouvements, vraies projections 3D, réaction au pointeur, dessin compatible groupé par couleur, raccords en pixels et durée bornée des perturbations. Contrôle navigateur bureau : modèles vivants en Canvas 3D compatible, menu orbital au clic droit, pause/reprise mémorisée, navigation, bascule entre les trois vues sans doublon de moteurs, mini-démo réussie et saisie conservée. Les tests géométriques couvrent 320, 390 et 1440 px. Les contrôles sur fenêtres mobiles et WebGL de la version publiée sont réalisés après déploiement ; aucun téléphone physique n’est testé.

### Modèles 3D et signal numérique

- `portfolio-assets/themes/formations.mjs` : géométrie XYZ commune aux vues Points et Glitch, sans image animée ni photo projetée.
- `portfolio-assets/themes/point-cloud.mjs` : buffers de modèles, caméras, perspective et projection 3D de secours.
- `portfolio-assets/themes/point-renderer.mjs` : rendu WebGL, masque stencil et rendu Canvas 3D compatible ; libération des ressources graphiques.
- `portfolio-assets/themes/point-interaction.mjs` : orientation au pointeur, glissement, attraction et commandes au clavier sur les modèles.
- `portfolio-assets/themes/digital-signal.mjs` : découpes en blocs, enveloppe courte des perturbations et paquets de pixels.
- `portfolio-assets/themes/glitch.mjs` : composition de la page, raccord HTML/points, déclenchement des impulsions et nettoyage.
- `portfolio-assets/context-menu.mjs` : menu orbital commun, navigation et commandes d’animation.

Les modèles sont préparés une seule fois en coordonnées XYZ, puis tournent et sont reprojetés en temps réel. WebGL vise au maximum 60 images/s sur bureau et 30 sur mobile ; le rendu compatible est limité à 24/20 images/s avec une densité réduite. Seules deux scènes visibles sont dessinées. Points plafonne à 5 600 points sur bureau et 3 360 sur mobile ; Glitch à 4 400 et 2 600, plus au maximum 120/65 petits paquets temporaires. Le secours Canvas réduit ces budgets à 2 200/1 400 pour Points et 1 800/1 200 pour Glitch.

Les masques de page et les positions des glyphes sont recalculés lors des changements de mise en page. Aucun readback de canvas ni copie d’image n’est fait à chaque image ; les effets de rupture sont dessinés à partir des géométries. Les boucles s’arrêtent dans un onglet masqué, en pause et lorsqu’aucune scène ou impulsion n’est visible. Aucun service distant ni bibliothèque supplémentaire n’est nécessaire. Référence technique du masque : [stencil WebGL (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp).
