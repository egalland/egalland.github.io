# Priorités fragiles

Application web en français, thème **Fragile**, jour 13 d’Inktober 2026.

Tableau de projets avec dépendances, blocages expliqués et identification des tâches bloquées par une seule racine. Exemple intégré : A bloque B, puis B bloque C.

## Utilisation

Créer un projet, ajouter des tâches, puis sélectionner leurs prérequis dans l’éditeur. Terminer A libère B ; C attend encore B. Les boucles directes et indirectes sont refusées. Les tâches terminées peuvent être rouvertes quand aucune tâche terminée n’en dépend.

Fonctions : recherche, filtres par projet, édition, suppression protégée des tâches, import/export JSON et données de démonstration signalées.

## Développement

Node.js 24 ou supérieur, aucune dépendance à installer.

```sh
npm run build
npm test
python3 -m http.server 8000 --directory dist
```

Ouvrir http://localhost:8000. Les sources TypeScript sont dans `src/` et le build statique dans `dist/`.

## Données et limites

Sauvegarde dans le localStorage de ce navigateur. Pas de serveur de données, de collaboration ou de synchronisation entre appareils. Un changement d’origine ne transfère pas la sauvegarde : exporter puis importer le JSON. Une sauvegarde impossible est signalée et le changement est refusé. Les exports ne contiennent que les projets et tâches saisis dans l’app.

Sept tests de logique réussis : progression A → B → C, boucles, prérequis non terminés, restauration de sauvegarde, erreurs de stockage, import invalide et plusieurs racines bloquantes. Le rendu mobile et les interactions clavier n’ont pas été vérifiés dans un navigateur durant la création.

## Temps

Création initiale assistée : environ 7 minutes de session observée (04:26–04:33 UTC, 13 octobre 2026). Intégration GitHub séparée. Développement manuel équivalent : estimation de 8 heures pour cette première version, et non un temps mesuré.
