(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setupNav() {
    const btn = $('.menu-toggle');
    const nav = $('.nav-links');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    });
  }

  function setupFilters() {
    $$('[data-filter-root]').forEach(root => {
      const input = $('[data-filter-input]', root);
      const select = $('[data-filter-select]', root);
      const cards = $$('.film-card', root);

      const apply = () => {
        const q = (input?.value || '').trim().toLowerCase();
        const s = (select?.value || 'all').trim().toLowerCase();
        cards.forEach(card => {
          const hay = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.genre,
            card.dataset.tags,
            card.dataset.year,
            card.dataset.type
          ].join(' ').toLowerCase();
          const matchQ = !q || hay.includes(q);
          const matchS = s === 'all' || hay.includes(s);
          card.style.display = (matchQ && matchS) ? '' : 'none';
        });
      };

      input?.addEventListener('input', apply);
      select?.addEventListener('change', apply);
      apply();
    });
  }

  function setupTabs() {
    $$('[data-tabs]').forEach(root => {
      const buttons = $$('[data-tab-btn]', root);
      const panels = $$('[data-tab-panel]', root);
      const activate = name => {
        buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.tabBtn === name));
        panels.forEach(panel => panel.classList.toggle('active', panel.dataset.tabPanel === name));
      };
      buttons.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.tabBtn)));
      if (buttons[0]) activate(buttons[0].dataset.tabBtn);
    });
  }

  function setupPlayer() {
    $$('video[data-m3u8]').forEach(video => {
      const m3u8 = video.dataset.m3u8;
      const mp4 = video.dataset.mp4;
      const canNativeHls = video.canPlayType('application/vnd.apple.mpegurl');
      if (canNativeHls) {
        video.src = m3u8;
      } else {
        video.src = mp4 || m3u8;
      }
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      if (video.posterHint) video.poster = video.posterHint;
    });
  }

  function setupBackToTop() {
    const btn = $('.backtotop');
    if (!btn) return;
    const onScroll = () => {
      btn.hidden = window.scrollY < 600;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    onScroll();
  }

  setupNav();
  setupFilters();
  setupTabs();
  setupPlayer();
  setupBackToTop();
})();
