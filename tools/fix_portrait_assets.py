from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image


ROOT = Path("/Users/ranweijia/.codex/.chatgpt-projects/g-p-6a693f8703c081918df8074e4484b8b0")
SITE = ROOT / "site"
ASSETS = SITE / "assets"
BACKUPS = SITE / "backups"


PORTRAITS = (
    (
        Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
        ASSETS / "rika-standing-transparent.png",
        "Illustrated portrait of Rika standing among cherry blossoms",
        "assets/rika-standing-transparent.png",
    ),
    (
        Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
        ASSETS / "rika-peace-transparent.png",
        "Illustrated portrait of Rika making a peace sign",
        "assets/rika-peace-transparent.png",
    ),
)


def remove_green(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = pixels[x, y]
            dominance = g - max(r, b)

            if g >= 135 and dominance >= 55:
                alpha = 0
            elif g >= 90 and dominance >= 18:
                # Feather the chroma-key edge instead of leaving a green halo.
                alpha = round(255 * max(0.0, min(1.0, (55 - dominance) / 37)))
            else:
                alpha = 255

            if alpha < 255:
                g = min(g, max(r, b) + 8)
            pixels[x, y] = (r, g, b, alpha)

    alpha_channel = image.getchannel("A")
    bbox = alpha_channel.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        padding = 10
        bbox = (
            max(0, left - padding),
            max(0, top - padding),
            min(image.width, right + padding),
            min(image.height, bottom + padding),
        )
        image = image.crop(bbox)

    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True)


def replace_portrait_source(html: str, alt_text: str, source: str) -> str:
    img_pattern = re.compile(r"<img\b[^>]*>", re.IGNORECASE)

    def update_tag(match: re.Match[str]) -> str:
        tag = match.group(0)
        if alt_text not in tag:
            return tag
        if re.search(r"\bsrc\s*=", tag, flags=re.IGNORECASE):
            return re.sub(
                r"\bsrc\s*=\s*(['\"]).*?\1",
                f'src="{source}"',
                tag,
                count=1,
                flags=re.IGNORECASE,
            )
        return tag[:-1] + f' src="{source}">'

    return img_pattern.sub(update_tag, html)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    BACKUPS.mkdir(parents=True, exist_ok=True)

    index = SITE / "index.html"
    backup = BACKUPS / "index-before-portrait-fix-20260812.html"
    if index.exists() and not backup.exists():
        shutil.copy2(index, backup)

    for source, destination, _, _ in PORTRAITS:
        if not source.exists():
            raise FileNotFoundError(source)
        remove_green(source, destination)

    html = index.read_text(encoding="utf-8")
    for _, _, alt_text, relative_source in PORTRAITS:
        html = replace_portrait_source(html, alt_text, relative_source)
    index.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
