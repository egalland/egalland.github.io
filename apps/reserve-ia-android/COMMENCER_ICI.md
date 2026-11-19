# Réserve IA — installation sur Poco Android

Package personnel • 16 octobre 2026 • version de préparation 0.2

## À lire avant de commencer

Ce package contient le code Android, le relais, des scripts de démarrage et les instructions. Il ne contient PAS d’APK déjà compilé. La notification est textuelle et dépliable : pourcentages restants, renouvellements, dernière mesure et bouton Actualiser. Il n’y a pas encore de jauges graphiques, d’alerte à 20 % ni d’historique quotidien.

Les tests du relais utilisent un faux processus Codex. Ils ne prouvent pas la connexion à votre compte. La compilation Android, le workflow GitHub, les scripts Windows et l’essai sur Poco restent à effectuer. Ne considérez l’installation comme réussie qu’après comparaison avec vos quotas réels.

## 1. Choisir où faire tourner le relais

| Choix | PC personnel allumé ? | Ce qu’il faut |
| --- | --- | --- |
| Essai sur Windows | Oui, pendant le suivi | PC avec Node.js, Codex CLI et Tailscale |
| Relais sur serveur Linux personnel / VPS | Non | Un serveur restant disponible, avec les mêmes outils ; hébergement éventuel à votre charge |
| Téléphone seul, directement connecté à ChatGPT | Pas disponible dans ce package | Connexion autonome non validée |
| Codex Cloud comme relais permanent | Pas fourni | Le lancement de tâches cloud ne valide pas un service permanent accessible par l’application |

Commencez par tester la lecture de votre compte sur un ordinateur existant. Ne prenez pas un abonnement serveur uniquement sur la foi de ce prototype. Le guide VPS est une procédure proposée, pas un déploiement déjà testé.

Le relais lit les fenêtres réellement exposées pour le quota Codex. Il ne mesure pas tous les outils de ChatGPT et ne suppose pas qu’une fenêtre de cinq heures ou hebdomadaire soit toujours présente.

## 2. Installer les outils sur Windows

1. Décompressez tout le ZIP dans un dossier, par exemple `C:\ReserveIA`. Ne lancez pas les fichiers depuis l’aperçu du ZIP.
2. Installez Node.js 22 ou une version LTS plus récente depuis https://nodejs.org/ ; incluez npm. Rouvrez PowerShell après installation.
3. Dans PowerShell, vérifiez et installez Codex CLI :

```powershell
node --version
npm.cmd install -g @openai/codex
codex.cmd login
```

4. Connectez votre compte ChatGPT avec son abonnement dans le navigateur. Une clé API OpenAI ne remplace pas cette connexion.
5. Placez-vous dans le dossier contenant `build.gradle`, `app` et `bridge`, puis lancez le contrôle :

```powershell
cd C:\ReserveIA
$env:CODEX_SCRIPT = Join-Path ((npm.cmd root -g).Trim()) '@openai/codex/bin/codex.js'
node scripts/verifier-compte.mjs
```

Résultat attendu : au moins une fenêtre avec un pourcentage restant et une date. Comparez avec votre tableau d’utilisation Codex. Si la lecture échoue, arrêtez ici et vérifiez votre connexion, la version de Codex et les quotas disponibles : inutile de compiler Android tant que cette étape ne fonctionne pas.

## 3. Démarrer le relais Windows

Depuis le même dossier, exécutez :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\demarrer-windows.ps1
```

L’option Bypass s’applique à cette invocation PowerShell, sans modifier durablement votre politique. Vous pouvez lire le script avant de l’exécuter.

Le script crée un jeton aléatoire, limite les droits de son fichier à votre compte Windows et démarre le relais sur `127.0.0.1:8765`. Gardez la fenêtre ouverte. Ctrl+C arrête le relais. Le script ne configure pas de démarrage automatique Windows.

Le fichier du jeton est dans `%LOCALAPPDATA%\ReserveIA\panel-token.txt`. Ouvrez-le localement avec le Bloc-notes pour saisir sa valeur dans l’application Android. Ce jeton est distinct du mot de passe ChatGPT. Ne le publiez pas et ne le mettez pas dans GitHub.

## 4. Relier le Poco au relais en HTTPS privé

Cette étape utilise Tailscale comme réseau privé entre vos appareils ; elle exige un compte Tailscale et une connexion sur les deux appareils. Un VPN déjà actif sur Android peut entrer en conflit avec Tailscale.

1. Installez Tailscale sur le PC depuis https://tailscale.com/download et sur le Poco depuis Google Play. Connectez les deux au même réseau privé Tailscale.
2. Vérifiez que les deux appareils sont connectés.
3. Dans une deuxième fenêtre PowerShell sur le PC :

```powershell
tailscale serve --bg http://127.0.0.1:8765
```

4. Si Tailscale demande d’activer HTTPS, suivez le lien proposé et terminez cette configuration.
5. Notez l’adresse HTTPS affichée. Ajoutez `/quota` à la fin, par exemple `https://nom-machine.nom-reseau.ts.net/quota`. L’exemple n’est pas une adresse utilisable telle quelle.

