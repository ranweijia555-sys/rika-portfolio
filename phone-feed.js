// Content — the phone feed pages like a real short-video app.
//
// Three things separate "a scrolling list" from "a feed you flick through":
//   1. one gesture moves exactly one post, never two and never half of one
//   2. dragging follows the finger, then settles to a whole post on release
//   3. the page behind never scrolls until the feed has reached its own end
//
// To add a post: add one <article class="slide"> to #phoneFeed, optionally
// with an <img> before its .slide-cap. Dot count follows the slide count.
(() => {
  const feed = document.getElementById('phoneFeed');
  const dots = document.getElementById('phoneDots');
  if (!feed) return;

  const slides = () => [...feed.querySelectorAll('.slide')];
  const smooth = !matchMedia('(prefers-reduced-motion:reduce)').matches;
  const step = () => feed.clientHeight;
  const count = () => slides().length;
  const current = () => Math.round(feed.scrollTop / step());

  // ---- dots ---------------------------------------------------------------
  // Painted from the scroll position, but also driven directly by goTo: the
  // scroll event alone can lag or be throttled, and a page indicator that
  // disagrees with what is on screen is worse than no indicator.
  let paint = () => {};
  if (dots) {
    slides().forEach(() => dots.appendChild(document.createElement('i')));
    paint = at => {
      const i = at === undefined ? current() : at;
      [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    };
    feed.addEventListener('scroll', () => paint(), {passive: true});
    paint();
  }

  const goTo = i => {
    const n = Math.max(0, Math.min(count() - 1, i));
    feed.scrollTo({top: n * step(), behavior: smooth ? 'smooth' : 'auto'});
    paint(n);
  };

  // ---- wheel: one post per gesture ----------------------------------------
  // A trackpad fires dozens of small deltas per flick, so the handler locks
  // until the feed has settled rather than advancing once per event.
  let locked = false;
  feed.addEventListener('wheel', e => {
    const atTop = feed.scrollTop <= 1;
    const atEnd = feed.scrollTop >= (count() - 1) * step() - 1;
    // Hand the gesture back to the page at the ends, so the feed never traps
    // someone who is simply scrolling past this section.
    if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atEnd)) return;
    e.preventDefault();
    if (locked || Math.abs(e.deltaY) < 4) return;
    locked = true;
    goTo(current() + (e.deltaY > 0 ? 1 : -1));
    setTimeout(() => { locked = false; }, 420);
  }, {passive: false});

  // ---- drag: follow the pointer, then settle -------------------------------
  let dragging = false, startY = 0, startTop = 0, lastY = 0, lastT = 0, vel = 0;

  feed.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    startY = lastY = e.clientY;
    startTop = feed.scrollTop;
    lastT = performance.now();
    vel = 0;
    feed.classList.add('is-dragging');
    feed.setPointerCapture(e.pointerId);
  });

  feed.addEventListener('pointermove', e => {
    if (!dragging) return;
    feed.scrollTop = startTop - (e.clientY - startY);
    const now = performance.now(), dt = now - lastT;
    if (dt > 0) { vel = (e.clientY - lastY) / dt; lastY = e.clientY; lastT = now; }
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    feed.classList.remove('is-dragging');
    const moved = feed.scrollTop - startTop;
    const from = Math.round(startTop / step());
    // A short flick counts as a page turn even when the drag was small.
    const flick = Math.abs(vel) > 0.45;
    let target = from;
    if (flick) target = from + (vel < 0 ? 1 : -1);
    else if (Math.abs(moved) > step() * 0.18) target = from + (moved > 0 ? 1 : -1);
    goTo(target);
  };
  feed.addEventListener('pointerup', release);
  feed.addEventListener('pointercancel', release);

  // ---- keyboard ------------------------------------------------------------
  feed.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current() + 1); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(current() - 1); }
  });

  // Keep the feed on a whole post if the window resizes mid-scroll.
  addEventListener('resize', () => { feed.scrollTop = current() * step(); });
})();
