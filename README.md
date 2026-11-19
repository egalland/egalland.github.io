# Sudoku des saisons — monde 3D vivant

Jeu en français : plateau de sudoku modélisé dans la scène WebGL temps réel. Choisir une saison et une difficulté, créer une partie ou reprendre la sauvegarde.

## Vraie 3D pendant la partie

Le jeu utilise Three.js local (MIT) et des modèles 3D procéduraux construits dans `dist/models.js`. Ce sont des maillages volumétriques, éclairés et ombrés, avec articulations pour les personnages. Les modèles réagissent aux déplacements de caméra. Aucun diorama PNG n’est utilisé pendant la partie. Les quatre PNG précédents restent uniquement des illustrations des choix de saison dans le lobby.

Quatre maps : printemps, plage estivale, Halloween et hiver. Chacune possède quatre personnages avec tête, bras, mains, jambes/chaussures ou corps de fantôme ; marche, salutation, livraison d’un chiffre, réaction aux erreurs et danse. Environnement avec arbres, cabane, porte, banc, mare et canard ; fleurs, parasols, citrouilles, lanternes ou bonshommes de neige selon la saison.

La grille visible est un objet de scène : cadre en volume, 81 dalles, séparations 3×3, chiffres et notes appliqués aux surfaces et pieds posés au sol. Le plateau conserve une orientation frontale pour la lisibilité. Les clics/touchers sur ses maillages sélectionnent les cases par raycasting. Une copie HTML invisible conserve les commandes clavier et l’accessibilité, et sert de solution de secours pendant le chargement ou si WebGL échoue.

## Évolution durant la partie

Les bonnes réponses font apparaître progressivement de nouveaux objets. Chaque ligne, colonne ou carré 3×3 achevé déclenche une animation collective. La bonne réponse lance une livraison de chiffre ; combo et victoire font danser la brigade et produisent des particules 3D. Erreur et indice déclenchent des réactions distinctes.

La map se réinitialise pour une nouvelle partie. La sauvegarde restaure la grille et son niveau d’avancement ; aucun parc ne s’accumule entre les parties.

## Interactions directes

Cliquer sur la cabane ouvre sa porte ; arbre secoué, fleurs arrosées, parasol tournant, citrouille qui rebondit, lanterne allumée, boule de neige, canard qui barbote, salutation des personnages. Bouton « Interagir avec le décor » pour une interaction accessible au clavier. Chaque interaction gèle le compte à rebours du combo pendant trois secondes. Glisser explore le décor dans un angle limité ; boutons +/− et molette zooment le décor. La grille conserve son cadrage.

Pause : le temps du jeu et la scène sont suspendus. L’onglet masqué suspend la partie. Réduction des animations, sons facultatifs. WebGL requis pour la scène ; message explicite en cas d’indisponibilité, grille jouable.

## Sudoku

Trois difficultés, génération à solution unique. 90 secondes par défaut pour enchaîner, options 120/180 secondes ou sans limite. 100 points × multiplicateur (plafond ×10). Erreur ou indice interrompt la série. Trois indices. Sauvegarde locale, sans synchronisation entre appareils.

## Validation

Moteur : 36 grilles uniques testées lors de sa création. Régression v4 : création, sélection map, 81 boutons, notes, score, combos, erreurs, indices, pause, délai, suspension pendant une interaction, zen, reprise, victoire et nouvelle partie.

Modèles : maillages/sommets finis, personnages articulés, groupes interactifs sur les quatre maps. Tests de scène utilisant les vrais objets Three.js avec rendu GPU remplacé par un stub : matrices, mouvement, progression, livraison, particules, raycasting direct sur la cabane, pause et cadrage mobile. Les modèles ont été regroupés par instanciation pour limiter les appels de dessin. Contrôle de syntaxe, IDs DOM et imports locaux.

Limite : ni le GPU WebGL ni le rendu final dans un navigateur n’ont pu être vérifiés dans cet environnement, faute du navigateur de test requis par Sites. Le rendu est donc à contrôler sur les appareils de jeu réels.

