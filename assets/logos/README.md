# Tool logos

Sixteen marks came from simple-icons 13.21.0 (CC0-1.0, public domain),
each patched with its brand colour from that project's own data.

Two colours were darkened to stay legible on the cream card, since the
originals all but disappear on it:

| slug       | official   | used here  |
|------------|------------|------------|
| turso      | #4FF8D2    | #12C4A0    |
| javascript | #F7DF1E    | #C9B200    |

## The three waiting on a file

CapCut, Final Cut Pro and Xiumi have no usable public icon: the only
CapCut file on Wikimedia Commons is a 960x182 wordmark rather than the
square mark, and Apple's app icons are not there at all.

Their chips are already wired. Drop these three files in and they appear
on the next reload, with no edit anywhere:

    assets/logos/capcut.png
    assets/logos/finalcutpro.png
    assets/logos/xiumi.png

Square, transparent background, 96px or larger. Until a file exists the
chip falls back to a wordmark on its own, so a missing one never shows a
broken image. To use SVG instead, change the extension in that chip's
<img src>.

## The two with no mark to use

Excel and SQL stay wordmarks: Microsoft had its brand icons removed from
simple-icons, and SQL is a language rather than a product, so it has no
logo at all. Neither got an invented one.
