# Biscuit du jour — Inktober 2026, jour 30

Application web en français inspirée du thème « Biscuit » : boîte à messages surprises, tirage au hasard et illustration de biscuit au style cartoon 1920–1930 / *flash tattoo*.

## Démo publique

**https://egalland.github.io/biscuit-du-jour/**

Le fichier `index.html` contient CSS, JavaScript et favicon embarqués et se lance sans dépendance externe. L'interface s'adapte aux mobiles, aux actions clavier et à la préférence `prefers-reduced-motion`.

## Fonctionnalités

- Cliquez sur le biscuit ou le bouton « Ouvrir un biscuit » pour découvrir un billet.
- 12 messages de **démonstration** initialement disponibles, à modifier, ajouter ou supprimer.
- Sans répétition **par défaut** jusqu'à épuisement ; l'option « Biscuits à volonté » autorise les répétitions.
- Préférences, messages et historique des tirages conservés avec `localStorage` (clé `biscuit-du-jour:v1`).
- Sauvegarde manuelle : export et import JSON. Aucune synchronisation inter-appareils.

## Sources et développement

- `src/main.ts` : logique TypeScript d'origine
- `src/index.template.html` : gabarit HTML avant assemblage
- `styles.css` et `favicon.svg` : design et illustration SVG
- `scripts/build.mjs` : compile le TypeScript et crée le HTML autonome à la racine
- `scripts/serve.mjs` : serveur statique de développement
- `site/` : fichiers statiques compilés
- `tests/smoke.test.mjs` : tests Node
- `stats.json` : statistiques et hypothèses d'estimation

Depuis le dossier `biscuit-du-jour` (Node.js et npm installés) :

```bash
npm install
npm run build
npm run typecheck
npm test
npm start
```

**Vérifications du 3 novembre 2026** : compilation TypeScript et contrôle des types réussis ; 5/5 tests Node passés. Le HTML regénéré a été comparé octet par octet au HTML de la V2 livré dans la conversation. Le rechargement avec stockage simulé est testé ; l'accès au site GitHub Pages depuis le navigateur distant reste à vérifier après publication.

## Historique : transparence

Deux livraisons vérifiables existaient avant le push : **V1** (première version autonome) et **V2** (correction de l'ordre de chargement du JavaScript, illustration flash tattoo, comportement mobile). Le dépôt Git local d'origine n'était pas présent : leurs fichiers ont été réimportés sous la forme de commits distincts, puis le projet source a été ajouté. **Les commits de ce dépôt retracent la publication et non un historique Git d'origine inventé.**

## Statistiques

Voir `stats.json` et les statistiques du calendrier Inktober, jour 30. Les durées de Vibe Coding, équivalents développeur et valorisations sont **des estimations**, pas des mesures de temps de travail ou des économies réalisées.