Utilisez **Serve**, pas Funnel : l’objectif est un accès privé. Il n’y a pas de port à ouvrir sur votre box. `https://127.0.0.1:8765/quota` ne fonctionnera pas sur le téléphone : cette adresse désignerait le téléphone lui-même et le relais ne fournit pas directement TLS.

Ouvrir l’adresse sans jeton peut afficher « Non autorisé » : c’est normal, l’application ajoute le jeton. Cela ne confirme pas encore la lecture des quotas.

## 5. Obtenir le fichier APK

### Méthode A — Android Studio

1. Installez Android Studio depuis https://developer.android.com/studio sur un ordinateur.
2. Ouvrez le dossier qui contient `settings.gradle` comme projet.
3. Installez Android SDK Platform 35 et Build Tools 35.0.0 avec SDK Manager.
4. Utilisez JDK 17 pour Gradle. Le projet utilise Android Gradle Plugin 8.9.2 et Gradle 8.11.1. Aucun Gradle Wrapper n’est inclus : installez Gradle 8.11.1 depuis https://gradle.org/releases/ et sélectionnez cette installation locale dans les paramètres Gradle d’Android Studio.
5. Synchronisez le projet. Puis utilisez le menu Build pour générer un APK de développement ; les intitulés du menu varient selon la version. Autre possibilité avec Gradle installé dans le PATH :

```powershell
gradle :app:assembleDebug
```

6. Le fichier attendu est `app/build/outputs/apk/debug/app-debug.apk`. Une erreur de compilation signifie qu’aucun APK utilisable n’est encore produit. Conservez le message d’erreur pour correction.

### Méthode B — GitHub Actions, sans Android Studio local

Un workflow manuel est inclus dans `.github/workflows/android.yml`. Il n’a pas été exécuté dans la préparation de ce package.

1. Créez un dépôt personnel GitHub, de préférence privé, et ajoutez tous les fichiers du projet à sa racine, y compris le dossier `.github`. N’ajoutez ni jeton, ni fichier d’authentification Codex.
2. Ouvrez Actions, puis « Generer APK personnel », et lancez Run workflow. GitHub peut demander d’activer Actions. Vérifiez les éventuels coûts ou limites de votre compte avant exécution.
3. Attendez une exécution verte. Si elle échoue, consultez l’étape en erreur : l’APK n’est pas disponible tant que la compilation échoue.
4. Téléchargez l’artefact « Reserve-IA-APK-debug » et décompressez-le pour obtenir `app-debug.apk`.

Aucun compte ChatGPT ni secret n’est nécessaire pour compiler. Un APK debug est signé pour le développement, pas pour une publication Play Store. La clé de signature peut changer entre deux compilations GitHub : une mise à jour peut alors exiger de désinstaller l’ancienne version, ce qui efface sa configuration. Une diffusion durable nécessite une signature de distribution conservée.

## 6. Installer et configurer le Poco

1. Transférez `app-debug.apk` sur le téléphone et ouvrez-le avec le gestionnaire de fichiers.
2. Si Android le demande, autorisez temporairement cette source à installer des applications inconnues. Après installation, vous pouvez retirer cette autorisation.
3. Ouvrez « Réserve IA ».
4. Saisissez l’adresse HTTPS se terminant par `/quota` et le jeton du relais.
5. Touchez « Enregistrer et activer le suivi », puis autorisez les notifications.
6. Vérifiez la notification, les pourcentages et l’heure de mesure. Comparez-les à votre compte Codex.
7. Si HyperOS bloque les mises à jour, cherchez les réglages d’activité en arrière-plan / batterie de Réserve IA et de Tailscale. Les noms dépendent de la version du Poco.

