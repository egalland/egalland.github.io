# Banque de réponses — Sans voyelles

## Objectif

500 réponses par thème (cinéma, personnalités, lieux, animaux), soit 2 000 réponses. Les 60 positions de la version précédente sont conservées pour que les indices des parties déjà lancées restent valides.

## Sélection

Les candidats proviennent des articles francophones de Wikipédia : modèles d’infobox cinéma, biographie, sport, musique et géographie ; catégories de noms vernaculaires d’animaux ; complément éditorial de noms courants d’animaux. Les premières recherches sont ordonnées par nombre de liens entrants. La notoriété des nouvelles réponses combine leur rang de liens entrants (65 %) et les consultations disponibles de la fiche française sur les 60 derniers jours (35 %, échelle logarithmique), via `prop=pageviews` et `pvipdays=60` de l’API MediaWiki. Une revue éditoriale favorise les noms courants d’animaux et les lieux familiers et retire notamment les courts-métrages anecdotiques et les articles hors thème. Des seuils de consultations connues éliminent les fiches très peu lues (2 000 pour les films, 3 000 pour les personnes et lieux, 500 pour les animaux ; noms courants d’animaux exceptés). Les lieux sans chiffre ne sont retenus que parmi une sélection éditoriale de noms familiers. Les consultations non retournées par l’API restent explicitement inconnues dans l’audit ; elles ne sont pas comptées comme zéro. Pour la sélection seulement, elles prennent une valeur neutre.

Ce classement sert de **proxy de notoriété dans le vivier de candidats**, pas de classement exhaustif des 500 sujets les plus populaires au monde. Il dépend du public francophone, de l’actualité, des catégories et des modèles utilisés. Les termes sans consonne affichable, doublons, homonymies et noms inadaptés au thème sont écartés.

Les chiffres disponibles, les scores de sélection et la période effective sont enregistrés dans `bank-selection.json`. Les réponses, variantes acceptées et références d’illustrations sont dans `../lib/question-bank.json`.

## Sources et illustrations

- [API MediaWiki — consultations d’articles](https://www.mediawiki.org/wiki/Extension:PageViewInfo/API)
- [API MediaWiki — recherche](https://www.mediawiki.org/wiki/API:Search)
- [API MediaWiki — catégories](https://www.mediawiki.org/wiki/API:Categorymembers)
- [API MediaWiki — images des pages](https://www.mediawiki.org/wiki/Extension:PageImages/API)
- [Wikimedia — définition d’une consultation](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html)

Les descriptions courtes issues de Wikidata servent de légendes. Les images sont des références distantes vers les fichiers indiqués par les articles. Les droits et crédits de chaque image restent accessibles sur sa fiche source. Les affiches disponibles sur l’article anglais peuvent servir de secours aux fiches françaises sans image. Les fichiers image ne sont pas copiés dans le dépôt.

Les métadonnées d’image sont résolues lors de la préparation de la banque ; le jeu conserve une recherche de secours et un état sans image si les services distants sont indisponibles. Aucune collecte de popularité n’est exécutée pendant les parties.
