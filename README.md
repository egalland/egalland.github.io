# Historiques Git du 19 novembre 2026

Les archives contiennent les dates d’origine des 34 commits des quatre projets. Tous les commits sont attribués à Emmanuel Galland, compte GitHub `egalland`. Chaque projet contient un journal des demandes retrouvées dans `PROMPTS.md`.

| Projet | Commits d’origine |
| --- | ---: |
| Maille City | 17 |
| Double Programme | 5 |
| Atelier Habitat | 9 |
| Élan | 3 |

Télécharger les fichiers de cette branche. Reconstituer le bundle de Maille City à partir de ses deux parties, puis vérifier l’empreinte et cloner le dépôt.

```bash
cat maille-city-kikalmo.bundle.part-00 maille-city-kikalmo.bundle.part-01 > maille-city-kikalmo.bundle
sha256sum -c SHA256SUMS
git clone -b main maille-city-kikalmo.bundle maille-city-kikalmo
git -C maille-city-kikalmo log --reverse --format=fuller
```

Les trois autres bundles se clonent directement avec `git clone -b main fichier.bundle chemin`. Pour transférer l’historique vers un dépôt GitHub dédié, pousser la branche `main` du clone du bundle vers un dépôt vide.
