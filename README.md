# BodyOS · Démonstration locale

BodyOS réunit le journal quotidien, les mensurations, les habitudes, les activités, la musculation, le catalogue alimentaire, le suivi des compléments et le potager. Cette édition conserve le modèle métier et l’API du projet. Elle fournit une interface locale distincte, de nouveaux formulaires et une visionneuse anatomique générique.

## Lancer le carnet

Installer Node.js 24 ou plus récent, puis exécuter les commandes à la racine du projet.

```sh
npm ci
npm start
```

Ouvrir le lien imprimé par le terminal. Son code donne accès à la session locale jusqu’à l’arrêt du serveur. Le serveur écoute exclusivement sur `127.0.0.1`. La première installation des dépendances peut utiliser Internet. Le carnet, les polices système, le modèle anatomique et la base fonctionnent ensuite sur l’ordinateur.

SQLite initialise automatiquement `.local/bodyos-demo.sqlite`. La première ouverture crée le profil fictif « Alex Démo » et ses préférences. Toutes les tables d’activité, d’alimentation, de santé et de récolte sont vides. Les valeurs fictives du profil permettent de tester les formulaires d’objectifs.

Pour ouvrir une deuxième démonstration, configurer `BODYOS_DEMO_DB` avec un nouveau chemin de fichier avant le lancement. `PORT` permet de sélectionner un autre port local. Une base existante doit porter l’identifiant et la version de schéma de cette édition.

## Utiliser les espaces

- **Journal et mensurations** pour enregistrer une journée, ses mesures et des habitudes, puis suivre les relevés saisis.
- **Activités et musculation** pour créer un programme, préparer ses journées et ses exercices, enregistrer des séries et calculer le volume d’une séance terminée.
- **Nutrition** pour renseigner un aliment, ses valeurs par 100 g, le coût et le stock d’un complément.
- **Potager** pour cataloguer une variété, faire évoluer son prix à une date donnée et valoriser les récoltes enregistrées.
- **Profil et anatomie** pour régler les objectifs de test, la densité d’affichage, le budget et explorer le modèle musculaire en WebGL.

L’édition fournit une vue d’ensemble et des historiques tabulaires. La présentation React de la version hébergée, les tableaux analytiques avancés et les automatisations de messagerie sont spécifiques à la version d’origine.

## Vérifications

```sh
npm run typecheck
npm test
```

Le test d’intégration crée un fichier SQLite temporaire, contrôle les 18 tables à l’initialisation, exerce les principaux domaines et relance le serveur pour vérifier la persistance. Le fichier de test est supprimé à la fin.

Les données 3D et les bibliothèques de la visionneuse ont leurs propres licences. Consulter [les attributions](public/bodyos-anatomy/licenses/ATTRIBUTION.md), [la licence du modèle](public/bodyos-anatomy/licenses/LICENSE-DATA.md) et [la licence Three.js](public/bodyos-anatomy/licenses/THREE-LICENSE.txt).
