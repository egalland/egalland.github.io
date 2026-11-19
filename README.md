# STRATE · Analyse des agents

Ce module autonome reprend le calcul du rapport STRATE sur les journaux de simulation. Il regroupe les événements par agent et mesure les ventes, les crédits gagnés, les blocages, les reprises et la part du temps où toutes les usines sont suspendues.

Avec Node.js 22 ou plus récent, lancer `node --test analysis.test.mjs`. Pour analyser un export local, lancer `node report.mjs journal.json 2`. Le nombre final correspond aux usines suivies par agent. Le fichier contient un tableau d’événements ou un objet avec une liste `rows`.

Chaque événement contient un `name`, un horodatage ISO `at` et une `action`. `join` ouvre la période mesurée. `factory/pause` inverse l’état de la cible `order.target`. Une vente `townSell/` se valorise par la variation de `credits` entre `before` et `after`. Le pourcentage de suspension vaut `null` en l’absence d’une fenêtre mesurable. Les ventes insuffisamment documentées sont comptées dans `unvaluedSales`. Les tests donnent des exemples fictifs.

## Interface Web

Depuis le dossier du projet, lancer `python -m http.server 8000` puis ouvrir `http://localhost:8000`. Les paramètres de démonstration sont modifiables. Le navigateur exécute le même moteur que la commande Node.js.
