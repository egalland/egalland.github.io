# BodyOS · Atlas musculaire 3D

Cette édition autonome de la visionneuse anatomique de BodyOS charge un modèle musculaire générique. Elle propose la rotation, les vues de face et de dos et la sélection d’une structure dans le modèle 3D. Tous les modules Three.js et le modèle sont fournis localement.

À la racine du projet, lancer `python3 -m http.server 8000` puis ouvrir <http://localhost:8000/> dans un navigateur récent avec WebGL. Le test de structure s’exécute avec `node --test assets.test.mjs`.

Le modèle `models/muscles.glb` provient de BodyParts3D et Z-Anatomy. Les attributions et conditions de redistribution sont incluses dans [ATTRIBUTION.md](licenses/ATTRIBUTION.md) et [LICENSE-DATA.md](licenses/LICENSE-DATA.md). Les sources Three.js utilisent la [licence MIT](licenses/THREE-LICENSE.txt).
