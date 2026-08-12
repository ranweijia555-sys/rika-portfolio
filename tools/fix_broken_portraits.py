from pathlib import Path
import re
import shutil

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
INDEX = ROOT / "index.html"
BACKUPS = ROOT / "backups"

PORTRAITS = (
    (
        Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-99838b86-5bfb-42aa-8d9f-64c2d672b373.png"),
        "rika-standing-transparent-20260812.png",
        "Illustrated portrait of Rika standing among cherry blossoms",
        ("rika-standing-cutout-v4.png", "rika-standing-cutout-v5.png"),
    ),
    (
        Path("/Users/ranweijia/.codex/generated_images/019fd975-c56e-7423-a346-37bcc912bed2/exec-4645dbf6-2813-4315-a99f-0f8452494d38.png"),
        "rika-peace-transparent-20260812.png",
        "Illustrated portrait of Rika making a peace sign",
        ("rika-peace-cutout-v4.png", "rika-peace-cutout-v5.png"),
    ),
)


def chroma_key(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = []
    for red, green, blue, _ in image.getdata():
        dominance = green - max(red, blue)
        if green > 105 and dominance > 28:
            # Feather the green-screen edge while retaining the cream paper border.
            alpha = 0 if dominance >= 62 else round(255 * (62 - dominance) / 34)
            alpha = max(0, min(255, alpha))
            green = min(green, max(red, blue) + 12)
            pixels.append((red, green, blue, alpha))
        else:
            pixels.append((red, green, blue, 255))
    image.putdata(pixels)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True)
    # Force a decode now so a corrupt output can never be installed in the page.
    with Image.open(destination) as check:
        check.load()
        if check.mode != "RGBA":
            raise RuntimeError(f"Expected RGBA output: {destination}")


def replace_portrait_tag(html: str, alt: str, source: str) -> str:
    img_re = re.compile(r"<img\b[^>]*>", re.I | re.S)

    def edit(match: re.Match[str]) -> str:
        tag = match.group(0)
        if not re.search(rf"\balt\s*=\s*(['\"])\s*{re.escape(alt)}\s*\1", tag, re.I | re.S):
            return tag
        tag = re.sub(
            r"\s+(?:src|srcset|sizes)\s*=\s*(?:\"[^\"]*\"|'[^']*')",
            "",
            tag,
            flags=re.I | re.S,
        )
        return tag.replace("<img", f'<img src="{source}"', 1)

    return img_re.sub(edit, html)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    BACKUPS.mkdir(parents=True, exist_ok=True)

    for source, filename, _, aliases in PORTRAITS:
        output = ASSETS / filename
        chroma_key(source, output)
        # Repair old aliases as well, so cached or legacy responsive references remain valid.
        for alias in aliases:
            shutil.copy2(output, ASSETS / alias)

    html = INDEX.read_text(encoding="utf-8")
    backup = BACKUPS / "index-before-portrait-path-repair-20260812.html"
    if not backup.exists():
        shutil.copy2(INDEX, backup)

    # Remove responsive <source> elements only from picture blocks containing these portraits.
    picture_re = re.compile(r"<picture\b[^>]*>.*?</picture>", re.I | re.S)

    def clean_picture(match: re.Match[str]) -> str:
        block = match.group(0)
        if any(alt in block for _, _, alt, _ in PORTRAITS):
            return re.sub(r"<source\b[^>]*>", "", block, flags=re.I | re.S)
        return block

    html = picture_re.sub(clean_picture, html)
    for _, filename, alt, _ in PORTRAITS:
        html = replace_portrait_tag(html, alt, f"assets/{filename}")

    # Remove the earlier runtime workaround; the corrected static markup is sufficient.
    html = re.sub(
        r"<script\b[^>]*id=(['\"])portrait-asset-repair\1[^>]*>.*?</script>",
        "",
        html,
        flags=re.I | re.S,
    )
    INDEX.write_text(html, encoding="utf-8")
    (ROOT / ".portrait-repair-complete").write_text("ok\n", encoding="utf-8")


if __name__ == "__main__":
    main()
