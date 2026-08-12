from pathlib import Path
import re

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BACKUPS = ROOT / "backups"
HTML_PATH = ROOT / "index.html"

SOURCES = {
    "standing": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
    "peace": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
}

OUTPUTS = {
    "standing": ASSETS / "rika-standing-transparent-final.png",
    "peace": ASSETS / "rika-peace-transparent-final.png",
}

ALT_TO_SRC = {
    "Illustrated portrait of Rika standing among cherry blossoms": "./assets/rika-standing-transparent-final.png?v=20260812e",
    "Illustrated portrait of Rika making a peace sign": "./assets/rika-peace-transparent-final.png?v=20260812e",
}


def remove_green(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            dominance = g - max(r, b)
            if g > 105 and dominance > 22:
                alpha = max(0, min(255, int(255 * (1 - (dominance - 22) / 95))))
                if dominance > 70:
                    alpha = 0
                pixels[x, y] = (r, min(g, max(r, b)), b, min(a, alpha))
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    image.save(destination, "PNG", optimize=True)


def replace_img_src(html: str, alt: str, src: str) -> str:
    pattern = re.compile(r"<img\b(?=[^>]*\balt=(['\"])" + re.escape(alt) + r"\1)[^>]*>", re.I)

    def update(match: re.Match[str]) -> str:
        tag = match.group(0)
        tag = re.sub(r"\s+(?:src|srcset|sizes)=(['\"])[^'\"]*\1", "", tag, flags=re.I)
        return tag[:-1] + f' src="{src}">'

    return pattern.sub(update, html)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    BACKUPS.mkdir(parents=True, exist_ok=True)
    for key, source in SOURCES.items():
        remove_green(source, OUTPUTS[key])

    html = HTML_PATH.read_text(encoding="utf-8")
    backup = BACKUPS / "index-before-broken-portrait-repair.html"
    if not backup.exists():
        backup.write_text(html, encoding="utf-8")

    for alt, src in ALT_TO_SRC.items():
        html = replace_img_src(html, alt, src)

    # Runtime fallback: prevents stale <picture><source> or srcset attributes from
    # overriding the repaired local PNG paths in browsers.
    marker = 'id="portrait-asset-repair"'
    if marker not in html:
        mapping = ",\n".join(
            f"      {alt!r}: {src!r}" for alt, src in ALT_TO_SRC.items()
        )
        script = f'''\n<script id="portrait-asset-repair">\n(() => {{\n  const portraits = {{\n{mapping}\n  }};\n  for (const [alt, src] of Object.entries(portraits)) {{\n    const img = [...document.images].find((node) => node.alt === alt);\n    if (!img) continue;\n    const picture = img.closest('picture');\n    if (picture) picture.querySelectorAll('source').forEach((source) => source.remove());\n    img.removeAttribute('srcset');\n    img.removeAttribute('sizes');\n    img.src = src;\n  }}\n}})();\n</script>\n'''
        html = html.replace("</body>", script + "</body>")

    HTML_PATH.write_text(html, encoding="utf-8")
    (ROOT / ".portrait-repair-complete").write_text("ok\n", encoding="utf-8")


if __name__ == "__main__":
    main()
