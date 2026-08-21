// Things I Build — two-state project wheel.
//
//   Overview  : every project sits on one full circle in the middle of the
//               section, gently floating. Nothing is selected.
//   Focused   : the pointer enters the stage, the circle unrolls into a
//               large-radius vertical arc parked at the left, one project
//               centred and its neighbours clipped by the stage edges, and
//               the detail panel opens on the right.
//
// Neither state spins; the only idle motion is the slow bob on .rw-float.
//
// To add a project: add one <button class="rw-card" data-key="x" style="--c:#hex">
// inside #rwTrack, one <li data-key="x"> inside #rwNav, and one
// <article class="wd-panel" data-key="x"> inside #wheelDetail. Both layouts
// are computed from the card count, so nothing else needs editing.
(() => {
  const rw = document.getElementById('buildWheel');
  const stage = document.getElementById('rwStage');
  const track = document.getElementById('rwTrack');
  const detail = document.getElementById('wheelDetail');
  if (!rw || !stage || !track || !detail) return;

  const cards = [...track.querySelectorAll('.rw-card')];
  const navItems = [...document.querySelectorAll('#rwNav li')];
  const panels = [...detail.querySelectorAll('.wd-panel')];
  const capNo = document.getElementById('rwNo');
  const capName = document.getElementById('rwName');
  const arc = document.getElementById('rwArc');
  if (!cards.length) return;

  const ARC_R = 980;    // radius of the focused arc, in px
  const ARC_STEP = 17;  // degrees between neighbours on that arc
  const RING_R = 208;   // radius of the overview circle
  const RING_SCALE = 0.44;

  const wide = () => matchMedia('(min-width:901px)').matches;
  const rad = d => d * Math.PI / 180;

  let focused = false;
  let focus = 0;

  const place = () => {
    if (!wide()) return;
    // In the focused state the whole arc shifts left to make room for detail.
    const shift = focused ? -stage.clientWidth * 0.24 : 0;
    cards.forEach((card, i) => {
      let x, y, scale, op, z, spin = 0;
      if (focused) {
        const a = rad((i - focus) * ARC_STEP);
        x = ARC_R * (Math.cos(a) - 1);
        y = ARC_R * Math.sin(a);
        const dist = Math.abs(i - focus);
        scale = dist === 0 ? 1 : dist === 1 ? 0.84 : 0.72;
        op = dist === 0 ? 1 : dist === 1 ? 0.5 : 0.22;
        z = 50 - dist;
        card.classList.toggle('is-focus', dist === 0);
      } else {
        const deg = (360 / cards.length) * i - 90;
        const a = rad(deg);
        x = RING_R * Math.cos(a);
        y = RING_R * Math.sin(a);
        scale = RING_SCALE;
        op = 1;
        z = 10;
        // Lean along the circle, but only a little: a true tangent would put
        // the bottom card at 180deg and its title upside down. The reference
        // can rotate freely because its cards are captionless photos.
        spin = -Math.cos(a) * 15;
        card.classList.remove('is-focus');
      }
      // Round: cos(+-90deg) leaves float dust that serialises as 1e-16.
      card.style.transform =
        `translate(-50%,-50%) translate(${(shift + x).toFixed(1)}px,${y.toFixed(1)}px) ` +
        `rotate(${spin.toFixed(2)}deg) scale(${scale})`;
      card.style.opacity = String(op);
      card.style.zIndex = String(z);
    });
  };

  const drawArc = () => {
    if (!arc || !wide()) return;
    const cx = stage.clientWidth / 2 - stage.clientWidth * 0.24;
    const cy = stage.clientHeight / 2;
    const pts = [];
    for (let d = -60; d <= 60; d += 3) {
      const a = rad(d);
      pts.push(`${(cx + ARC_R * (Math.cos(a) - 1)).toFixed(1)},${(cy + ARC_R * Math.sin(a)).toFixed(1)}`);
    }
    arc.setAttribute('d', 'M' + pts.join('L'));
  };

  const render = () => {
    place();
    rw.classList.toggle('is-focus', focused);
    const key = focused ? cards[focus].dataset.key : null;
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.key === key));
    navItems.forEach(n => n.classList.toggle('is-focus', n.dataset.key === key));
    if (focused) {
      if (capNo) capNo.textContent = String(focus + 1).padStart(2, '0');
      if (capName) capName.textContent = cards[focus].querySelector('.rw-ttl').textContent;
    }
  };

  const setFocus = (i, on = true) => {
    i = Math.max(0, Math.min(cards.length - 1, i));
    if (focused === on && focus === i) return;
    focused = on;
    focus = i;
    render();
  };

  // Pointer height over the stage picks the project: equal bands, so the
  // choice never oscillates as the cards animate into place.
  const bandAt = e => {
    const r = stage.getBoundingClientRect();
    return Math.floor(((e.clientY - r.top) / r.height) * cards.length);
  };

  stage.addEventListener('pointerenter', e => { if (wide()) setFocus(bandAt(e), true); });
  stage.addEventListener('pointermove', e => { if (wide()) setFocus(bandAt(e), true); });
  rw.addEventListener('pointerleave', () => { if (wide()) setFocus(focus, false); });
  // Keep it open while the pointer moves across to read the detail panel.
  detail.addEventListener('pointerenter', () => { if (wide()) setFocus(focus, true); });

  cards.forEach((card, i) => {
    card.addEventListener('focus', () => setFocus(i, true));
    card.addEventListener('click', () => {
      if (!focused || i !== focus) { setFocus(i, true); return; }
      const link = detail.querySelector(`.wd-panel[data-key="${card.dataset.key}"] .wd-link`);
      if (link) link.click();
    });
  });
  navItems.forEach((li, i) => li.addEventListener('pointerenter', () => setFocus(i, true)));

  rw.addEventListener('focusout', e => {
    if (!rw.contains(e.relatedTarget)) setFocus(focus, false);
  });

  render();
  drawArc();
  addEventListener('resize', () => { place(); drawArc(); });
  addEventListener('load', () => { place(); drawArc(); });
})();
