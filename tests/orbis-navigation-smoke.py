"""Vérifie les liens du catalogue sans ouvrir de navigateur."""
# Le script lit les routes, cours et images déclarés puis signale les chemins absents.
from pathlib import Path
import re

ROOT = Path(__file__).parents[1]
worlds = (ROOT / "src/lib/orbis/catalog/games.ts").read_text(encoding="utf-8")
modules = (ROOT / "src/lib/orbis/catalog/courses.ts").read_text(encoding="utf-8")

route_paths = re.findall(r"\broute:\s*['\"](/[^'\"]+)['\"]", worlds + "\n" + modules)
static_paths = re.findall(r"\bhref:\s*['\"](/[^'\"]+\.html)['\"]", modules)
image_paths = re.findall(r"\bimage:\s*'([^']+)'", worlds)

missing = []
for route in route_paths:
    path = ROOT / "src/routes" / route.lstrip("/") / "+page.svelte"
    if not path.is_file():
        missing.append(f"route {route}")

for href in static_paths:
    path = ROOT / "static" / href.lstrip("/")
    if not path.is_file():
        missing.append(f"fichier statique {href}")

for image in image_paths:
    path = ROOT / "static/images/games" / image
    if not path.is_file():
        missing.append(f"illustration {image}")

assert not missing, "Destinations déclarées introuvables : " + ", ".join(missing)
print(f"Navigation ORBIS : OK — {len(route_paths)} routes, {len(static_paths)} cours et {len(image_paths)} illustrations vérifiés.")
