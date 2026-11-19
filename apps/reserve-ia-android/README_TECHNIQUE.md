# Réserve IA — prototype Android natif 0.1

Notification de suivi des quotas ChatGPT Work / Codex : pourcentage restant par fenêtre renvoyée par le service, date de renouvellement, date de mesure et bouton Actualiser. Aucun quota n’est inventé, aucun mot de passe OpenAI n’est demandé au téléphone.

## État réel

- Code source Android et relais Node.js fournis.
- Tests de transformation, authentification et protocole du relais exécutables avec `node --test bridge/server.test.mjs`.
- APK NON compilé : SDK Android et Gradle absents de l’environnement de création. Interface et notification NON testées sur appareil.
- Connexion réelle au compte NON testée. La lecture repose sur la méthode officielle Codex `account/rateLimits/read`, qui dépend de la version installée, du compte et des quotas réellement exposés.
- Ce suivi concerne les quotas exposés par Codex / Work, pas tous les modèles et outils de ChatGPT classique.
- Pas de suivi quotidien ni d’alertes de seuil dans cette première version.

## Fonctionnement

Téléphone Android → HTTPS privé → relais sur votre ordinateur → Codex connecté à votre compte.

L’ordinateur doit rester allumé et connecté. Aucune solution autonome exclusivement sur téléphone n’est validée dans ce projet. Le jeton du relais n’est ni une clé API OpenAI ni votre mot de passe ChatGPT. Les identifiants OpenAI restent gérés par Codex sur l’ordinateur. Ne jamais copier le fichier d’authentification Codex sur un site public.

## Préparer le relais

1. Installer une version récente de Codex CLI sur l’ordinateur puis utiliser `codex login` pour connecter votre propre compte. Node.js 22+ est recommandé.
2. Créer un jeton aléatoire et le conserver dans un gestionnaire de mots de passe : `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Fournir ce jeton dans la variable d’environnement `PANEL_TOKEN`, puis lancer `node bridge/server.mjs`. Sous PowerShell : `$env:PANEL_TOKEN = 'votre-jeton'`, puis `node bridge/server.mjs`. Ne pas placer cette valeur dans le code ou un dépôt.
4. Le serveur écoute exclusivement `127.0.0.1:8765`. Configurer un accès HTTPS privé vers ce port, avec un certificat reconnu par Android, par exemple via votre VPN personnel et son reverse proxy TLS. C’est une étape de déploiement à réaliser ; aucun hébergement n’est fourni. Ne pas exposer directement Codex app-server ni ouvrir son port sur Internet.
5. L’URL finale doit être `https://votre-hote-prive/quota`. Le proxy doit transmettre l’en-tête Authorization, ne pas journaliser sa valeur et ne pas mettre en cache la réponse.

Le relais accepte uniquement GET /quota avec `Authorization: Bearer <PANEL_TOKEN>`. Cache de 60 secondes ; échec de lecture = HTTP 503, jamais une fausse valeur fraîche. La clé du relais autorise seulement la lecture des quotas de ce serveur. Une clé API OpenAI ne remplace pas la connexion de l’abonnement ChatGPT.

## Construire et installer l’application

1. Ouvrir ce dossier comme projet dans Android Studio.
2. Installer le SDK Android 35 et utiliser JDK 17. Projet configuré avec Android Gradle Plugin 8.9.2 et Gradle 8.11.1 ; configurer cette distribution dans les paramètres Gradle d’Android Studio. Aucun wrapper binaire n’est inclus.
3. Synchroniser et utiliser Build → Generate App Bundles or APKs → Generate APKs (ou `gradle :app:assembleDebug` si Gradle 8.11.1 est installé).
4. Installer l’APK de développement sur le Poco. Cette étape nécessite l’autorisation Android d’installation depuis la source choisie. Un APK de distribution doit ensuite être signé avec une clé personnelle durable.
5. Ouvrir Réserve IA, saisir l’URL HTTPS et le jeton du relais, puis Enregistrer et activer. Autoriser les notifications quand Android le demande.
6. Vérifier l’apparition de valeurs réelles et comparer celles-ci au tableau d’utilisation OpenAI. L’actualisation n’est annoncée comme réussie qu’après une réponse valide récente.

## Comportement Android / Poco

Notification dépliable textuelle, discrète, sans imitation de lecteur multimédia. Le bouton Actualiser ouvre l’application et déclenche une lecture, pour rester compatible avec les restrictions Android. Une mise en page native avec deux barres graphiques pourra être ajoutée après validation sur Poco.

JobScheduler demande une lecture toutes les 15 minutes, et conserve la planification au redémarrage. Android / HyperOS peuvent retarder l’exécution : aucune garantie de suivi en temps réel. Si nécessaire, régler les autorisations d’activité en arrière-plan de l’application sur le téléphone ; les intitulés varient selon HyperOS.

La notification est marquée ongoing, mais les versions récentes d’Android peuvent permettre de la balayer. Elle n’est donc pas garantie indélébile. Le bouton Arrêter désactive les lectures planifiées et retire la notification. Aucune lecture en échec ne remplace silencieusement les anciennes données par des valeurs prétendument à jour.

Le jeton est chiffré avec une clé Android Keystore ; sauvegarde Android désactivée ; trafic HTTP en clair refusé ; redirections HTTP refusées pour protéger l’en-tête d’authentification.

## Vérification sur appareil restant à faire

- Compiler, installer et vérifier autorisation accordée / refusée.
- Comparer les fenêtres et leurs pourcentages au compte réel.
- Couper le relais : vérifier état d’erreur et horodatage des anciennes données.
- Vérifier suivi après redémarrage, écran éteint et restrictions HyperOS.
- Tester Arrêter pendant une lecture puis vérifier que la notification ne réapparaît pas.

## Documentation utilisée

- https://learn.chatgpt.com/docs/app-server — account/rateLimits/read, protocole et handshake.
- https://developer.android.com/reference/android/app/job/JobInfo.Builder — planification périodique.
- https://developer.android.com/about/versions/14/behavior-changes-all — notifications ongoing pouvant être rejetées.

Application personnelle indépendante, sans affiliation officielle à OpenAI.
