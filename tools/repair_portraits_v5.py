from pathlib import Path
import re
import shutil

from PIL import Image


ROOT = Path("/Users/ranweijia/.codex/.chatgpt-projects/g-p-6a693f8703c081918df8074e4484b8b0/site")
ASSETS = ROOT / "assets"
HTML = ROOT / "index.html"
BACKUP = ROOT / "backups" / "index-before-portrait-v5.html"

SOURCE_FILES = {
    "standing": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
    "peace": Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
}

OUTPUT_FILES = {
    "standing": ASSETS / "rika-standing-cutout-v5.png",
    "peace": ASSETS / "rika-peace-cutout-v5.png",
}

ALTS = {
    "standing": "Illustrated portrait of Rika standing among cherry blossoms",
    "peace": "Illustrated portrait of Rika making a peace sign",
}


def valid_png(path: Path) -> bool:
    try:
        with Image.open(path) as im:
            im.verify()
        return path.stat().st_size > 10_000
    except Exception:
        return False


def remove_green(source: Path, output: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = pixels[x, y]
            dominance = g - max(r, b)
            if g > 105 and dominance > 32:
                alpha = max(0, min(255, 255 - int((dominance - 32) * 4.5)))
                pixels[x, y] = (r, g, b, alpha)

    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    image.save(output, "PNG", optimize=True)


def set_img_src(tag: str, absolute_url: str) -> str:
    tag = re.sub(r"\s+(?:srcset|sizes)=(['\"]).*?\1", "", tag, flags=re.S | re.I)
    if re.search(r"\ssrc=(['\"]).*?\1", tag, flags=re.S | re.I):
        return re.sub(
            r"\ssrc=(['\"]).*?\1",
            f' src="{absolute_url}"',
            tag,
            count=1,
            flags=re.S | re.I,
        )
    return tag[:-1] + f' src="{absolute_url}">'


def replace_portrait(html: str, alt: str, output: Path) -> str:
    url = output.as_uri()

    picture_pattern = re.compile(
        rf"<picture\b[^>]*>(?:(?!</picture>).)*?alt=(['\"]){re.escape(alt)}\1(?:(?!</picture>).)*?</picture>",
        re.S | re.I,
    )

    def picture_repl(match: re.Match) -> str:
        block = re.sub(r"<source\b[^>]*>", "", match.group(0), flags=re.S | re.I)
        return re.sub(
            rf"<img\b(?=[^>]*alt=(['\"]){re.escape(alt)}\1)[^>]*>",
            lambda m: set_img_src(m.group(0), url),
            block,
            count=1,
            flags=re.S | re.I,
        )

    html, count = picture_pattern.subn(picture_repl, html, count=1)
    if count:
        return html

    img_pattern = re.compile(
        rf"<img\b(?=[^>]*alt=(['\"]){re.escape(alt)}\1)[^>]*>",
        re.S | re.I,
    )
    html, count = img_pattern.subn(lambda m: set_img_src(m.group(0), url), html, count=1)
    if not count:
        raise RuntimeError(f"Could not find portrait image with alt: {alt}")
    return html


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    BACKUP.parent.mkdir(parents=True, exist_ok=True)

    previous = {
        "standing": ASSETS / "rika-standing-cutout-v4.png",
        "peace": ASSETS / "rika-peace-cutout-v4.png",
    }
    for key, output in OUTPUT_FILES.items():
        if valid_png(previous[key]):
            shutil.copy2(previous[key], output)
        else:
            remove_green(SOURCE_FILES[key], output)
        if not valid_png(output):
            raise RuntimeError(f"Invalid generated PNG: {output}")

    original = HTML.read_text(encoding="utf-8")
    if not BACKUP.exists():
        BACKUP.write_text(original, encoding="utf-8")

    updated = original
    for key in ("standing", "peace"):
        updated = replace_portrait(updated, ALTS[key], OUTPUT_FILES[key])

    HTML.write_text(updated, encoding="utf-8")
    (ROOT / ".portrait-repair-v5-ok").write_text("ok\n", encoding="utf-8")


if __name__ == "__main__":
    main()
