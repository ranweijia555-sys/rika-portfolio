// Experience — file drawer plus full-record overlay.
//
// Hovering a file slides it open for a preview; clicking opens the complete
// record in an overlay. The overlay is hash-routed (#exp-nio), so a record can
// be linked to directly and the browser Back button closes it — the reach of a
// separate page without a second copy of the site to keep in sync.
//
// To add a role: add one <article class="folder" data-key="x"> to #expDrawer
// and one <template id="exp-x"> with its record. Nothing else needs editing.
(() => {
  const drawer = document.getElementById('expDrawer');
  const overlay = document.getElementById('expOverlay');
  const scroll = document.getElementById('expScroll');
  if (!drawer || !overlay || !scroll) return;

  const folders = [...drawer.querySelectorAll('.folder')];
  const wide = () => matchMedia('(min-width:901px)').matches;
  let lastFocus = null;

  // ---- drawer preview ------------------------------------------------------
  const openFolder = f => {
    if (!wide()) return;
    folders.forEach(o => o.classList.toggle('is-open', o === f));
  };
  const closeFolders = () => folders.forEach(o => o.classList.remove('is-open'));

  folders.forEach(f => {
    f.addEventListener('pointerenter', () => openFolder(f));
    f.querySelector('.folder-face').addEventListener('focus', () => openFolder(f));
    f.querySelector('.folder-face').addEventListener('click', () => {
      location.hash = 'exp-' + f.dataset.key;
    });
  });
  drawer.addEventListener('pointerleave', closeFolders);
  // Open the first file by default so the drawer never reads as empty.
  if (folders[0]) folders[0].classList.add('is-open');

  // ---- record overlay ------------------------------------------------------
  const show = key => {
    const tpl = document.getElementById('exp-' + key);
    if (!tpl) return false;
    scroll.innerHTML = '';
    scroll.appendChild(tpl.content.cloneNode(true));
    scroll.scrollTop = 0;
    overlay.hidden = false;
    document.body.classList.add('exp-locked');
    const closeBtn = overlay.querySelector('.exp-close');
    if (closeBtn) closeBtn.focus();
    return true;
  };

  const hide = () => {
    overlay.hidden = true;
    document.body.classList.remove('exp-locked');
    scroll.innerHTML = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  };

  const route = () => {
    const m = /^#exp-([\w-]+)$/.exec(location.hash);
    if (m) {
      if (overlay.hidden) lastFocus = document.activeElement;
      if (!show(m[1])) clearHash();
    } else if (!overlay.hidden) {
      hide();
    }
  };

  // Drop the hash without adding another history entry to step back through.
  const clearHash = () =>
    history.replaceState(null, '', location.pathname + location.search);

  overlay.addEventListener('click', e => {
    if (e.target.hasAttribute('data-close')) history.back();
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) history.back();
  });
  addEventListener('hashchange', route);

  // Deep link straight into a record.
  route();
})();
