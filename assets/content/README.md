# Content phone posts

Three slots, filling the phone feed in order. Drop files in, run the scan, reload.

    assets/content/post-1.jpg
    assets/content/post-2.jpg
    assets/content/post-3.jpg

.png, .jpeg and .webp work too; the slot tries each in turn. Portrait
9:16 suits the phone screen (a Xiaohongshu screenshot is already that
shape). The caption sits over the bottom of the image, so keep the lower
fifth free of anything you need read.

A slot with no file keeps its gradient card, so a missing post never
looks broken.

## After adding photos

    python3 tools/scan_photos.py

That rewrites assets/photo-manifest.json, which is how the page knows
which slots have a photo. Without it the new file is simply not picked up
— the page never guesses at filenames, because guessing meant a failed
request for every empty slot.
