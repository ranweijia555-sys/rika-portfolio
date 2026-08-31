// Photo slots fill themselves from assets/photo-manifest.json.
//
// Add a photo:  drop the file into assets/experience/ or assets/content/,
//               run  python3 tools/scan_photos.py,  reload.
//
// The slot name is the filename: data-slot="nio" takes nio.jpg, and the
// drawer's cover-nio takes that same file. A slot with no photo keeps its
// designed placeholder, so nothing ever shows a broken image.
//
// This reads a manifest rather than guessing at extensions. Guessing cost
// four requests per slot and a console 404 for every miss — about seventy
// failed requests on a page where most slots were still empty.
//
// Record photos live inside <template> elements and only exist once a record
// is cloned into the overlay, so experience.js calls fillPhotoSlots again.
(() => {
  let manifest = null;

  const fill = (holder, src, alt) => {
    if (!src || holder.querySelector('img')) return;
    const img = document.createElement('img');
    img.alt = alt || '';
    img.decoding = 'async';
    img.src = src;
    holder.insertBefore(img, holder.firstChild);
  };

  const fillAll = root => {
    if (!manifest) return;
    root.querySelectorAll('.peek-photo[data-slot]').forEach(el => {
      const slot = el.dataset.slot.replace(/^cover-/, '');
      fill(el, manifest.experience[slot], '');
    });
    // A record photo with no file is dropped rather than left as an empty
    // frame: a placeholder reads as unfinished once the rest are filled in.
    // The drawer covers keep theirs, since the folder is laid out around them.
    root.querySelectorAll('.ov-figure[data-slot]').forEach(el => {
      const src = manifest.experience[el.dataset.slot];
      if (!src) { el.remove(); return; }
      const cap = el.querySelector('figcaption');
      fill(el, src, cap ? cap.textContent.trim() : '');
    });
    root.querySelectorAll('.slide[data-slot]').forEach(el => {
      const h = el.querySelector('.slide-cap h3');
      fill(el, manifest.content[el.dataset.slot], h ? h.textContent.trim() : '');
    });
    // A tool waiting on its logo shows as a wordmark; the file turns it back
    // into an icon chip without anyone editing the markup.
    root.querySelectorAll('.tool.is-word[data-logo]').forEach(el => {
      const src = manifest.logos[el.dataset.logo];
      if (!src) return;
      fill(el.querySelector('.tool-ico'), src, '');
      el.classList.remove('is-word');
    });
  };

  window.fillPhotoSlots = fillAll;

  fetch('assets/photo-manifest.json')
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (!data) return;
      manifest = {experience: data.experience || {}, content: data.content || {},
                  logos: data.logos || {}};
      fillAll(document);
    })
    .catch(() => {});   // no manifest yet: every slot keeps its placeholder
})();
