# Projets d’Emmanuel

Le [portfolio d’Emmanuel](https://egalland.github.io/) s’ouvre sur Curseur. Le sélecteur permet aussi de parcourir les vues Points et [Chrome](https://egalland.github.io/chrome/). Elles partagent les textes et liens, tout en conservant leur propre structure visuelle. Le [calendrier Inktober 2026](https://egalland.github.io/inktober-2026/) donne accès aux applications, statistiques et dépôts sources.

## Organisation

- `index.html` : présentation Curseur et mini-démo Kikalmo.
- `portfolio-assets/themes/construction.mjs` : curseurs animés, tracé des cadres droits, écriture puis transport avec inertie. Les éléments terminés restent stables.
- `portfolio-assets/themes/choreography.mjs` : placement et durée tirés au hasard, inclinaison issue du mouvement, contournements ponctuels et deux incidents au maximum (chute et retournement 3D).
- `portfolio-assets/portfolio.mjs` : ouverture de Curseur par défaut et passage vers Points ou Chrome au projet en cours.
- `points/index.html`, `points/app.js`, `points/style.css` : scène fixe et 17 tableaux restaurés depuis le commit pré-fusion `48359f0`, avec morphing 3D des points au défilement et au clavier.
- `points/assets/` : ressources et polices originales conservées sans altération.
- `portfolio/content.json` : source commune des textes, projets et liens. `scripts/build-portfolio.mjs` génère les deux présentations depuis `portfolio/page.template.html` et `portfolio/points.template.html`.
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

Les 14 commits de la démo Chrome sont conservés dans `source-history/portfolio-chrome.bundle`. Pour restaurer le dépôt de la démo, exécuter `git clone source-history/portfolio-chrome.bundle chrome-original`. La version intégrée à GitHub Pages est servie depuis `chrome/` et lit les données communes du portfolio.

Les huit commits disponibles du portfolio d’origine sont conservés exactement dans `source-history/portfolio-cursors.bundle`, avec leurs auteurs, dates, parents et identifiants Git. Le détail et les commandes de restauration figurent dans `source-history/portfolio-cursors.md`. La publication Pages est un commit d’intégration via la connexion GitHub, car le push Git natif n’est pas authentifié. Aucun commit antérieur n’a été reconstruit ou inventé.


## Cartographie Market Plus

La carte réelle des composants et de leurs dépendances est disponible à part sur [/map/](https://egalland.github.io/map/) : 259 composants, 925 liaisons, filtres par famille, recherche et fiches de dépendances. Elle reprend la vue « Explorer le code » de Point marché, avec son moteur Three.js et une projection 2D de secours. Les références et les quatre étapes de source disponibles sont conservées dans `map/SOURCE.md` et `map/source-history.patch`.

L’accueil conserve la présentation de Market Plus et son aperçu schématique, sans carte embarquée ni lien vers l’outil interne.

## Thèmes du portfolio

Pour changer le contenu, modifier `portfolio/content.json`, puis exécuter :

```sh
node scripts/build-portfolio.mjs
node --test tests/portfolio-*.test.mjs
```

Le switch mémorise le choix et retrouve le projet consulté. Les liens `?theme=points` ouvrent la scène Points ; `/curseurs/` conserve son rôle de raccourci. Les vues sont des documents distincts : elles partagent le contenu, pas la grille de mise en page.

Curseurs commence par une zone vide. Les curseurs animés arrivent, tracent un cadre droit progressivement, écrivent le contenu, puis transportent le bloc. L’inclinaison apparaît pendant le transport et se résorbe après un dépassement amorti. Certains trajets contournent un panneau voisin pour donner l’impression d’un chantier encombré. Une ligne au maximum glisse et se fait rattraper ; un panneau au maximum est construit à l’envers puis retourné avec perspective. Le placement et le geste varient à chaque chargement. Le défilement active les prochaines zones sans reconstruire ni incliner les éléments terminés. Les travaux hors écran sont suspendus et repris à la même étape, sans révélation instantanée au retour ni à la remontée. Le focus sur un contrôle de saisie révèle immédiatement le contenu nécessaire ; une ancre vers une carte projet ne court-circuite pas sa construction.

Points reprend la scène fixe d’avant Glitch : la molette, le tactile ou les flèches sélectionnent un tableau ; les mêmes particules se réorganisent en temps réel en sphère, lettrage, personnage, interfaces et objets. Les descriptions et liens proviennent de la même source que Curseurs. Les navigations utilisent des popovers natifs sans fond de modale : menu contextuel compact ancré au clic et poignées de sélection au survol pour Curseurs ; constellation, orbites et poussière de points pour Points. Échap et le clic extérieur ferment les outils ; le reste de la page reste utilisable.

La pause mémorisée et les mouvements réduits sont respectés. Les animations s’arrêtent quand l’onglet est masqué. Sans JavaScript, les contenus et liens restent lisibles.

Aucun sous-site n’est déplacé : `/inktober/`, `/inktober-2026/`, `/livre/`, `/redim/`, `/elec/`, `/map/` et les autres dossiers conservent leurs chemins. Market Plus ouvre uniquement la cartographie publique.

Les huit commits du modèle Points sont conservés dans `source-history/portfolio-points.bundle.b64.*`, avec leurs auteurs, dates, identifiants et parents. Leur intégrité reste testée. La restauration ajoute un commit à l’historique existant.

Validation : tests de contenu partagé, routes, géométries, continuité des trajectoires aléatoires et cycle complet arrivée → tracé → écriture → transport, suspension hors écran et retour au repos des incidents. Contrôle navigateur de la scène Points, des changements de tableau, des deux outils de navigation et de la bascule vers Curseurs. Aucun téléphone physique testé.

### Sélection du portfolio

L’accueil présente quatre domaines de pratique. La rubrique Savoir-faire relie chaque geste à un projet. Pills, plateforme de critique culturelle, figure dans les deux vues avec [son dépôt public](https://github.com/egalland/Pills).

L’Atelier contient uniquement Atelier du livre, Redim et Atlas. Four en route et Biscuit du jour sont retirés de la sélection, sans suppression de leurs sous-sites. Inktober dispose d’une section dédiée et de sa propre entrée dans les navigations Curseurs et Points. Les constantes de navigation Points correspondent aux 17 tableaux générés.
