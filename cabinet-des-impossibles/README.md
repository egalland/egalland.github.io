# Le Cabinet des impossibles

Un atelier personnel de curiosités en 3D : inventer des objets, leur confier un souvenir et visiter son propre salon. Projet commun aux huit thèmes Inktober 2026 restants d’Emmanuel Galland.

## Fonctionnalités

- Salon Three.js avec architecture, éclairages, ombres, huit sculptures détaillées et caméra orbitale.
- Observation isolée à 360° : cadrage adapté à chaque pièce, zoom et retour au salon.
- Oiseau mécanique aux ailes articulées et au plumage superposé ; sphère de porcelaine fragmentée ; chaise capitonnée ; cadre sculpté à rideaux ; gardien aux yeux mobiles ; astrolabe à lauriers ; défenses végétales ; ruban épais déformable.
- Matières distinctes : métal patiné, porcelaine émaillée, tissu, bois, ivoire et feuilles. Ornements fixes regroupés pour limiter les appels de dessin.
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

Compilation TypeScript et production réussies. Seize tests valident les imports, les données invalides, les aller-retours JSON, les huit géométries avec tous les comportements, le retour du ruban à son état initial et les budgets de géométrie. Les contrôles vérifient notamment les coordonnées finies, les limites spatiales et le nombre de maillages. Les silhouettes des huit pièces sont également contrôlées par un rendu SVG hors GPU.

La première version a été vérifiée dans le navigateur : création, modification au clavier, combinaison de comportements, révélation du secret et restauration après rechargement. Les données existantes restent compatibles avec les nouvelles formes.

Le navigateur de vérification ne propose pas WebGL. Le rendu GPU et les gestes sur la scène n’ont donc pas pu être contrôlés visuellement dans cet environnement. La collection et l’atelier restent accessibles si WebGL manque, avec un message explicite. Une carte graphique compatible WebGL 2 est nécessaire pour la scène.

## Modèle réutilisé

La chaise utilise la géométrie **Sheen Chair**, créée par **Eric Chadwick** pour **Wayfair LLC (2020)**, disponible sous **CC0 1.0** dans [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenChair). Les trois maillages de tissu, bois et métal sont conservés ; les étiquettes et les textures d’origine ne sont pas reprises. Positions quantifiées sur 16 bits, normales sur 8 bits, proportions et matériaux adaptés au cabinet. Le fichier `src/assets/sheen-chair.json` embarque la géométrie et sa provenance ; aucun chargement distant du modèle n’est nécessaire.

Les sept autres sculptures sont construites dans `src/artworks.ts`. Les crédits sont également accessibles dans l’aide de l’application et dans `public/credits.html`.

Ce projet compte pour huit thèmes, mais reste un seul projet : ne pas multiplier ses temps ou volumes de code par huit.
