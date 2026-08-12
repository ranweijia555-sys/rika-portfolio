from __future__ import annotations

import re
from pathlib import Path

from PIL import Image


SITE = Path(__file__).resolve().parents[1]
ASSETS = SITE / "assets"
BACKUPS = SITE / "backups"
HTML = SITE / "index.html"

SOURCES = {
    "standing": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
    "peace": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
}

OUTPUTS = {
    "standing": ASSETS / "rika-standing-cutout-v3.png",
    "peace": ASSETS / "rika-peace-cutout-v3.png",
}


def remove_green_screen(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            # Target only the very bright chroma green, preserving the muted green leaves.
            dominance = g - max(r, b)
            brightness = g
            if dominance >= 105 and brightness >= 170:
                alpha = 0
            elif dominance >= 70 and brightness >= 145:
                # Feather the key edge instead of leaving a hard green halo.
                strength = min(1.0, max(0.0, (dominance - 70) / 35))
                alpha = round(a * (1.0 - strength))
            else:
                alpha = a
            pixels[x, y] = (r, g, b, alpha)

    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"Green-screen removal erased the whole image: {source}")
    pad = 6
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(image.width, bbox[2] + pad)
    bottom = min(image.height, bbox[3] + pad)
    image.crop((left, top, right, bottom)).save(output, "PNG", optimize=True)


def replace_target_img(html: str, phrase: str, new_src: str) -> tuple[str, int]:
    count = 0

    def edit(match: re.Match[str]) -> str:
        nonlocal count
        tag = match.group(0)
        if phrase not in tag.lower():
            return tag
        count += 1
        tag = re.sub(r"\s+srcset\s*=\s*(['\"]).*?\1", "", tag, flags=re.I | re.S)
        tag = re.sub(r"\s+sizes\s*=\s*(['\"]).*?\1", "", tag, flags=re.I | re.S)
        if re.search(r"\bsrc\s*=", tag, flags=re.I):
            tag = re.sub(r"\bsrc\s*=\s*(['\"]).*?\1", f'src="{new_src}"', tag, count=1, flags=re.I | re.S)
        else:
            tag = tag[:-1] + f' src="{new_src}">'
        return tag

    return re.sub(r"<img\b[^>]*>", edit, html, flags=re.I | re.S), count


def verify_png(path: Path) -> None:
    if not path.is_file() or path.stat().st_size < 1024:
        raise RuntimeError(f"Missing or invalid output: {path}")
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        lo, hi = rgba.getchannel("A").getextrema()
        if lo != 0 or hi != 255:
            raise RuntimeError(f"Expected transparent and opaque pixels in {path}; got {lo, hi}")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    BACKUPS.mkdir(parents=True, exist_ok=True)
    for key, source in SOURCES.items():
        if not source.is_file():
            raise FileNotFoundError(source)
        remove_green_screen(source, OUTPUTS[key])
        verify_png(OUTPUTS[key])

    original = HTML.read_text(encoding="utf-8")
    backup = BACKUPS / "index-before-portrait-v3-20260812.html"
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")

    updated, standing_count = replace_target_img(
        original,
        "standing among cherry blossoms",
        "assets/rika-standing-cutout-v3.png",
    )
    updated, peace_count = replace_target_img(
        updated,
        "making a peace sign",
        "assets/rika-peace-cutout-v3.png",
    )
    if standing_count == 0 or peace_count == 0:
        raise RuntimeError(
            f"Could not find both portrait tags (standing={standing_count}, peace={peace_count})"
        )
    HTML.write_text(updated, encoding="utf-8")

    final_html = HTML.read_text(encoding="utf-8")
    for output in OUTPUTS.values():
        if f"assets/{output.name}" not in final_html:
            raise RuntimeError(f"HTML does not reference {output.name}")
    (SITE / ".portrait-repair-v3-ok").write_text("ok\n", encoding="utf-8")


if __name__ == "__main__":
    main()
