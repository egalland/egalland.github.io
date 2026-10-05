# Inktober 2026 · Le calendrier des ombres

Calendrier : https://egalland.github.io/ — copie accessible sur `/inktober-2026/`.

## Modifier et sauvegarder

Le bouton **Connecter GitHub** accepte un jeton personnel fine-grained du compte `egalland`. Sélectionner uniquement `egalland.github.io` et accorder **Contents: Read and write**. La vérification du compte et les écritures passent directement par l’API GitHub ; aucun serveur ni service Sites n’est requis.

Le jeton reste dans une variable en mémoire, jamais dans localStorage, les URL ou les fichiers du dépôt. Il faut le saisir à nouveau après un rechargement. Seules les ouvertures de portes des visiteurs sont conservées localement ; celles du propriétaire connecté sont enregistrées dans le dépôt.

Chaque enregistrement met à jour `inktober-2026/calendar.json` et crée un commit sur `master`. Les titres, descriptions, états, liens, durées et tarifs sont **publics**, comme ce dépôt. La sauvegarde précédente n’est pas importée. Les informations peuvent être ressaisies.

Avant chaque écriture, la version GitHub est relue. Les modifications faites sur d’autres champs sont conservées ; un changement concurrent du même champ bloque l’enregistrement. **Actualiser les données** permet de recharger la version récente en conservant le brouillon dans le formulaire. L’historique Git permet de retrouver les versions précédentes.

## Un dépôt par app

Dans la case du jour, saisir `cactocalypse` ou `https://github.com/egalland/cactocalypse`. Le lien final sera `https://egalland.github.io/cactocalypse/`. Une URL complète reste acceptée.

1. **Vérifier le dépôt** : contrôle du propriétaire et de la présence d’un `index.html` ou d’une commande npm `build`.
2. **Construire et publier l’app** : installation du workflow `.github/workflows/inktober-pages.yml` dans le dépôt d’app et lancement de GitHub Actions. Aucun code de dépôt n’est exécuté dans le navigateur.
3. **Tester l’app publiée** : lien disponible après réussite de la construction et du déploiement.
4. **Enregistrer** la case pour valider son titre, son lien et son suivi dans le calendrier.

Pour cette publication, sélectionner aussi les dépôts d’apps dans le jeton et accorder **Contents, Workflows, Pages et Actions: Read and write**. Activer au préalable `Settings > Pages > GitHub Actions` sur le dépôt d’app, ou accorder aussi **Administration: Read and write** pour que le bouton le configure. Le calendrier conserve ses propres paramètres de publication.

Le workflow prend en charge les apps statiques et les projets npm produisant `dist/`, `build/` ou `out/`. Les projets Vite reçoivent automatiquement la base correspondant au nom du dépôt. Un projet avec serveur doit exporter une version statique ou utiliser son propre backend. Un workflow Inktober déjà personnalisé n’est pas remplacé.

Les pushes suivants sur la branche principale de l’app reconstruisent sa publication. Le calendrier et les apps gardent des historiques et des cycles de mise à jour indépendants.

## Fond et mouvement

`atmosphere.css` et `parallax.js` définissent trois plans : paysage, brume et particules. Chacun se déplace à une vitesse différente pendant tout le défilement ; la souris ajoute une profondeur indépendante. Le traitement suit requestAnimationFrame, s’arrête lorsque les valeurs se stabilisent ou lorsque la page est masquée, et respecte prefers-reduced-motion. L’image WebP est chargée localement et ses chemins fonctionnent depuis les deux pages d’entrée.

## Vérifications

```sh
node tests/check-calendar.mjs
```

Le test emploie une API GitHub simulée et un jeton factice. Il vérifie les commits de données, les permissions, les conflits, le rechargement, les liens de dépôts, les calculs, le parcours GitHub Actions et les mouvements du fond. La connexion avec un vrai jeton et la construction des dépôts d’apps nécessitent leur configuration par le propriétaire.
