# Carte de Paris et de l’ouest parisien

Les emprises de bâtiments, les axes des rues et chemins, les surfaces en eau et les zones de végétation proviennent de l’**Institut national de l’information géographique et forestière (IGN), BD TOPO®**, extraction du 19 novembre 2026. Réutilisation sous **Licence Ouverte / Open Licence 2.0**.

- [Fiche officielle de la BD TOPO®](https://cartes.gouv.fr/rechercher-une-donnee/dataset/IGNF_BD-TOPO)
- [Service WFS de la Géoplateforme](https://data.geopf.fr/wfs/ows?service=WFS&version=2.0.0&request=GetCapabilities)
- [Texte de la Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/)

## Emprise et transformation

Le secteur suit l'axe du Louvre, des Tuileries, de la Concorde et des Champs-Élysées à l'Étoile, puis l'avenue de la Grande Armée, la porte Maillot, Neuilly-sur-Seine, la Seine et le quartier de La Défense. La bande extraite s'étend à 650 mètres de part et d'autre de cet axe. Le contour exact figure dans `metadata.boundary` du module de données.

Les éléments géographiques sont projetés dans un repère local métrique approximatif, orienté vers l'est en x et vers le sud en y. Le générateur simplifie les contours d'environ un mètre et arrondit les coordonnées au mètre. Il conserve les cours intérieures et les îles. Les natures, les hauteurs de bâtiments et les largeurs de chaussée sont issues des attributs IGN lorsqu'ils sont renseignés. Les hauteurs manquantes sont estimées à partir du nombre d'étages ou d'un gabarit par défaut. Chaque bâtiment indique si sa hauteur est observée dans la source. Une largeur indicative est attribuée aux tronçons dont la largeur est inconnue. Les tronçons routiers souterrains sont écartés de la représentation de surface. Les tabliers des ponts sont identifiés par le niveau de franchissement IGN.

Le sol de jeu est plat. L'habillage des façades, les personnages, les accessoires et les véhicules sont des créations stylisées pour le jeu. L’axe ainsi que les trois arrêts Tour Eiffel, Notre-Dame et Sacré-Cœur sont embarqués. Dans le plan du Grand Paris, les autres secteurs de 1,32 km de côté sont extraits à la demande auprès de la Géoplateforme et mis en cache dans le navigateur.

## Reproduction

Lancer `/usr/bin/python3 scripts/geo-extract.py` avec Python 3 et les bindings GDAL/OGR. Le générateur interroge séparément les couches `BDTOPO_V3:batiment`, `BDTOPO_V3:troncon_de_route`, `BDTOPO_V3:surface_hydrographique` et `BDTOPO_V3:zone_de_vegetation`. Le module obtenu est `public/paris-core.js`. Les arguments `eiffel`, `notre-dame` et `sacre-coeur` génèrent trois quartiers supplémentaires embarqués (archives gzip). La BD TOPO est une source mise à jour dans le temps.

## Secteurs supplémentaires

Pour un quartier choisi ailleurs dans Paris et la petite couronne, le jeu charge les quatre mêmes couches du WFS de l'IGN sur un carré de 1,32 km de côté. Il utilise le même repère métrique que le corridor embarqué. La date d’extraction du secteur correspond à son chargement réussi. Une copie locale permet de revisiter un secteur et de conserver la dernière carte disponible lorsque le réseau est indisponible. Les contours sont quantifiés au mètre et les tronçons souterrains sont exclus de la vue de surface.
