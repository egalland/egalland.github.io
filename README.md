# Tests de dossiers partagés

## Version navigateur

Ouvrir `navigateur/index.html` avec Chrome ou Edge sur ordinateur. Choisir un dossier auquel le navigateur peut accéder. La page crée son sous-dossier `FAUX_SQL_TEST`. Utiliser **Tester la lecture / écriture**, créer une fiche, puis lancer une requête `SELECT` dans la mini-console. Le navigateur demande les droits d’accès à la personne qui ouvre la page.

## Version avec service local

Installer Node.js 20 ou plus récent, puis exécuter `node service-local/serveur.cjs --ouvrir`. Sur Windows, `service-local/LANCER.bat` lance la même commande. Le service écoute sur une adresse de boucle locale avec un port aléatoire. Chaque poste lance sa propre instance et les instances échangent les messages par le dossier choisi.

`service-local/config.json` utilise `./donnees` par défaut. Pour un essai à plusieurs, renseigner dans ce fichier le même dossier partagé sur chaque poste. Les droits du dossier sont ceux du système d’exploitation. La signature des messages correspond au nom saisi dans la page. Les deux versions utilisent des formats distincts.
