#!/usr/bin/env python3
"""Split assets/rika-standing-transparent.png into a static person layer and a
swayable flowers layer (person hole inpainted), both on the original canvas so
the site can stack them 1:1."""

import numpy as np
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "rika-standing-transparent.png"
OUT_FLOWERS = ROOT / "assets" / "rika-standing-flowers.png"
OUT_PERSON = ROOT / "assets" / "rika-standing-person.png"
OUT_DEBUG = ROOT / "assets" / "debug-person-mask.png"

img = np.array(Image.open(SRC).convert("RGBA")).astype(np.float32)
H, W = img.shape[:2]
r, g, b, a = img[..., 0], img[..., 1], img[..., 2], img[..., 3]
valid = a > 40

# --- classify pixels -------------------------------------------------------
mx = np.maximum(np.maximum(r, g), b)
dark = valid & (mx < 95)                                   # clothes / hair / soles
petalish = valid & (r > 185) & (b > g - 12) & (b > 165)    # petals + white outline
leafish = valid & (g > r - 10) & (g >= b) & (g > 95) & (mx < 215)
branchish = valid & (r > g) & (g > b) & (r > 105) & (r < 200) & (b < 120) & ~dark
growable = valid & ~(petalish | leafish | branchish)
# below the flowers everything (incl. white sneakers) belongs to the person
ys = np.arange(H)[:, None]
growable |= valid & (ys > int(H * 0.83))

def spread(seed_mask, allowed, iters):
    m = seed_mask & allowed
    for _ in range(iters):
        grown = m.copy()
        grown[1:, :] |= m[:-1, :]
        grown[:-1, :] |= m[1:, :]
        grown[:, 1:] |= m[:, :-1]
        grown[:, :-1] |= m[:, 1:]
        grown &= allowed
        if grown.sum() == m.sum():
            break
        m = grown
    return m

def dilate(mask, px):
    m = mask.copy()
    for _ in range(px):
        grown = m.copy()
        grown[1:, :] |= m[:-1, :]
        grown[:-1, :] |= m[1:, :]
        grown[:, 1:] |= m[:, :-1]
        grown[:, :-1] |= m[:, 1:]
        m = grown
    return m

# --- person core: flood the dark mass from seeds inside the figure ---------
seeds = np.zeros((H, W), bool)
for fx, fy in [(0.49, 0.14), (0.50, 0.47), (0.50, 0.75), (0.63, 0.45), (0.55, 0.94)]:
    x, y = int(fx * W), int(fy * H)
    seeds[max(0, y - 4):y + 4, max(0, x - 4):x + 4] = True
person_dark = spread(seeds, dark, 1400)

# --- add skin / blonde hair / sneakers by growing through non-flower pixels -
person = spread(dilate(person_dark, 2), growable | person_dark, 160)

# strip flower/leaf/branch-coloured pixels that sit far from the dark figure:
# those are growth leaks through petal-shadow crevices, not part of the person
near_dark = dilate(person_dark, 14)
petal2 = valid & (r > 175) & (b >= g - 14) & (b > 150)
person &= near_dark | ~(petal2 | leafish | branchish)
person = spread(seeds, person, 4000)

# fill only small enclosed holes (face interior, glasses highlights) --------
outside = np.zeros((H, W), bool)
outside[0, :] = outside[-1, :] = outside[:, 0] = outside[:, -1] = True
outside = spread(outside, ~person, 4000)
enclosed = ~person & ~outside
while enclosed.any():
    ij = np.argwhere(enclosed)[0]
    seed1 = np.zeros((H, W), bool)
    seed1[ij[0], ij[1]] = True
    comp = spread(seed1, enclosed, 4000)
    frac_petal = (comp & petal2).sum() / max(1, comp.sum())
    if comp.sum() < 26000 and frac_petal < 0.45:
        person |= comp
    enclosed &= ~comp

person_layer_mask = dilate(person, 8) & valid       # person + her white outline
hole = dilate(person, 14)                           # erase a bit past the outline

# --- flowers layer: cut the hole, then onion-peel inpaint -------------------
fl = img.copy()
fl[hole] = 0
filled = ~hole
# premultiplied-alpha averaging pushed inward from the hole boundary
rgba = fl.copy()
rgba[..., :3] *= (rgba[..., 3:4] / 255.0)
for _ in range(420):
    if filled.all():
        break
    acc = np.zeros_like(rgba)
    cnt = np.zeros((H, W), np.float32)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        shifted = np.roll(rgba, (dy, dx), axis=(0, 1))
        smask = np.roll(filled, (dy, dx), axis=(0, 1)).astype(np.float32)
        acc += shifted * smask[..., None]
        cnt += smask
    frontier = (~filled) & (cnt > 0)
    if not frontier.any():
        break
    rgba[frontier] = acc[frontier] / cnt[frontier][..., None]
    filled |= frontier
out_a = rgba[..., 3]
nz = out_a > 1
res = np.zeros_like(rgba)
res[..., 3] = out_a
res[nz, 0] = rgba[nz, 0] / (out_a[nz] / 255.0)
res[nz, 1] = rgba[nz, 1] / (out_a[nz] / 255.0)
res[nz, 2] = rgba[nz, 2] / (out_a[nz] / 255.0)
flowers = np.clip(res, 0, 255).astype(np.uint8)
Image.fromarray(flowers).save(OUT_FLOWERS)

# --- person layer -----------------------------------------------------------
pl = img.copy().astype(np.uint8)
pl[~person_layer_mask] = 0
Image.fromarray(pl).save(OUT_PERSON)

# --- debug overlay ----------------------------------------------------------
dbg = img.copy().astype(np.uint8)
dbg[person_layer_mask, 0] = 255
dbg[person_layer_mask, 1] = dbg[person_layer_mask, 1] // 3
dbg[person_layer_mask, 2] = dbg[person_layer_mask, 2] // 3
Image.fromarray(dbg).save(OUT_DEBUG)

print("person px:", int(person.sum()), "hole px:", int(hole.sum()))
print("saved:", OUT_FLOWERS.name, OUT_PERSON.name, OUT_DEBUG.name)
