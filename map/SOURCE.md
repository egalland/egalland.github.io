# Carte des composants de Market Plus

La route `/map/` reprend la vue « Explorer le code » de Point marché / Market Plus V150, source `8a686f762ba40701ec4631ec98d6f82bfa3aa8f4`.

Le graphe `architecture.json` est celui généré par le projet : 259 composants et 925 dépendances détectées. Les 8 familles, métadonnées, imports et relations sont conservés. Le moteur Three.js, la sélection, les filtres et les guides sont repris des sources correspondantes. Les imports sont adaptés à GitHub Pages et l’interface React est portée en JavaScript autonome. La vue de secours 2D dessine les mêmes nœuds et relations. Aucune donnée métier n’est importée.

## Origine des fichiers

- `architecture.json` : `lib/generated/site-architecture.json`, identique après conversion JSON compacte.
- `model.js` : `lib/site-architecture.ts` (types retirés et chargement du JSON adapté).
- `guide.js` : `lib/architecture-guide.ts` (types retirés et import adapté).
- `scene.js` : `features/market-pulse/architecture-scene.ts` (moteur Three.js d’origine, types retirés et imports adaptés).
- `render-loop.js` : `lib/scene-render-loop.ts`.
- `architecture.css` : styles de la carte dans `app/styles/superadmin-v147.css`.
- `app.js`, `index.html`, `base.css` : adaptation autonome de `features/market-pulse/architecture-code-panel.tsx` et ajout de la projection 2D.

Three.js et OrbitControls utilisent les fichiers déjà publiés sous `/elec/`, avec leurs licences existantes. Ce dossier n’est pas modifié.

## Historique disponible

`source-history.patch` conserve les quatre étapes disponibles des fichiers concernés, avec les références, dates, auteurs, messages et modifications d’origine. Cet historique est fourni sous forme de patches ; les commits de l’application interne ne sont pas ajoutés comme parents à l’historique GitHub Pages. La publication de l’adaptation est un nouveau commit, sans reconstruction de commits antérieurs.

| Commit source | Date auteur | Message |
|---|---|---|
| `cdec479e0124a83445aa8be0daf7540ddc1b3c20` | 2026-11-02T18:19:07Z | Update Site source |
| `2c7553a8b364ab10e0c3f39c9af3057a915dcd06` | 2026-11-02T22:05:54+03:00 | Update Site source |
| `16fab82b287b11cc04ca043ba0b3232f4f7e82aa` | 2026-11-02T23:06:53+03:00 | Update Site source |
| `8a686f762ba40701ec4631ec98d6f82bfa3aa8f4` | 2026-11-03T01:53:31+03:00 | Update Site source |

SHA-256 du patch : `32455a79e629ff4008721f1a32e9651dfd3295f1df0d504c342bcc5d9fc1f3b1`.
