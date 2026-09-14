/* ── Custom cursor ───────────────────────────────────────────── */
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let rx = mx, ry = my;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
});

(function animateRing() {
  rx += (mx - rx) * 0.11;
  ry += (my - ry) * 0.11;
  ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(animateRing);
})();

document.querySelectorAll('a, button, [data-tilt]').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});


/* ── Magnetic buttons ────────────────────────────────────────── */
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.28;
    const y = (e.clientY - r.top  - r.height / 2) * 0.28;
    el.style.transform = `translate(${x}px,${y}px)`;
    el.style.transition = 'transform .1s';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
    el.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
  });
});


/* ── Card 3D tilt ────────────────────────────────────────────── */
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateZ(10px)`;
    card.style.transition = 'transform .1s, box-shadow .4s';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform .6s cubic-bezier(.22,.75,.2,1), box-shadow .4s';
  });
});


/* ── Scroll reveal ───────────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));


/* ── Nav frosted glass on scroll ─────────────────────────────── */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


/* ── Hero text reveal on load ────────────────────────────────── */
window.addEventListener('load', () => {
  document.querySelector('.hero').classList.add('loaded');
});


/* ── Language switch (delegates to i18n.js when loaded) ────────── */
document.querySelectorAll('.lang-sw button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-sw button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const lang = btn.dataset.lang;
    if (typeof applyLang === 'function') {
      applyLang(lang);
    } else {
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
      document.querySelectorAll('[data-zh]').forEach(el => {
        if (!el._enText) el._enText = el.innerHTML;
        el.innerHTML = lang === 'zh' ? el.dataset.zh : el._enText;
      });
    }
  });
});
