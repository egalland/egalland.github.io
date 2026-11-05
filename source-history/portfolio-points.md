# Historique original du modèle Points

Le bundle contient les huit commits disponibles du dépôt Sites Redline, jusqu’à `c8771fdcde24ac52e5b7a239bc9ea381a1e50045`. Il a été vérifié avec `git bundle verify`. Aucun commit antérieur supplémentaire n’a été retrouvé ou inventé.

Le push natif vers GitHub n’étant pas authentifié dans cet environnement, les fichiers sont intégrés via la connexion GitHub et le bundle conserve exactement le graphe d’origine. L’historique existant de GitHub Pages et tous ses sous-dossiers restent en place.

```sh
cat source-history/portfolio-points.bundle.b64.* | base64 --decode > /tmp/portfolio-points.bundle
git clone /tmp/portfolio-points.bundle portfolio-points-original
git -C portfolio-points-original log --reverse --format=fuller
```

## Commits conservés

```text
c178cfbcabcd921d10e544cc931e886253dbc967 | 2026-11-03T18:34:38Z | Codex | Update Site source
80a4a3bc3dfdeeb2a1d8317f0e13bab5ce2960b7 | 2026-11-03T19:59:56Z | Codex | Update Site source
a3dd071acaab840582a00b43453aa60295f41766 | 2026-11-03T20:42:50Z | Codex | Update Site source
0fedafbd8d5bccb35e03102704de1440e9787eca | 2026-11-03T20:50:40Z | Codex | Update Site source
7b7ccfaef38e4ddc8a1d7349e354d29e1dc4af81 | 2026-11-04T19:20:39Z | Codex | Update Site source
0a69565981e1e9353f6b4df9d7cbe33d67ba5c3c | 2026-11-04T19:37:00Z | Codex | Update Site source
87bcc01a74b21b3ee811a50034f7c829c0176f58 | 2026-11-04T23:36:07Z | Codex | Update Site source
c8771fdcde24ac52e5b7a239bc9ea381a1e50045 | 2026-11-05T06:11:01Z | Codex | Update Site source
```

Les parties texte contournent une limite technique de transfert des ressources binaires. Après décodage, le bundle est strictement identique à l’original ; sa taille et son SHA-256 figurent dans `portfolio-points.bundle.manifest.json`. Les ressources visuelles et les polices sont également intégrées sans modifier leurs octets.
