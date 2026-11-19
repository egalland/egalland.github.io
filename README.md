# Galerie d’affiches

La galerie statique présente trois affiches géométriques originales. Chaque fiche propose un aperçu, un PDF vectoriel A4 pour l’impression et un SVG téléchargeable. Ouvrir `index.html` dans un navigateur ou servir ce dossier avec `python3 -m http.server 8000`.

Pour modifier la collection, adapter `POSTERS` dans `generate_demo.py`. Installer `python -m pip install -r requirements.txt`, puis lancer `python generate_demo.py`. Le script crée les affiches et la page HTML. La mise en page responsive est dans `gallery.css`.
