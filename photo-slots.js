// Photo slots fill themselves by filename convention.
//
// Drop a file into the folder and reload — no markup to edit. A slot named
// data-slot="nio" looks for assets/experience/nio.jpg, then .png, .jpeg and
// .webp, and if none of them exist it quietly leaves its designed placeholder
// alone rather than showing a broken image.
//
// Record slots live inside <template> elements, so this also has to run each
// time a record is cloned into the overlay; experience.js calls back in.
(() => {
  const EXT = ['jpg', 'png', 'jpeg', 'webp'];

  const fill = (holder, base, alt) => {
    if (holder.querySelector('img')) return;      // already filled
    let i = 0;
    const img = document.createElement('img');
    img.alt = alt || '';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      i += 1;
      if (i < EXT.length) img.src = `${base}.${EXT[i]}`;
      else img.remove();                          // placeholder stays visible
    });
    img.src = `${base}.${EXT[0]}`;
    holder.insertBefore(img, holder.firstChild);
  };

  const fillAll = root => {
    // Experience: drawer covers (cover-nio) and record photos (nio)
    root.querySelectorAll('.peek-photo[data-slot],.ov-figure[data-slot]').forEach(el => {
      const slot = el.dataset.slot.replace(/^cover-/, '');
      const cap = el.querySelector('figcaption');
      fill(el, `assets/experience/${slot}`, cap ? cap.textContent.trim() : '');
    });
    // Content: one image per post in the phone feed
    root.querySelectorAll('.slide[data-slot]').forEach(el => {
      const h = el.querySelector('.slide-cap h3');
      fill(el, `assets/content/${el.dataset.slot}`, h ? h.textContent.trim() : '');
    });
  };

  window.fillPhotoSlots = fillAll;
  fillAll(document);
})();
