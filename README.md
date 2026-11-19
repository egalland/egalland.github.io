# STRATE — Observatoire de colonisation

La version en ligne est une simulation de huit colonies IA sur une seule planète cubique. Depuis son compte connecté, le propriétaire peut parcourir la carte librement, suivre une colonie, lire les journaux persistants et comparer les factions et les guildes. Les instructions de construction et de transport ci-dessous décrivent les règles appliquées aux agents.

Les huit agents ont quatre métiers et huit doctrines. Une implantation dépend d’un filon reconnu, des fonds et des matériaux disponibles, de la distance au réseau et de l’arrivée du convoi. Les guildes fonctionnent par invitations et décisions individuelles. Le camp principal et les avant-postes établis comptent dans le territoire. Les décors, bâtiments, unités et créatures conservent leur direction artistique en laine.

La vitesse de simulation est partagée entre les vues du propriétaire. Les vitesses proposées sont ×1, ×4 par défaut et ×12. Le serveur calcule les pas lors des consultations, avec un budget de calcul par requête et un horizon maximal de quatre heures simulées lors d’une reprise. L’horloge de la caméra est indépendante. Une mise à jour ouvre une nouvelle génération et conserve le journal des générations précédentes.

## Monde et exploration

Chaque face mesure 4 096 m de côté. Les 24 villes neutres desservent des secteurs de peuplement. Les nouveaux camps rejoignent en priorité un secteur habité disposant de terrains libres, à distance de marche du même marché. La grille de construction garde ses cases de 8 m. Chaque joueur connaît uniquement sa ville la plus proche au départ. Un éclaireur, une escouade ou un transporteur découvre les autres villes à moins de 300 unités. Les positions inconnues sont exclues des réponses serveur. La reconnaissance automatique passe d’abord par la ville de départ, puis explore les alentours et les faces voisines. Le déplacement de la caméra ne déclenche aucune découverte.

Le départ dispose d'un rayon de 500 unités calme côté créatures. Les bases peuvent être attaquées par des joueurs. Les villes et leurs entrepôts constituent les zones de paix. Les gisements éloignés peuvent abriter des camps qui reviennent après douze minutes. Une installation endommagée arrête sa production jusqu'à réparation.

## Récolte et transport

Les gisements ont une réserve commune finie, dimensionnée pour plusieurs jours de production. Au plus trois foreuses peuvent exploiter le même gisement. Chaque unité produite diminue la réserve, puis attend au chantier avant son enlèvement. Le terrain est conservé.

Les camions sont affectés à la collecte, au fret marchand ou à l'attente au dépôt. Une réaffectation termine le trajet en cours. Un convoi marchand débite sa cargaison au départ puis crédite l'entrepôt de la ville à l'arrivée. Une commande de rapatriement réserve le stock en ville et effectue les deux trajets avant de créditer la base. Le troc et les ventes entre joueurs utilisent les marchandises présentes dans la même ville.

Les escouades attaquent les camps, les foreuses adverses, les bases et les convois repérés. Une escorte suit physiquement un camion. Les assauts consomment des crédits et des munitions. Le butin est transporté par l'escouade et doit revenir à la base. Les membres d'une même guilde bénéficient d'un pacte de non-agression.

La simulation progresse à la consultation du monde et rejoue au plus quatre heures d'absence. Elle utilise une transaction de version en D1. Les ordres sont dédupliqués par leur identifiant. La remise à zéro du 8 novembre 2026 ouvre l'univers persistant `strate-release-<empreinte>` et ses propres chunks. Les anciennes données restent archivées. La règle de version décrite ci-dessous remplace désormais cet identifiant historique à chaque mise à jour.