Le suivi demande une actualisation toutes les 15 minutes ; Android peut la retarder. Le bouton Actualiser ouvre l’application et déclenche une lecture. La notification peut être balayable selon Android. Ce n’est pas une notification multimédia Spotify ni une garantie d’affichage indélébile.

## 7. Option sans PC personnel allumé : relais Linux / VPS

Cette option remplace le PC Windows par un serveur à vous. Elle ne se sert pas de Codex Cloud comme hébergement. Il faut administrer ce serveur et maintenir son accès au compte. Aucun serveur n’est créé ni payé par ce package.

1. Sur un serveur Linux disposant de Node.js 22+, installez Codex CLI et Tailscale en suivant leurs sites officiels. Utilisez un compte utilisateur dédié et non administrateur pour le relais.
2. Copiez le dossier du package sur le serveur. Connectez Codex avec votre compte :

```bash
npm install -g @openai/codex
codex login --device-auth
```

3. Suivez le lien et le code depuis votre téléphone. Si la connexion par code est indisponible ou refusée pour votre compte, résolvez ce point avant de poursuivre. Ne transférez pas vos identifiants dans un dépôt.
4. Depuis le dossier du package, contrôlez le compte puis lancez le relais :

```bash
node scripts/verifier-compte.mjs
bash scripts/demarrer-linux.sh
```

5. Le jeton est créé dans `~/.config/reserve-ia/panel-token` (ou sous XDG_CONFIG_HOME si défini). Consultez-le localement pour configurer Android. Le processus doit rester actif ; fermer la session SSH peut l’arrêter.
6. Connectez Tailscale au même réseau privé que le Poco, puis configurez :

```bash
tailscale serve --bg http://127.0.0.1:8765
```

Selon les droits du serveur, l’administration Tailscale peut nécessiter sudo. Utilisez l’adresse HTTPS du serveur suivie de `/quota` dans Réserve IA, avec le jeton du serveur.

Pour un fonctionnement durable, configurez le script comme service utilisateur systemd avec votre chemin absolu de projet dans ExecStart et un PATH donnant accès à node et codex. Activez le maintien des services après déconnexion avec `loginctl enable-linger` pour cet utilisateur, si votre politique serveur le permet. Ces réglages dépendent du serveur et ne sont pas automatisés ici. Vérifiez la reprise après redémarrage avant de compter sur le suivi.

## 8. Contrôles et dépannage

| Symptôme | Contrôle |
| --- | --- |
| Lecture du compte impossible | Exécuter `codex login`, mettre à jour Codex, relancer le contrôle du compte |
| Non autorisé / 401 | Vérifier que le même jeton est utilisé sur le relais et le téléphone |
| Lecture impossible / 503 | Vérifier Codex sur la machine du relais ; ne pas remplacer par des chiffres d’exemple |
| Adresse inaccessible | Vérifier Tailscale sur les deux appareils, Serve, HTTPS et la fenêtre du relais |
| Pas de notification | Autorisation Android, suivi activé, restrictions HyperOS |
| Ancienne mesure | Regarder l’horodatage ; tester Actualiser et la disponibilité du relais |
| Une seule réserve | Une seule fenêtre peut être exposée par le compte ; aucune seconde jauge n’est inventée |
| APK refusé en mise à jour | Vérifier la signature ; désinstallation éventuelle avec perte de configuration |

Avant de valider : comparer les chiffres réels, couper le relais et vérifier l’état d’erreur, le relancer, tester écran éteint puis redémarrage, et utiliser Arrêter pour vérifier que le suivi cesse. Ne pas prendre un ancien pourcentage comme une donnée fraîche.

Pour désactiver : touchez « Arrêter et retirer la notification », arrêtez le processus du relais et, si vous ne l’utilisez pour rien d’autre, désactivez sa configuration Serve avec `tailscale serve reset`. Cette commande retire toute configuration Serve de cette machine : vérifiez ses autres usages avant de l’exécuter.

## Sources et détails

- Protocole de quotas : https://learn.chatgpt.com/docs/app-server
- Connexion Codex : https://learn.chatgpt.com/docs/auth
- Tâches Codex Cloud : https://learn.chatgpt.com/docs/cloud
- Réseau privé HTTPS : https://tailscale.com/docs/reference/tailscale-cli/serve
- Installation Android Studio : https://developer.android.com/studio

Le README technique d’origine est conservé sous `README_TECHNIQUE.md`. Aucun mot de passe, jeton réel, clé de signature ou APK compilé n’est inclus.
