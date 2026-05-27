
(() => {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  const debounce = (fn, wait = 120) => {
    let timer = null;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), wait);
    };
  };

  const normalize = (value) => (value || '').toString().toLowerCase();

  const initMobileMenu = () => {
    const btn = document.querySelector('[data-menu-toggle]');
    const panel = document.querySelector('[data-mobile-panel]');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');
    });
  };

  const initHeroSlider = () => {
    const hero = document.querySelector('[data-hero]');
    const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(document.querySelectorAll('[data-hero-dot]'));
    if (!hero || slides.length <= 1) return;

    let active = slides.findIndex((slide) => slide.classList.contains('active'));
    if (active < 0) active = 0;

    const setActive = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === active));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
    };

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => setActive(index));
    });

    let timer = window.setInterval(() => setActive(active + 1), 5000);

    hero.addEventListener('mouseenter', () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    });

    hero.addEventListener('mouseleave', () => {
      if (!timer) {
        timer = window.setInterval(() => setActive(active + 1), 5000);
      }
    });
  };

  const collectCardText = (card) => {
    const attrs = [
      card.dataset.title,
      card.dataset.region,
      card.dataset.type,
      card.dataset.genre,
      card.dataset.tags,
      card.dataset.year
    ];
    return normalize(attrs.join(' '));
  };

  const initFilters = () => {
    const inputs = Array.from(document.querySelectorAll('[data-filter-input]'));
    const cards = Array.from(document.querySelectorAll('[data-card]'));
    const regionSelect = document.querySelector('[data-filter-region]');
    const typeSelect = document.querySelector('[data-filter-type]');
    const yearSelect = document.querySelector('[data-filter-year]');
    const sortSelect = document.querySelector('[data-sort-select]');
    const empty = document.querySelector('[data-empty-state]');
    if (!inputs.length && !regionSelect && !typeSelect && !yearSelect && !sortSelect) return;

    const apply = () => {
      const q = normalize(inputs.map((el) => el.value).join(' ')).trim();
      const region = normalize(regionSelect && regionSelect.value);
      const type = normalize(typeSelect && typeSelect.value);
      const year = normalize(yearSelect && yearSelect.value);

      let visibleCount = 0;
      cards.forEach((card) => {
        const text = collectCardText(card);
        const matchesQuery = !q || text.includes(q);
        const matchesRegion = !region || region === 'all' || normalize(card.dataset.region).includes(region);
        const matchesType = !type || type === 'all' || normalize(card.dataset.type).includes(type);
        const matchesYear = !year || year === 'all' || normalize(card.dataset.year).includes(year);
        const visible = matchesQuery && matchesRegion && matchesType && matchesYear;
        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount += 1;
      });

      if (empty) {
        empty.style.display = visibleCount ? 'none' : 'block';
      }
    };

    const onInput = debounce(apply, 80);
    inputs.forEach((input) => input.addEventListener('input', onInput));
    [regionSelect, typeSelect, yearSelect].forEach((el) => {
      if (el) el.addEventListener('change', apply);
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const grid = sortSelect.closest('[data-sort-area]')?.querySelector('[data-sort-grid]') || document.querySelector('[data-sort-grid]');
        if (!grid) return;
        const cardsInGrid = Array.from(grid.querySelectorAll('[data-card]'));
        const mode = sortSelect.value;
        cardsInGrid.sort((a, b) => {
          const yearA = Number(a.dataset.year || 0);
          const yearB = Number(b.dataset.year || 0);
          const scoreA = Number(a.dataset.score || 0);
          const scoreB = Number(b.dataset.score || 0);
          const titleA = normalize(a.dataset.title);
          const titleB = normalize(b.dataset.title);
          if (mode === 'year-desc') return yearB - yearA || scoreB - scoreA;
          if (mode === 'year-asc') return yearA - yearB || scoreA - scoreB;
          if (mode === 'title-asc') return titleA.localeCompare(titleB, 'zh-Hans-CN');
          if (mode === 'title-desc') return titleB.localeCompare(titleA, 'zh-Hans-CN');
          return scoreB - scoreA || yearB - yearA;
        });
        cardsInGrid.forEach((card) => grid.appendChild(card));
        apply();
      });
    }

    apply();
  };

  const initBackToTop = () => {
    const button = document.querySelector('[data-back-to-top]');
    if (!button) return;
    const toggle = () => {
      button.classList.toggle('show', window.scrollY > 520);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const initHlsPlayers = () => {
    const players = Array.from(document.querySelectorAll('video[data-hls-src]'));
    if (!players.length) return;
    players.forEach((video) => {
      const hlsSrc = video.dataset.hlsSrc;
      const mp4Src = video.dataset.mp4Src;
      const poster = video.dataset.poster;
      if (poster && !video.getAttribute('poster')) {
        video.setAttribute('poster', poster);
      }

      const fallback = () => {
        if (mp4Src && !video.querySelector('source')) {
          const source = document.createElement('source');
          source.src = mp4Src;
          source.type = 'video/mp4';
          video.appendChild(source);
        }
      };

      if (window.Hls && window.Hls.isSupported && window.Hls.isSupported() && hlsSrc) {
        try {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(hlsSrc);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.ERROR, (_event, data) => {
            if (data && data.fatal) {
              fallback();
              try {
                hls.destroy();
              } catch (err) {}
            }
          });
        } catch (err) {
          fallback();
        }
      } else {
        fallback();
      }
    });
  };

  const initQuickSearch = () => {
    const searchTargets = document.querySelectorAll('[data-global-search]');
    if (!searchTargets.length) return;
    searchTargets.forEach((input) => {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          const value = input.value.trim();
          if (!value) return;
          const searchInput = document.querySelector('[data-filter-input]');
          if (searchInput) {
            searchInput.value = value;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            window.location.href = `search.html?q=${encodeURIComponent(value)}`;
          }
        }
      });
    });
  };

  const initSearchQueryFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const inputs = document.querySelectorAll('[data-filter-input]');
    if (q && inputs.length) {
      inputs.forEach((input) => {
        input.value = q;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
  };

  ready(() => {
    initMobileMenu();
    initHeroSlider();
    initFilters();
    initBackToTop();
    initHlsPlayers();
    initQuickSearch();
    initSearchQueryFromUrl();
  });
})();