Six ouvriers à pied, initialement inactifs, sont offerts à chaque nouveau camp. Aucun camion ni MAM ne se crée automatiquement : le joueur place son MAM et toutes ses machines sur la grille. Les collecteurs vont physiquement au gisement, récoltent trois minerais en une minute et rapportent leur cargaison. Chaque départ coûte 4 CR et conserve une réserve de 50 CR. Ils peuvent aussi ramasser le stock des foreuses ou porter du minerai vers les comptoirs des villes connues, où les lots arrivés deviennent vendables. Le portage marchand conserve les réserves de chantier et coûte également 4 CR par départ. Le dépôt plein, un filon épuisé ou un manque de crédits suspend les départs sans supprimer les marchandises.

## Spécialisation et économie de services

Le MAM propose l'industrie et trois branches spécialisées de trois niveaux : extraction, transport et milice. Les analyses consomment les ressources du dépôt et prennent du temps. Une seule analyse peut fonctionner à la fois. Commencer une deuxième branche coûte 50 % de ressources en plus ; aucune spécialité n'est définitivement exclue.

Un joueur peut publier une demande de fret ou d'escorte et réserver sa prime. Les spécialistes peuvent aussi annoncer une unité disponible et son tarif pendant 24 heures. Engager une offre réserve atomiquement le camion et le lot : le même service ne peut pas être vendu à deux clients. Le fret est payé après livraison effective. Une cargaison volée ne se recrée pas et rend la prime au client. L'escorte suit le convoi, défend réellement contre les attaques et exige quatre minutes de présence sur cinq après arrivée.

Les factions participent à un effort collectif de sept jours, financé par des dons de ressources et des missions réussies. Chaque membre est limité à 1 000 points par manche. Les factions en tête, y compris à égalité, gagnent +10 % de production des foreuses pour la manche suivante seulement. Les points repartent à zéro à chaque manche.

## Commandes

- Glisser avec le bouton droit pour parcourir le terrain, molette pour zoomer en continu jusqu'à la planète, bouton du milieu pour orienter. Le zoom rapproché utilise une grille orthogonale pour construire des lignes d'usines ; le bouton Zoom usine revient à cette échelle.
- Sélectionner une unité, clic droit pour lui donner un ordre.
- 1, 2, 3, 4 et 5 sélectionnent éclaireur, escouade, première foreuse, premier transporteur et collecteurs. Les touches physiques sont reconnues sur AZERTY.
- M choisit une destination, A une cible d'attaque, P une patrouille, S arrête la sélection.
- Glisser à gauche sélectionne un rectangle ; Maj ajoute à la sélection. Le double clic sélectionne le même type d’unité visible. G puis 1 à 4 mémorise un groupe. Les groupes mixtes reçoivent un déplacement en formation ou un arrêt sur leur position interpolée ; les missions de fret actives restent protégées.
- H recentre sur la base, B ouvre sa gestion, C ouvre le comptoir connu, F installe une foreuse sur un gisement sélectionné. Le bouton ? présente les commandes.

## Usines et déblocages

Deux minerais sont actifs, le fer (clé persistée `ferrite`) et le cuivre. Les stocks de titane/prisme existants sont convertis une fois en minerai ordinaire, avec une compensation en crédits conservant la valeur de vente. Les anciennes constructions restent utilisables.

Les fonderies transforment le minerai en plaques. La presse fabrique des engrenages, la tréfileuse des câbles, l'assembleuse des circuits et des moteurs, le laboratoire des dossiers de recherche. Chaque fabrication consomme les tampons d'entrée et alimente son tampon de sortie. Les trois ports bleus acceptent des lignes séparées. Les convoyeurs, chargeurs filtrés, coffres et retours au dépôt assurent les transferts physiques. Une réserve configurable de chantier laisse par défaut 20 fer et 5 cuivre au dépôt.

Les entrepôts servent de tampons locaux et ajoutent chacun 300 places au dépôt, avec quatre agrandissements maximum. La caserne permet le recrutement militaire. L'atelier de réparation restaure une unité proche en consommant du fer. Tous les bâtiments occupent une empreinte sur la même grille et respectent les collisions.

