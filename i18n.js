// Bilingual switch.
//
// Each translatable element carries its Chinese in a data-zh attribute, so a
// string and its translation live on the same line of markup and cannot drift
// apart — the same reason there is one page here rather than two.
//
// The English is captured into data-en the first time a switch happens, so the
// markup stays readable as English and nothing has to be duplicated up front.
//
// Records inside <template> are cloned into the overlay after load, so
// experience.js calls applyLang again on the clone.
(() => {
  const KEY = 'rika-lang';
  const stored = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
  let lang = stored === 'zh' || stored === 'en' ? stored
           : (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

  const applyLang = (root, to = lang) => {
    root.querySelectorAll('[data-zh]').forEach(el => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      const next = to === 'zh' ? el.dataset.zh : el.dataset.en;
      if (next !== undefined && el.innerHTML !== next) el.innerHTML = next;
    });
    // Attribute text has to be swapped separately from element content.
    root.querySelectorAll('[data-zh-alt]').forEach(el => {
      if (el.dataset.enAlt === undefined) el.dataset.enAlt = el.getAttribute('alt') || '';
      el.setAttribute('alt', to === 'zh' ? el.dataset.zhAlt : el.dataset.enAlt);
    });
    root.querySelectorAll('[data-zh-label]').forEach(el => {
      if (el.dataset.enLabel === undefined) el.dataset.enLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', to === 'zh' ? el.dataset.zhLabel : el.dataset.enLabel);
    });
  };

  const setLang = to => {
    lang = to;
    document.documentElement.lang = to === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.classList.toggle('lang-zh', to === 'zh');
    applyLang(document, to);
    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === to)));
    try { localStorage.setItem(KEY, to); } catch {}
  };

  window.rikaLang = {get: () => lang, apply: root => applyLang(root, lang), set: setLang};

  const start = () => {
    const sw = document.querySelector('.lang-switch');
    if (sw) sw.addEventListener('click', e => {
      const b = e.target.closest('button[data-lang]');
      if (b) setLang(b.dataset.lang);
    });
    setLang(lang);
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
