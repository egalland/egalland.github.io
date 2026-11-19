# Générateur de frises calendaires

Le générateur compose les douze mois en français dans douze compositions typographiques. Il exporte chaque frise en SVG et PDF à sa dimension physique de 300 × 15 cm et produit un aperçu des trois premiers mois. Les caractères sont convertis en courbes.

Avec Python 3.10 ou plus récent, installer `python -m pip install -r requirements.txt`, puis lancer `python generate_designs.py --out rendus`. Les fichiers se trouvent dans `rendus/designs`, le catalogue de styles dans `rendus/catalogue.json`, et les bornes des 144 libellés dans `rendus/design-validation.json`.

Le dossier `typefaces` contient les onze polices utilisées, les notices SIL Open Font License correspondantes et les URL d’origine. Le dossier `exemple` contient une composition générée.
