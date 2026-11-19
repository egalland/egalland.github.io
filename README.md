# Bilans de code

Le moteur des bilans quotidiens agrège les estimations de temps, les lignes ajoutées et supprimées et les écarts entre deux méthodes de développement. Les intervalles inconnus restent distincts des zéros. Cette édition fournit les calculs et le découpage du graphique par semaine, avec un exemple fictif.

Exécuter `node bilan.mjs example.json` puis `node --test model.test.mjs` avec Node.js 22 ou ultérieur. Pour une journée particulière, ajouter sa date à la commande. Le fichier d’entrée contient une liste `rows` et, si nécessaire, une liste `totals` de totaux faisant autorité. Les bornes `vmin` et `vmax` sont en minutes, `dmin` et `dmax` en heures. Les taux du modèle sont de 35 et 40 euros de l’heure. Les calculs sont locaux.

## Interface Web

Depuis le dossier du projet, lancer `python -m http.server 8000` puis ouvrir `http://localhost:8000`. Les paramètres de démonstration sont modifiables. Le navigateur exécute le même moteur que la commande Node.js.
