# Kline — Forecast Lab

Laboratoire crypto responsive inspiré de la quatrième démonstration de la publication Instagram theaifield. Interface en français, Bitcoin / Ethereum / Solana / BNB, bougies 15 min / 1 h / 4 h / 1 j, tracé en chandeliers ou courbe, zoom et exploration au pointeur ou aux flèches clavier.

Les données proviennent des endpoints publics documentés de Binance, sans clé ni compte. Les calculs utilisent uniquement les bougies clôturées. Une archive réelle et datée est incluse comme repli explicite en cas d’échec du réseau. Le prix instantané et les statistiques sur 24 h sont distincts de la dernière bougie clôturée utilisée par la simulation.

Le moteur **actif** est un bootstrap statistique de blocs de quatre variations logarithmiques, avec 512 trajectoires. Les quantiles 10/25/50/75/90 sont des statistiques des simulations, pas des probabilités calibrées du marché. Kronos n’est pas connecté ; aucune sortie n’est présentée comme provenant de cette IA. Aucun ordre de bourse n’est proposé ni exécuté.

Le test chronologique utilise jusqu’à huit fenêtres non superposées, chacune prédite uniquement à partir du passé. Il compare l’erreur relative finale de la médiane à celle du dernier prix constant, et mesure la couverture empirique de l’enveloppe simulée. Il ne modélise pas une stratégie de trading.

Préférences, cache de cotations et 30 simulations manuelles sont sauvegardés dans localStorage. L’export CSV contient les observations, les quantiles, l’origine des données et la graine reproductible.

Le graphique utilise Three.js 0.187, avec chandeliers instanciés éclairés, volumes indépendants, enveloppes des quantiles en trois dimensions, effets lumineux et inspection au pointeur ou au clavier. Les vues 3D, Face et Plongée modifient uniquement la caméra. La profondeur Z est scénographique, elle ne représente pas une grandeur financière supplémentaire. Sur mobile, le mode Manipuler active la rotation tactile ; le défilement de la page reste disponible par défaut.

Les effets sont mis au repos hors écran et lorsque l’onglet est caché. Le mouvement réduit est respecté. Le pixel ratio est plafonné, le bloom est désactivé sur les petits écrans, et le rendu s’adapte si le temps de dessin devient élevé. Une vue Canvas 2D de secours reste utilisable si WebGL est indisponible ou interrompu.

Le dossier `dist` se sert tel quel, sans dépendance externe à l’exécution du graphique. Les sources Three.js sont dans `src/market-scene.mjs`. Installation : `pnpm install`. Reconstruction du module livré : `node scripts/build-scene.mjs`. Pour actualiser l’archive : `python3 scripts/fetch-snapshot.py`. Vérifications : `pnpm check` (moteur, coordonnées et enveloppes de la scène).

Sources :

- https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md
- https://github.com/shiyu-coder/Kronos
- https://arxiv.org/abs/2508.02739
