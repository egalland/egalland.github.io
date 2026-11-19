# Charge locale de l’observatoire STRATE

Huit IA, soit 48 ouvriers au départ, ont joué huit heures simulées dans chacune des deux implantations testées. Chaque colonie finance ses ordres et déplace ses cargaisons avec les règles du jeu.

## Trente premières minutes

Chaque valeur au 95ᵉ percentile (p95) porte sur les 360 pas de cinq secondes d’une implantation. La colonne réponse indique le maximum brut observé sur les deux implantations, carte complète et camp suivi compris.

| Colonies IA | Pas de simulation au p95 | Projection et JSON au p95 | Plus grande réponse | Parcours initiaux achevés |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0,55 à 1,57 ms | 0,6 à 1,3 ms | 58,21 Kio | 2 sur 2 |
| 4 | 1,57 à 2,4 ms | 1,16 à 1,58 ms | 103,56 Kio | 8 sur 8 |
| 8 | 3,56 à 4,22 ms | 1,22 à 1,43 ms | 157,98 Kio | 16 sur 16 |
| 12 | 5,68 à 6,54 ms | 1,58 à 1,82 ms | 201,56 Kio | 24 sur 24 |

## Huit heures à huit IA

| Implantation | Avant-postes | Guildes | Indépendants | Gisements reconnus | Événements distincts | Lots JSON du journal cumulés |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 28 | 2 | 3 | 155 | 27 080 | 26,03 Mio |
| 2 | 25 | 2 | 3 | 149 | 27 027 | 25,35 Mio |

Les 16 colonies ont achevé les six étapes initiales, sans rejet de commande observé. Le plus grand état préparé pour le stockage atteint 366 938 octets et la plus grande réponse à l’observateur 202 663 octets, avant compression. Les tailles sont relevées tous les pas pendant 30 minutes, puis toutes les dix minutes en visitant chaque camp. Les index et le format physique des lignes SQL peuvent changer l’espace occupé par le journal.

Un essai de rattrapage a groupé les 48 premiers pas en une transaction, avec le plafond CPU levé pour mesurer ce cas. Chaque monde a produit 401 à 403 événements, en 6 lots SQL. Le plus gros paramètre JSON du journal pesait 117 101 octets. D1 accepte jusqu’à 2 000 000 octets par valeur ou ligne. [Limites D1](https://developers.cloudflare.com/d1/platform/limits/)

## Accélération

Le test représente six minutes d’ouverture de l’observatoire, en temps accéléré sur la machine de test. Il utilise le budget serveur de 20 ms par appel et les intervalles de rafraîchissement du client. Les appels s’enchaînent sans latence réseau ni requête SQL.

| Cadence | Vitesse | Appels | Temps simulé demandé | Temps traité | Retard final |
| --- | ---: | ---: | ---: | ---: | ---: |
| Témoin fixe | ×12 | 60 | 4 320 s | 3 005 s | 1 315 s |
| Cadence du client | ×4 | 90 | 1 440 s | 1 440 s | 0 s |
| Cadence du client | ×12 | 181 | 4 320 s | 4 320 s | 0 s |

Le test porte sur l’horloge, l’économie, la carte et le journal locaux. La latence hébergée, le rendu graphique, la charge concurrente et les coûts de la base en production restent à mesurer. Les deux séries partagent la géologie de la planète et varient les identifiants et implantations de départ.

Reproduction depuis la racine du projet avec `node scripts/benchmark-ai.mjs`. Les résultats détaillés, les horaires et les tailles sont dans [ai-capacity.json](ai-capacity.json).