L'arbre industriel comporte 22 technologies sur neuf paliers, avec prérequis, composants et durées cumulées dépassant deux jours. Chaque branche reste accessible au même joueur. Les recherches débloquent les foreuses, entrepôts, casernes et ateliers, ainsi que des améliorations effectives de vitesse, densité des tapis, rendement du forage et capacité. La motorisation et un atelier actif permettent d’assembler un véhicule en consommant deux moteurs. Les circuits automatiques en un clic sont désactivés ; chaque machine et chaque liaison se place manuellement. Les validations sont côté serveur. V ouvre l'usine, T trace les convoyeurs, R tourne la construction, Échap quitte la pose.

La vue **Laine**, activée par défaut, conserve les illustrations détaillées d'origine pour les bâtiments et machines. La caméra tourne par quarts de tour avec Q/E ou un clic sur la molette ; les illustrations restent verticales et les ports, tapis et positions suivent la grille orientée. Les ouvriers, éclaireurs, groupes d'infanterie et camions échantillonnent désormais des atlas de huit directions et quatre poses ; leur dernière direction reste conservée à l'arrêt. La vue **Volumes** utilise également des rotations de 90° et et utilise des volumes avec une matière feutrée, des bords adoucis et des coutures. Les tapis sont volumétriques dans les deux vues et gardent leurs flèches de circulation. Les machines n'animent que leurs parties actives, et les vues respectent le mouvement réduit.

## Remise à zéro et joueur test

Chaque modification de code ou d'art produit un identifiant déterministe avec `scripts/prepare-release.mjs`, appelé au démarrage et au build. Le monde et les chunks utilisent cet identifiant : la nouvelle version commence donc sans les bases, stocks ou recherches précédents. Un rechargement de page et une reconstruction identique conservent le monde de la version courante. Les univers antérieurs restent archivés.

Alba, Bram, Cendre, Dune, Écluse, Fanal, Grès et Hermine démarrent avec six ouvriers, 800 CR, 200 fers et 60 cuivres par camp. Les stratégies locales émettent leurs ordres toutes les dix secondes simulées au démarrage, puis toutes les vingt secondes après le parcours initial, avec des décalages entre les colonies. Leurs achats, déplacements, constructions et ventes passent par le moteur.

Le test `check-playtester.mjs` exerce les quatre métiers pendant huit heures simulées dans deux mondes indépendants. Le résultat est conservé dans `docs/playtest-report.json` et `docs/playtest-profiles.json`.

Les ordres de déplacement acceptent désormais les coordonnées décimales réelles de la souris, arrondies côté serveur après validation. **M puis clic** déplace toujours les unités, même si le clic touche un gisement ou un bâtiment. Un clic droit sur un sol libre déplace immédiatement la sélection ; sur une cible ou avec Alt, il ouvre le menu. Le glissement droit ou les flèches déplacent la caméra, Espace recentre la sélection, Q/E tournent de 90°. Le zoom depuis la planète revient toujours sur une orientation orthogonale. Les ordres rapides sont mis en file, sans abandon silencieux pendant une requête précédente.

## Vérification

- `node scripts/check-playtester.mjs` vérifie les six étapes initiales et la progression prolongée des quatre métiers. `node scripts/check-colonies.mjs` vérifie les huit doctrines, les déplacements des convois et les décisions de guildes.

- `node scripts/check-diagnostics.mjs` contrôle les écritures de journal sous concurrence, filtres, archives, masquage des positions et reprise fractionnée de quatre IA.
- `node scripts/check-rts.mjs` contrôle le départ à pied, la construction manuelle, les groupes mixtes, les arrêts et changements de destination sans téléportation ni perte de cargaison, le portage marchand réel, les prérequis des véhicules, les recherches longues et les orientations des modèles.

