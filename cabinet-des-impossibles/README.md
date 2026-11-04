# Le Cabinet des impossibles

Un atelier personnel de curiosités en 3D : inventer des objets, leur confier un souvenir et visiter son propre salon. Projet commun aux huit thèmes Inktober 2026 restants d’Emmanuel Galland.

## Fonctionnalités

- Salon Three.js avec architecture, éclairages, ombres, huit sculptures procédurales et caméra orbitale.
- Huit comportements combinables : reconstitution, envol impossible, respiration du salon, ouverture à fermeture éclair, mouvement absurde, célébration, protection de verre, flexion.
- Création de 24 objets maximum : nom, histoire, secret, forme, couleur, photo, emplacement, taille et rotation.
- Déplacement par Maj + glisser sur ordinateur et curseurs utilisables au clavier et sur mobile.
- Sauvegarde IndexedDB dans le navigateur. Export/import JSON incluant les images ; annulation des 30 dernières modifications pendant la session.
- Trois ambiances lumineuses, son facultatif produit localement, visite guidée, capture PNG et plein écran.
- Adaptation mobile, parcours clavier, mouvement réduit et suspension de l’animation lorsque l’onglet est masqué.

Les huit pièces initiales et leurs textes sont des exemples. Aucun compte, service IA ou serveur de données n’est nécessaire. Les créations ne sont pas synchronisées entre appareils ou origines : utiliser l’export/import pour les transférer. Les polices Google Fonts sont facultatives ; les polices système prennent le relais si elles sont indisponibles.

## Développement

Node.js 24 conseillé (tests TypeScript natifs).

```sh
cd source
npm ci
npm run dev
npm test
npm run build
```

Vite produit `dist/`, déployable dans un sous-répertoire grâce aux chemins relatifs. TypeScript et Three.js sont regroupés localement ; aucun CDN JavaScript requis.

## Thèmes

| Jour | Thème | Objet initial |
|---|---|---|
| 11 | Sauvetage | Ce qui reste |
| 18 | Incapable de voler | Le rêve d’Icare |
| 20 | Salon | Une place pour l’absence |
| 26 | Fermeture éclair | De l’autre côté |
| 27 | Stupide | Le gardien distrait |
| 28 | Trophée | La petite victoire |
| 29 | Défense | Le dernier printemps |
| 31 | Fléchir | L’élégance de céder |

## Vérification du 4 novembre 2026

Compilation TypeScript et production réussies. Six tests valident les imports, les données invalides et les aller-retours JSON. Vérification dans le navigateur : création, modification au clavier, combinaison de comportements, révélation du secret et restauration après rechargement.

Le navigateur de vérification ne propose pas WebGL. Le rendu GPU et les gestes sur la scène n’ont donc pas pu être contrôlés visuellement dans cet environnement. La collection et l’atelier restent accessibles si WebGL manque, avec un message explicite. Une carte graphique compatible WebGL 2 est nécessaire pour la scène.

Ce projet compte pour huit thèmes, mais reste un seul projet : ne pas multiplier ses temps ou volumes de code par huit.
