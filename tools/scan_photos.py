#!/usr/bin/env python3
"""Write assets/photo-manifest.json from whatever is in the photo folders.

The page used to find photos by asking the server for nio.jpg, then .png,
then .jpeg, then .webp — four requests per slot, and a console full of 404s
for every slot still empty. It reads this manifest instead: one request, and
it only asks for files that exist.

Run after adding or renaming photos:

    python3 tools/scan_photos.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
FOLDERS = {"experience": "assets/experience", "content": "assets/content",
           "logos": "assets/logos"}

manifest = {}
for group, rel in FOLDERS.items():
    found = {}
    folder = ROOT / rel
    if folder.is_dir():
        for f in sorted(folder.iterdir()):
            if f.suffix.lower() in EXT:
                found[f.stem] = f"{rel}/{f.name}"
    manifest[group] = found

out = ROOT / "assets" / "photo-manifest.json"
out.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")

for group, found in manifest.items():
    names = ", ".join(sorted(found)) if found else "(none yet)"
    print(f"{group:11} {len(found):2} photo(s)  {names}")
print(f"\nwrote {out.relative_to(ROOT)}")
