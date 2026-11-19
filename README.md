# Rover Link

Le poste de pilotage réunit une simulation dans le navigateur, une vue éclatée et une interface de conduite pour PiCar-X.

Pour essayer la simulation et explorer le véhicule, exécuter `python3 -m http.server 8000 --directory dist` puis ouvrir `http://localhost:8000`. Le guide `GUIDE.html` décrit le montage, les dépendances, la clé propre à chaque installation et la configuration du serveur sur le Raspberry Pi. La vue de modélisme présente également une configuration Tekno/Hobbywing.

Les tests du serveur utilisent un robot simulé. Une fois `aiohttp` installé, exécuter `python3 -m unittest discover -s robot -p "test_*.py"`.
