from __future__ import annotations

import base64
import re
import shutil
from pathlib import Path


SITE = Path(__file__).resolve().parents[1]
HTML = SITE / "index.html"
ASSETS = SITE / "assets"
BACKUP = SITE / "backups" / "index-before-portrait-embedded.html"

PORTRAITS = {
    "Illustrated portrait of Rika standing among cherry blossoms": [
        ASSETS / "rika-standing-cutout-v5.png",
        ASSETS / "rika-standing-cutout-v4.png",
    ],
    "Illustrated portrait of Rika making a peace sign": [
        ASSETS / "rika-peace-cutout-v5.png",
        ASSETS / "rika-peace-cutout-v4.png",
    ],
}


def image_data_uri(candidates: list[Path]) -> str:
    image = next((path for path in candidates if path.is_file() and path.stat().st_size > 1000), None)
    if image is None:
        raise FileNotFoundError(f"No valid portrait asset found: {candidates}")
    return "data:image/png;base64," + base64.b64encode(image.read_bytes()).decode("ascii")


def replace_img_source(markup: str, alt: str, uri: str) -> tuple[str, int]:
    escaped_alt = re.escape(alt)
    img_pattern = re.compile(
        rf"<img\b(?=[^>]*\balt=(['\"]){escaped_alt}\1)[^>]*>",
        flags=re.IGNORECASE,
    )

    def update_img(match: re.Match[str]) -> str:
        tag = match.group(0)
        tag = re.sub(r"\s(?:srcset|sizes)=(['\"]).*?\1", "", tag, flags=re.IGNORECASE | re.DOTALL)
        if re.search(r"\ssrc=(['\"]).*?\1", tag, flags=re.IGNORECASE | re.DOTALL):
            tag = re.sub(
                r"\ssrc=(['\"]).*?\1",
                lambda _: f' src="{uri}"',
                tag,
                count=1,
                flags=re.IGNORECASE | re.DOTALL,
            )
        else:
            tag = tag[:-1] + f' src="{uri}">'
        return tag

    # If the image is in a picture element, remove source/srcset candidates that
    # would otherwise override img.src. The wrapper is kept so layout is unchanged.
    picture_pattern = re.compile(
        rf"<picture\b[^>]*>(?:(?!</picture>).)*?<img\b(?=[^>]*\balt=(['\"]){escaped_alt}\1)[^>]*>(?:(?!</picture>).)*?</picture>",
        flags=re.IGNORECASE | re.DOTALL,
    )

    count = 0

    def update_picture(match: re.Match[str]) -> str:
        nonlocal count
        block = re.sub(r"<source\b[^>]*>", "", match.group(0), flags=re.IGNORECASE | re.DOTALL)
        block, replacements = img_pattern.subn(update_img, block, count=1)
        count += replacements
        return block

    markup = picture_pattern.sub(update_picture, markup)
    if count == 0:
        markup, count = img_pattern.subn(update_img, markup, count=1)
    return markup, count


def main() -> None:
    if not HTML.is_file():
        raise FileNotFoundError(HTML)

    source = HTML.read_text(encoding="utf-8")
    result = source
    totals: dict[str, int] = {}

    for alt, candidates in PORTRAITS.items():
        result, count = replace_img_source(result, alt, image_data_uri(candidates))
        totals[alt] = count

    if any(count != 1 for count in totals.values()):
        raise RuntimeError(f"Expected exactly one replacement per portrait, got {totals}")
    if result.count("data:image/png;base64,") < 2:
        raise RuntimeError("Embedded portrait data was not written correctly")

    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    if not BACKUP.exists():
        shutil.copy2(HTML, BACKUP)
    HTML.write_text(result, encoding="utf-8")
    (SITE / ".portrait-embedded-ok").write_text("standing=1\npeace=1\n", encoding="utf-8")


if __name__ == "__main__":
    main()
