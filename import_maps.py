"""Validate then copy the 33 GeoJSON inputs used by prepare.py."""
import argparse
import json
from pathlib import Path
from shutil import copyfile

LAYERS = ("line_river", "line_road", "point_city", "point_mount", "point_place",
          "poly_forest", "poly_lake", "poly_mountainhigh", "poly_mountainlow",
          "poly_outline", "poly_region")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset", type=Path, help="Local Arda-Maps checkout")
    args = parser.parse_args()
    target = Path(__file__).resolve().parent / "raw"
    pairs = []
    for age, period in enumerate(("first age", "second age", "third age"), start=1):
        folder = args.dataset / "QGIS" / period / f"arda{age}"
        for layer in LAYERS:
            source = folder / f"{layer}.geojson"
            try:
                data = json.loads(source.read_bytes())
            except (OSError, ValueError) as error:
                parser.error(f"{source}: {error}")
            if data.get("type") != "FeatureCollection" or not isinstance(data.get("features"), list):
                parser.error(f"Expected a GeoJSON feature collection in {source}")
            pairs.append((source, target / f"{age}-{layer}.json"))
    target.mkdir(exist_ok=True)
    for source, destination in pairs:
        staging = destination.with_suffix(".tmp")
        copyfile(source, staging)
        staging.replace(destination)
    print(f"Imported {len(pairs)} geographic layers.")


if __name__ == "__main__":
    main()