## Dépendances et lancement

`dist/vendor/three.module.js`, `three.core.js` et `THREE-LICENSE.txt` sont embarqués. Aucun CDN utilisé. Servir `dist/` via HTTP (les modules ES ne sont pas pris en charge en ouverture `file://` selon le navigateur).


## Correctif mobile

Feuille de style consolidée pour supprimer les anciennes règles contradictoires. Grille 9×9 avec lignes de hauteur contrainte, barre de chiffres/notes/indices fixe en bas sur mobile, marges de sécurité, restauration du cadrage après création/reprise. Le décor autorise le défilement vertical ; ses positions dépendent désormais des dimensions réelles de la grille, au lieu de coordonnées fixes prévues pour une page de plus de 1000 pixels.

La grille et le menu démarrent avant le téléchargement/initialisation de Three.js. Les choix du menu ne construisent plus de scène 3D ; celle-ci est créée une seule fois au lancement de la partie. Sur mobile : rendu plafonné à environ 30 images/s, ratio de pixels limité et ombres dynamiques désactivées. Une erreur de rendu 3D laisse la grille utilisable. Migration défensive des anciennes sauvegardes.

Vérification : parcours complet sans charger le module WebGL, restauration du scroll, migration de sauvegarde et calculs de scène sur cinq dimensions mobiles. Le rendu dans un navigateur et sur appareil réel reste non vérifié dans cet environnement.


## Plateau intégré à la scène

`dist/board3d.js` construit le plateau, ses 81 maillages de cases, matériaux de chiffres/notes, séparations et supports. Le plateau projette des ombres et est rendu avec les personnages et les accessoires par le moteur 3D. Le cadrage garde la grille droite et adapte sa taille aux dimensions disponibles sur mobile. Bonnes réponses et indices soulèvent brièvement les cases ; les erreurs les secouent. Les effets 3D démarrent à la position de la case concernée.

Vérification : sélection par raycasting des 81 cases dans les quatre saisons et cinq dimensions mobiles ; chiffres, notes, teintes d’indices et retour des cases à leur position initiale après animation ; régression du jeu et du démarrage indépendant du WebGL. La vérification utilise les vrais objets/matrices Three.js avec rendu GPU simulé ; le rendu WebGL sur navigateur/appareil réel reste à vérifier.


## Comportements autonomes

`dist/behaviour.js` contient une simulation indépendante du rendu : grille de navigation, A* à huit directions sans traversée des coins bloqués, lissage de chemin avec contrôle de visibilité, sélection d’activités par utilité, besoins (énergie, curiosité, travail), préférences individuelles, mémoire des derniers lieux, réservation exclusive des équipements, évitement local entre personnages et recalcul après blocage. Les personnages suivent les points du chemin à vitesse bornée ; ils ne sont plus interpolés sur une boucle rectangulaire imposée.

Les plantes se dessèchent et peuvent être arrosées par un personnage équipé d’un arrosoir 3D. Les habitants inspectent les lieux, entretiennent les équipements, font une pause et répondent aux demandes prioritaires du sudoku. Les bonnes réponses déclenchent une mission de livraison ; indices, erreurs et combos changent leurs priorités. Cliquer sur un objet déclenche sa réaction et peut attirer un habitant. Les nouveaux objets apparus pendant la partie modifient les possibilités d’activité et la navigation. Le bouton « Chemins » affiche les trajets A* dans la scène.

Le cadrage mobile réserve davantage d’espace autour du plateau aux personnages et aux objets. Validation : simulation déterministe de 200 secondes avec quatre agents, activités variées achevées, réservations exclusives, aucun franchissement d’obstacle, livraison prioritaire, puis régression sur les quatre maps, le plateau et cinq formats mobiles. Le GPU/rendu final n’a pas été vérifié dans un navigateur réel dans cet environnement.
