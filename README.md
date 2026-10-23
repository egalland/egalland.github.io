# Projets d’Emmanuel

Le [calendrier Inktober 2026](https://egalland.github.io/) donne accès aux applications et à leurs dépôts sources.

## Organisation

- `index.html` et `inktober-2026/` : calendrier, registre des projets, statistiques et leurs sources.
- Un dossier portant le nom du projet : version jouable ou accès à sa version serveur.
- Les anciens noms et les numéros de jours : raccourcis vers les adresses nommées, pour conserver les liens partagés.
- `arrival/` : introduction du calendrier ; `tests/` : contrôles du calendrier et des routes.
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

Les dépôts sources conservent leur historique ; les deux nouveaux imports statiques préservent également les commits sources par fusion dans ce dépôt.
