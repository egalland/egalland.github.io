# Vue Données · MLD

La vue `/map/#data` décrit le modèle logique SQL défini dans le code de Market Plus V150 (source `8a686f762ba40701ec4631ec98d6f82bfa3aa8f4`). Elle ne consulte pas la base de production.

Le fichier `data-model.json` est extrait des instructions DDL des migrations Drizzle, auxquelles sont ajoutées les instructions `CREATE TABLE` de `lib/access-server.ts`, `lib/directory-store.ts` et `lib/jira-analytics-server.ts`. Seules les instructions de définition sont exécutées dans une base SQLite en mémoire ; les insertions et les données sont ignorées. Les métadonnées proviennent de `PRAGMA table_info`, `foreign_key_list`, `index_list` et `index_info`.

La capture contient 22 tables (16 Drizzle et 6 créées à l’exécution), 175 colonnes, 36 index additionnels et 7 clés étrangères déclarées. Les clés primaires composées, les index d’unicité composés et les actions de suppression sont conservés. Les empreintes des fichiers sources figurent dans le JSON.

Sept références applicatives supplémentaires sont documentées à partir de `db/point-store.ts`, `lib/point-persistence.ts`, `app/api/point-drafts/route.ts` et `lib/directory-store.ts`. Elles sont cachées par défaut, affichées en pointillés et ne reçoivent pas de cardinalité SQL inventée. Les liens conditionnels des brouillons indiquent le scope concerné.

Les blocs du point sont des propriétés du document JSON `PointData` dans `payload` : ils ne sont pas présentés comme des tables indépendantes. Les stockages R2 et JSON locaux sont décrits à part.

## Reproduire l’extraction

```sh
python map/build-data-model.py /chemin/vers/market-plus-v150
```

Le générateur exige le checkout source correspondant. Les contrôles de taille et les libellés sont ceux de la capture V150 ; ils doivent être réévalués si le schéma du projet évolue.

Cette vue et son générateur constituent une nouvelle adaptation dans l’historique GitHub Pages. Les références de source sont conservées ; aucun commit antérieur n’est reconstruit.
