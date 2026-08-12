from pathlib import Path
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
HTML = ROOT / "index.html"
ASSETS.mkdir(exist_ok=True)

SOURCES = {
    "standing": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
    "peace": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
}

OUTPUTS = {
    "standing": ASSETS / "rika-standing-cutout-v4.png",
    "peace": ASSETS / "rika-peace-cutout-v4.png",
}


def key_green(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = pixels[x, y]
            dominance = g - max(r, b)
            if g > 105 and dominance > 18:
                alpha = max(0, min(255, int(255 * (1 - (dominance - 18) / 105))))
                if g > 155 and dominance > 38:
                    alpha = 0
                pixels[x, y] = (r, g, b, alpha)
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"No foreground found in {source}")
    margin = 8
    left = max(0, bbox[0] - margin)
    top = max(0, bbox[1] - margin)
    right = min(image.width, bbox[2] + margin)
    bottom = min(image.height, bbox[3] + margin)
    image.crop((left, top, right, bottom)).save(output, "PNG", optimize=True)
    check = Image.open(output)
    lo, hi = check.getchannel("A").getextrema()
    if lo != 0 or hi != 255:
        raise RuntimeError(f"Invalid alpha channel in {output}")


for name in SOURCES:
    key_green(SOURCES[name], OUTPUTS[name])

document = HTML.read_text(encoding="utf-8")

# Remove responsive <source> nodes only from portrait <picture> blocks, because
# an old srcset can override the corrected img source in Chromium.
def clean_picture(match: re.Match) -> str:
    block = match.group(0)
    lowered = block.lower()
    if "standing among cherry blossoms" in lowered or "making a peace sign" in lowered:
        block = re.sub(r"\s*<source\b[^>]*>", "", block, flags=re.I)
    return block

document = re.sub(r"<picture\b[^>]*>.*?</picture>", clean_picture, document, flags=re.I | re.S)

targets = {
    "standing among cherry blossoms": "assets/rika-standing-cutout-v4.png",
    "making a peace sign": "assets/rika-peace-cutout-v4.png",
}

found = set()

def replace_img(match: re.Match) -> str:
    tag = match.group(0)
    lowered = tag.lower()
    for phrase, path in targets.items():
        if phrase in lowered:
            found.add(phrase)
            tag = re.sub(r"\s+srcset\s*=\s*(['\"]).*?\1", "", tag, flags=re.I | re.S)
            tag = re.sub(r"\s+sizes\s*=\s*(['\"]).*?\1", "", tag, flags=re.I | re.S)
            if re.search(r"\bsrc\s*=", tag, flags=re.I):
                tag = re.sub(r"\bsrc\s*=\s*(['\"]).*?\1", f'src="{path}"', tag, count=1, flags=re.I | re.S)
            else:
                tag = tag[:-1] + f' src="{path}">'
            return tag
    return tag

document = re.sub(r"<img\b[^>]*>", replace_img, document, flags=re.I | re.S)
if found != set(targets):
    raise RuntimeError(f"Portrait tags not found: {set(targets) - found}")

HTML.write_text(document, encoding="utf-8")
(ROOT / ".portrait-repair-v4-ok").write_text("ok\n", encoding="utf-8")
