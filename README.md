# Points de réunion

Cette édition locale de Point Marché sert à préparer une réunion hebdomadaire, organiser ses dossiers et opérations, puis exporter la présentation ou un brouillon de courriel avec le document HTML joint.

## Démarrer

Télécharger `index.html` et l’ouvrir dans un navigateur moderne. L’application démarre avec le marché « Mon marché » et un classeur vide. Au premier accès, le code de démonstration `Z0000001` donne accès aux réglages de cette édition locale. Les rôles structurent l’interface dans le navigateur. Le partage des fichiers relève des droits du système d’exploitation.

Choisir le marché et la semaine, puis ajouter les blocs à présenter. Le menu **Fichier local** permet de sauvegarder le classeur JSON ou de le rouvrir. Chrome et Edge sur ordinateur permettent aussi de choisir un dossier partagé. Le brouillon EML s’ouvre dans une messagerie compatible pour relecture et envoi.

## Recompiler les sources

Avec Node.js 22.13 ou plus récent, exécuter `npm ci`, `npm test` et `npm run build`. La compilation génère `index.html`. Toutes les données de travail sont fournies par la personne qui utilise l’application et restent dans le classeur choisi.
