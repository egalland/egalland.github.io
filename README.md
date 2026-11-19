# Atelier Horizons 3D

Ce module simule un atelier d’impression 3D, de la demande jusqu’à la trésorerie. Il comprend le moteur de projection mensuelle du tableau de bord, ses calculs annuels et sa suite de tests. Les hypothèses initiales décrivent un atelier fictif et se règlent dans un fichier JSON.

Avec Node.js 22 ou plus récent, lancer `npm test` puis `npm run --silent simulate > projection.json`. Pour modifier les paramètres, créer par exemple un fichier `atelier.json` contenant `{"horizon":5,"initialMachines":2,"initialCapital":6000}`, puis lancer `node simulate.mjs atelier.json prudent`. Les scénarios disponibles sont `prudent`, `central` et `soutenu`.

Le JSON contient les hypothèses effectivement utilisées, le bilan de la projection et les résultats année par année. Les champs de `DEFAULTS` et `PARAM_GROUPS` dans `model.js` décrivent les entrées, les unités et les bornes. Le moteur exporte également `compareScenarios`, `productEconomics` et `sensitivity`.

## Interface Web

Depuis le dossier du projet, lancer `python -m http.server 8000` puis ouvrir `http://localhost:8000`. Les paramètres de démonstration sont modifiables. Le navigateur exécute le même moteur que la commande Node.js.