- `node scripts/check-factory.mjs` vérifie les boucles complètes, les recettes à plusieurs entrées, les dossiers de recherche et moteurs, les 22 technologies, les réserves, la pause, les migrations, la conservation, les répartiteurs et la reprise hors ligne.
- `node scripts/check-observatory.mjs` exerce la route privée actuelle, la concurrence entre consultations, la vitesse et les archives. `node scripts/check-frontier.mjs` rejoue les commandes du mode multijoueur historique avec SQLite.
- `node scripts/check-cooperation.mjs` contrôle les six collecteurs, les coûts MAM, les offres et contrats, l'escorte effective, les manches de faction et la remise à zéro isolée.
- `node scripts/check-economy.mjs` couvre le troc, les paiements en composants et la reprise des lots.
- `node scripts/check-research-rights.mjs` couvre les améliorations et droits historiques.
- `python scripts/check-sprites.py` contrôle les couches alpha et les poses distinctes des atlas et des planches détaillées.
- `node node_modules/typescript/bin/tsc --noEmit` puis le build Vinext contrôlent le client et le Worker.

## Journal persistant et charge IA

La table D1 `game_activity` conserve séparément du monde les commandes acceptées, refus et bilans de production/livraison à la minute. Un ordre rejeté est journalisé après restauration de l’état précédant l’ordre. Les entrées ne sont écrites que par la transaction ayant gagné la mise à jour du monde : une course ou une répétition de requête ne crée pas de doublon. Les tokens, comptes et contenus privés des discussions sont exclus. Les coordonnées des autres humains sont masquées dans la consultation.

L’onglet Journal propose les filtres colonie, catégorie, version et recherche, puis des pages de 60 événements avec leur contexte. Les archives restent accessibles après les remises à zéro. La route de lecture du journal est indépendante de l’avancement du monde.

Le benchmark `scripts/benchmark-ai.mjs` compare 1, 4, 8 et 12 IA sur les trente premières minutes et poursuit les deux essais à huit IA jusqu’à huit heures simulées. Les résultats locaux sont dans `docs/ai-capacity.json` et `docs/benchmark-observatoire.md`. Chaque consultation traite au plus 48 pas, avec un budget visé de 20 ms. Le panneau indique le retard restant.

Les filons fer/cuivre ont des repères et étiquettes contrastés, de nouvelles illustrations en laine, et deux raccourcis pour les retrouver hors écran. Le sol utilise une texture de feutre moins contrastée ; la grille fine apparaît en construction ou sur demande.

Les IA surveillent leur budget après le parcours initial. Avant de manquer de crédits, elles suspendent les chargeurs, affectent davantage d’ouvriers au commerce du cuivre et réduisent la collecte lorsque le stock suffit. Elles reprennent les lignes quand leur trésorerie est reconstituée. Si elles sont déjà à court, elles peuvent démonter une de leurs constructions avec le remboursement normal du jeu. Le test d’endurance de quatre agents couvre deux heures simulées, sans changer les coûts ni ajouter de monnaie.

### IA de progression (stratégies v2)

Quatre profils utilisent les mêmes ordres que les joueurs : Alba développe les chaînes industrielles, Bram le stockage et les véhicules, Cendre la prospection et les chantiers, Dune la milice et les factions. Le MAM, les trajets, les composants et les réparations sont payés normalement. Les agents ne jugent pas le rendu ni les gestes de la souris.

Les chargeurs disposent de prélèvements par lots bornés (0 à 256) accessibles dans le panneau Usine. Les réserves commerciales et le cumul frais/ventes sont dans Collecteurs. Les journaux indiquent stocks raffinés, objectifs, recettes et état des éléments. Un retour de marchandises au dépôt est distingué du minerai livré pour la première fois.

Chaque build impose deux essais indépendants de huit heures simulées. Les stratégies doivent être revues avec les journaux à chaque évolution de gameplay, sans masquer les échecs en abaissant les critères. Les six étapes de démarrage sont conservées mais ne suffisent plus à valider une version.

Les deux minerais sont garantis dans un rayon calme de 500 m au démarrage : si la géographie locale n’en fournit pas un, un gisement normal de 8 000 unités est placé, sans ajouter de minerai au stock. Les paliers Transport améliorent aussi les ouvriers : charges de 3 / 5 / 7 / 9 et vitesses de 8 / 10,4 / 12,8 / 15,2 m/s. Les prix de départ restent inchangés.
