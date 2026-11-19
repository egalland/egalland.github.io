# VibraJiggler

Petite application Android qui utilise uniquement le vibreur du téléphone pour créer
de très petits mouvements physiques sous une souris.

## Fonctionnement
- Intervalle réglable : 15 à 180 secondes
- Durée : 50 à 1000 ms
- Intensité : 1 à 255
- 4 motifs de vibration
- Intervalle aléatoire ±20 %
- Mode écran noir
- Option pour garder l'écran éveillé
- Aucun accès réseau
- Aucune bibliothèque applicative externe

## Montage conseillé
1. Téléphone posé à plat.
2. Poser une petite plaque rigide et légère au-dessus du téléphone.
3. Poser la souris sur cette plaque.
4. Empêcher la souris de glisser trop loin avec deux petites butées latérales.
5. Dans l'application, commencer par :
   - intervalle 45 s
   - durée 250 ms
   - intensité 180
   - motif « Double impulsion »
6. Utiliser « Tester la vibration » et ajuster jusqu'à voir un petit déplacement du curseur.

## Compiler l'APK
Ouvrir ce dossier avec Android Studio, laisser Gradle synchroniser le projet puis :
Build > Build Bundle(s) / APK(s) > Build APK(s)

APK de debug typique :
app/build/outputs/apk/debug/app-debug.apk

## Note
L'application fonctionne au premier plan. L'option « Garder le téléphone éveillé »
évite qu'Android mette l'activité en veille pendant l'utilisation.
