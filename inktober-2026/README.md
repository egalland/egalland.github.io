# Inktober 2026 — Le calendrier des ombres

Calendrier prévu en page d’accueil : https://egalland.github.io/. Le chemin /inktober-2026/ conserve également une copie du calendrier.

Le dossier contient les fichiers statiques du calendrier, les corrections mobiles, les idées quotidiennes et les calculs de temps/coûts. L’ancienne page d’accueil est remplacée ; elle reste récupérable dans l’historique Git.

## Sauvegarde privée (version transitoire)

Le bouton « Connecter ma sauvegarde » ouvre la page de connexion du calendrier Sites existant. Après autorisation explicite, cette fenêtre transmet les demandes à l'API authentifiée du calendrier. Garder cette fenêtre ouverte pendant l'édition. Les descriptions, liens, durées et tarifs restent dans la base D1 privée existante et ne sont pas copiés dans ce dépôt public.

La consultation des thèmes et des idées est possible sans connexion. Les données personnelles et formulaires apparaissent après connexion. Sans connexion, ouvrir une porte ne sauvegarde aucun état de compte.

Le transport accepte exclusivement l'origine du calendrier Sites, la fenêtre ouverte par le bouton et un identifiant aléatoire de session. Le pont Sites accepte exclusivement https://egalland.github.io et les opérations du calendrier. Aucun jeton de compte ni secret n'est stocké dans le dépôt ou le navigateur.

## Travail restant pour quitter Sites

La connexion GitHub de l'interface admin et l'import des dépôts d'apps ne sont pas implémentés. Une migration complète nécessite une authentification et un service serveur configurés, ainsi qu'un export de la base D1. Le calendrier conserve actuellement sa dépendance à Sites pour les données personnelles.
