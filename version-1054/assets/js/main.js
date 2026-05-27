(function () {
  var body = document.body;

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
      body.classList.toggle('menu-open', nav.classList.contains('open'));
    });
    selectAll('.mobile-link', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        body.classList.remove('menu-open');
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = selectAll('.hero-slide', hero);
    var dots = selectAll('[data-hero-dot]', hero);
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var index = Number(dot.getAttribute('data-hero-dot')) || 0;
        show(index);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    selectAll('[data-filter-scope]').forEach(function (scope) {
      var input = scope.querySelector('[data-filter-input]');
      var cards = selectAll('[data-card]', scope);
      var empty = scope.querySelector('[data-empty-state]');
      if (!input || !cards.length) {
        return;
      }

      function getText(card) {
        return [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-tags') || '',
          card.getAttribute('data-year') || '',
          card.textContent || ''
        ].join(' ').toLowerCase();
      }

      function applyFilter(value) {
        var query = String(value || '').trim().toLowerCase();
        var visibleCount = 0;
        cards.forEach(function (card) {
          var matched = !query || getText(card).indexOf(query) !== -1;
          card.classList.toggle('hidden', !matched);
          if (matched) {
            visibleCount += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('show', visibleCount === 0);
        }
      }

      input.addEventListener('input', function () {
        applyFilter(input.value);
      });

      selectAll('[data-filter-chip]', scope).forEach(function (chip) {
        chip.addEventListener('click', function () {
          input.value = chip.getAttribute('data-filter-chip') || '';
          applyFilter(input.value);
          input.focus();
        });
      });
    });
  }

  function setupImageFallback() {
    selectAll('img').forEach(function (image) {
      image.addEventListener('error', function () {
        image.classList.add('image-error');
      }, { once: true });
    });
  }

  function setupPlayers() {
    selectAll('video[data-m3u8]').forEach(function (video) {
      var source = video.getAttribute('data-m3u8');
      var overlay = video.parentElement ? video.parentElement.querySelector('.play-overlay') : null;
      var hlsInstance = null;

      function initHls() {
        if (!source || video.getAttribute('data-player-ready') === 'true') {
          return;
        }
        video.setAttribute('data-player-ready', 'true');
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
            } else {
              hlsInstance.destroy();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else {
          var sourceElement = video.querySelector('source');
          if (sourceElement) {
            sourceElement.src = source;
          }
          video.load();
        }
      }

      function playVideo() {
        initHls();
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      }

      if (overlay) {
        overlay.addEventListener('click', playVideo);
      }
      video.addEventListener('play', function () {
        if (overlay) {
          overlay.classList.add('hidden');
        }
      });
      video.addEventListener('pause', function () {
        if (overlay && video.currentTime === 0) {
          overlay.classList.remove('hidden');
        }
      });
      video.addEventListener('ended', function () {
        if (overlay) {
          overlay.classList.remove('hidden');
        }
      });
      video.addEventListener('loadedmetadata', function () {
        if (overlay && !video.paused) {
          overlay.classList.add('hidden');
        }
      });
      initHls();

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function setupFilterLinks() {
    selectAll('[data-filter-link]').forEach(function (link) {
      link.addEventListener('click', function () {
        try {
          window.sessionStorage.setItem('movieFilter', link.getAttribute('data-filter-link') || '');
        } catch (error) {}
      });
    });
    var input = document.querySelector('[data-filter-input]');
    if (!input) {
      return;
    }
    try {
      var stored = window.sessionStorage.getItem('movieFilter');
      if (stored) {
        input.value = stored;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        window.sessionStorage.removeItem('movieFilter');
      }
    } catch (error) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupImageFallback();
    setupPlayers();
    setupFilterLinks();
  });
})();
