"""Bake road elevation samples cached by geo-extract.py into the playable surface grid."""
import base64
import json
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

cache = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.gettempdir()) / "maille-city-ign-20261119"
routes = {}
for file in sorted(cache.glob("*troncon_de_route*.json")):
    for feature in json.loads(file.read_text())["features"]:
        properties = feature["properties"]
        if properties.get("etat_de_l_objet") == "En service" and int(properties.get("position_par_rapport_au_sol") or 0) >= 0:
            routes[properties["cleabs"]] = feature["geometry"]

# Sample along the roads, so widely separated vertices on a straight bridge still
# describe the deck and widely spaced intersections still describe the hillside.
samples = {}
for geometry in routes.values():
    lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
    for line in lines:
        for a, b in zip(line, line[1:]):
            if len(a) < 3 or len(b) < 3 or min(a[2], b[2]) < 5 or max(a[2], b[2]) > 260:
                continue
            x, y = (a[0] - 2.25) * 73190, (48.88 - a[1]) * 111320
            dx, dy = (b[0] - a[0]) * 73190, (a[1] - b[1]) * 111320
            steps = max(1, int(np.ceil(np.hypot(dx, dy) / 14)))
            for i in range(steps + 1):
                t = i / steps
                key = (round((x + t * dx) / 4) * 4, round((y + t * dy) / 4) * 4)
                samples.setdefault(key, []).append(a[2] + t * (b[2] - a[2]))

if not samples:
    raise SystemExit("Run geo-extract.py for the corridor and three stops first.")
xy = np.array(list(samples))
values = np.array([np.median(z) for z in samples.values()])
tree = cKDTree(xy)
step = 32
minimum = (np.floor(xy.min(axis=0) / step) - 2).astype(int) * step
maximum = (np.ceil(xy.max(axis=0) / step) + 2).astype(int) * step
xx, yy = np.meshgrid(np.arange(minimum[0], maximum[0] + step, step), np.arange(minimum[1], maximum[1] + step, step))
dist, indices = tree.query(np.c_[xx.ravel(), yy.ravel()], k=20)
weights = 1 / (dist ** 2 + 16 ** 2) ** 1.6
field = (np.sum(weights * values[indices], axis=1) / np.sum(weights, axis=1)).reshape(xx.shape)
# Keep a continuous neighbourhood-scale surface across closely spaced grade-separated streets.
field = gaussian_filter(field, 1.15, mode="nearest")
raw = np.round(field * 10).astype("<i2").tobytes()
out = Path(__file__).resolve().parents[1] / "public" / "paris-heights.js"
out.write_text("// IGN BD TOPO® · Licence Ouverte 2.0 · See licenses/geography.md and scripts/geo-relief.py.\n"
               + f"export const grid = {{x:{minimum[0]},y:{minimum[1]},step:{step},cols:{xx.shape[1]},rows:{xx.shape[0]},data:'"
               + base64.b64encode(raw).decode() + "'};\n")
print(len(routes), "roads,", len(samples), "samples,", xx.shape, "grid")

# The packaged outlines are clipped to sector limits. Match their surviving vertices
# to their original 3D shorelines before attaching a single level to each water surface.
import gzip
public = out.parent
core = (public / "paris-core.js").read_text().split("export const water=", 1)[1].split(".map(", 1)[0]
polygons = list(json.loads(core))
for archive in sorted(public.glob("sector-*.gz")):
    with gzip.open(archive) as stream:
        polygons.extend(json.load(stream)["water"])
shore_xy, shore_z = [], []
for file in sorted(cache.glob("*surface_hydrographique*.json")):
    for feature in json.loads(file.read_text())["features"]:
        shape = feature["geometry"]
        rings = shape["coordinates"] if shape["type"] == "MultiPolygon" else [shape["coordinates"]]
        for polygon in rings:
            ring = [p for p in polygon[0] if len(p) > 2 and 5 < p[2] < 260]
            if not ring:
                continue
            level = np.median([p[2] for p in ring])
            for lon, lat, *_ in ring:
                shore_xy.append(((lon - 2.25) * 73190, (48.88 - lat) * 111320))
                shore_z.append(level)
levels = {}
if shore_xy:
    tree = cKDTree(shore_xy)
    for ring, *_ in polygons:
        dist, idx = tree.query(ring)
        nearby = [shore_z[i] for d, i in zip(dist, idx) if d < 2]
        if nearby:
            key = ",".join(map(str, ring[0]))
            levels[key] = round(float(np.median(nearby)), 1)
with out.open("a") as file:
    file.write("export const waterLevels=" + json.dumps(levels, separators=(",", ":")) + ";\n")
print(len(levels), "water surface levels")
