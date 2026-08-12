from pathlib import Path
import re
import shutil

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
BACKUPS = ROOT / "backups"
HTML = ROOT / "index.html"

SOURCES = {
    "standing": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
    "peace": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
}

OUTPUTS = {
    "standing": ASSETS / "rika-standing-cutout-v2.png",
    "peace": ASSETS / "rika-peace-cutout-v2.png",
}


def chroma_key(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = []
    for red, green, blue, alpha in image.getdata():
        dominance = green - max(red, blue)
        if green >= 125 and dominance >= 24:
            strength = max(0.0, min(1.0, (dominance - 20) / 58))
            new_alpha = int(round(alpha * (1.0 - strength)))
            if green >= 175 and dominance >= 52:
                new_alpha = 0
            neutral_green = min(green, int(round((red + blue) / 2 + 12)))
            pixels.append((red, neutral_green, blue, new_alpha))
        else:
            pixels.append((red, green, blue, alpha))
    image.putdata(pixels)

    bbox = image.getchannel("A").getbbox()
    if bbox:
        left, top, right, bottom = bbox
        pad = 8
        bbox = (
            max(0, left - pad),
            max(0, top - pad),
            min(image.width, right + pad),
            min(image.height, bottom + pad),
        )
        image = image.crop(bbox)

    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG", optimize=True)


def replace_src(tag: str, path: str) -> str:
    src_pattern = re.compile(r"(\bsrc\s*=\s*)([\"']).*?\2", re.I | re.S)
    if src_pattern.search(tag):
        return src_pattern.sub(lambda match: f'{match.group(1)}"{path}"', tag, count=1)
    return tag[:-1] + f' src="{path}">'


def update_html() -> None:
    BACKUPS.mkdir(parents=True, exist_ok=True)
    backup = BACKUPS / "index-before-portrait-v2-20260812.html"
    if not backup.exists():
        shutil.copy2(HTML, backup)

    source = HTML.read_text(encoding="utf-8")
    image_pattern = re.compile(r"<img\b[^>]*>", re.I | re.S)

    def edit_tag(match: re.Match[str]) -> str:
        tag = match.group(0)
        lower = tag.lower()
        if "illustrated portrait of rika standing among cherry blossoms" in lower:
            return replace_src(tag, "assets/rika-standing-cutout-v2.png")
        if "illustrated portrait of rika making a peace sign" in lower:
            return replace_src(tag, "assets/rika-peace-cutout-v2.png")
        return tag

    updated = image_pattern.sub(edit_tag, source)
    if updated == source:
        raise RuntimeError("No matching portrait image tags were found in site/index.html")
    HTML.write_text(updated, encoding="utf-8")


def main() -> None:
    for key, source in SOURCES.items():
        if not source.exists():
            raise FileNotFoundError(source)
        chroma_key(source, OUTPUTS[key])
    update_html()


if __name__ == "__main__":
    main()
