# Démo du futur mode culture de Kikalmo

Site de démonstration solo séparé du Kikalmo de production. « Mode culture » est un intitulé provisoire. L’URL de la démo Kultur existante est conservée.

## Fonctionnement

- Seize salons : les treize catégories existantes de Kikalmo, une catégorie sciences, et deux variantes du général (QCM et rébus).
- Dix questions par partie. Les catégories définissent le sujet ; les formats définissent la façon de répondre.
- Douze formats : écrit, QCM à quatre choix, rébus, emojis, mélodie audio, intrus, ordre, association, estimation, vrai/faux, indices progressifs et image mystère.
- Barème repris de `lib/game.ts` de Kikalmo à la source `c6b204e86f220d63b76f6984b94f2afc0610d8bd` : `max(100, round(1000 - 900 * elapsed / 25000))` avant la fin des 25 secondes. Après la limite, aucun point. Le prototype utilise l’horloge locale ; l’intégration multijoueur devra conserver une autorité serveur.
- Les QCM, intrus et vrai/faux figent le premier choix. Les autres formats autorisent de nouvelles tentatives pendant le temps restant.
- Un audio est une interprétation synthétisée d’une mélodie traditionnelle ou classique, sans paroles ni enregistrement commercial. Le premier lancement démarre le chrono ; une nouvelle écoute ne le réinitialise pas.
- Profil, couleurs, trente dernières parties et partie en cours conservés dans `localStorage`. Un rechargement ne remet pas le chrono à zéro. Aucun score n’est envoyé à Kikalmo.

Le compte, la monnaie, les achats, le multijoueur et la création de salons ne sont pas reliés dans cette démo. Le futur produit prévoit deux modes et une économie commune ; aucun portefeuille parallèle ou récompense fictive n’est créé ici.

## Sources visuelles

Logo cousu, texture feutre, étoile, pelote et atlas de marionnettes existants de Kikalmo, copiés depuis le même commit de référence. Aucune modification de Kikalmo ni de ses assets originaux. Les variantes de couleur s’appliquent seulement au rendu local de la marionnette du prototype.

## Validation

```sh
node --test tests/engine.test.mjs
node --check dist/app.mjs
node --check dist/questions.mjs
node --check dist/audio.mjs
```

Application statique sans installation. `dist/index.html` est l’entrée, servie avec ses modules et images par le serveur Sites. Aucune dépendance distante n’est nécessaire.
