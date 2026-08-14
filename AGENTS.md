# Rika Creative Portfolio — Project Guide

## Project Type
Static personal portfolio website.

This is NOT a React, Next.js, or Vite project.
Do not introduce a framework unless explicitly requested.

## Main Runtime Files
- `index.html` — main website structure and content
- `portrait-fix.js` — portrait/image-related runtime fixes if referenced by the page
- `assets/` — visual assets used by the website

## Utility / Maintenance Files
- `tools/` — Python scripts used during asset repair, embedding, and portrait processing
- These scripts are not the primary website runtime.
- Do not modify or execute them unless the task specifically concerns portrait assets or repair tooling.

## Design Direction
Handmade editorial collage / indie zine / scrapbook portfolio.

Visual language:
- hand-cut paper
- editorial collage
- rough ink / pencil / crayon textures
- warm cream background
- subtle risograph grain
- irregular handmade shapes
- Korean editorial / indie magazine feeling
- avoid generic corporate UI

## Important Site Sections
- Things I Build
- Experience
- Content
- Contact + Toolkit

## Locked: Hero / First Screen (as of 2026-08-14)
The hero section of `index.html` is approved and frozen. Do not change its
layout, typography, spacing, portraits, background texture, icon positions,
or interactions unless the request explicitly names the hero.

Frozen surface:
- `index.html` — the `<section class="hero newspaper">` block
- `home-reference.css` — all `.hero*` / `.portal*` rules (desktop lock layer)
- `styles.css` — hero, portal, eye-follow, flora rules
- `script.js` — eye-follow, portal scroll-converge, flora drag, click sound
- `assets/rika-standing-person.png`, `assets/rika-standing-flowers.png`

`experiment.html` + `lab.js` are a separate alternative hero. Editing either
of those does not touch the main page; keep it that way.

Work on later sections (About, Things I Build, Experience, Content, Contact)
must not reach into the files/rules listed above.

## Working Rules
1. Inspect only the files relevant to the requested change.
2. Do not recursively scan generated, backup, cache, or unrelated asset files unless necessary.
3. Preserve existing layout, animation, and visual behavior unless the request specifically asks to change them.
4. Make the smallest viable change.
5. Before large changes, explain which files will be edited.
6. Do not redesign unrelated sections.
7. Do not replace existing handmade visual language with generic modern SaaS styling.
8. Avoid introducing new dependencies unless absolutely necessary.
9. Keep the site runnable as a simple static website.
10. After edits, verify that `index.html` still loads correctly.

## Performance
Avoid scanning the entire project for small edits.
Start from `index.html`, then inspect directly referenced CSS/JS/assets only as needed.
