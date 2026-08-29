# Tool logos

Sixteen marks came from simple-icons 13.21.0 (CC0-1.0, public domain),
each patched with its brand colour from that project's own data.

Two colours were darkened to stay legible on the cream card, since the
originals all but disappear on it:

| slug       | official   | used here  |
|------------|------------|------------|
| turso      | #4FF8D2    | #12C4A0    |
| javascript | #F7DF1E    | #C9B200    |

## The five without a mark

CapCut, Final Cut Pro, Excel, Xiumi and SQL have no icon available —
Microsoft had its brand icons removed from the set, and SQL is a language
rather than a product, so it has no logo at all. Those five are wordmark
chips by design; no logo was invented for them.

To give one a real logo later, drop the file here and swap its chip:

    <span class="tool" data-logo="capcut">
      <i class="tool-ico" data-mono="C"><img class="logo" src="assets/logos/capcut.svg" alt=""></i>
      <b>CapCut</b>
    </span>

(remove `is-word` from the span). SVG is best; a transparent PNG at 96px
or more also works. The monogram behind `data-mono` shows only while no
image is present.
