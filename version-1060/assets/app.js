(() => {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const body = document.body;
  const page = body.dataset.page || "";

  const menuBtn = qs("[data-menu-toggle]");
  const mobileNav = qs("[data-mobile-nav]");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("hidden");
      body.classList.toggle("no-scroll", !mobileNav.classList.contains("hidden"));
    });

    qsa('a', mobileNav).forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.add("hidden");
        body.classList.remove("no-scroll");
      });
    });
  }

  // Search and filtering on listing pages
  const searchInput = qs("[data-search]");
  const categoryFilter = qs("[data-category-filter]");
  const typeFilter = qs("[data-type-filter]");
  const cards = qsa("[data-card]");

  const applyFilters = () => {
    if (!cards.length) return;
    const query = (searchInput?.value || "").trim().toLowerCase();
    const cat = categoryFilter?.value || "all";
    const type = typeFilter?.value || "all";
    let shown = 0;

    cards.forEach((card) => {
      const title = (card.dataset.title || "").toLowerCase();
      const genre = (card.dataset.genre || "").toLowerCase();
      const region = (card.dataset.region || "").toLowerCase();
      const year = (card.dataset.year || "").toLowerCase();
      const contentType = (card.dataset.type || "").toLowerCase();
      const category = card.dataset.category || "";

      const matchQuery =
        !query ||
        title.includes(query) ||
        genre.includes(query) ||
        region.includes(query) ||
        year.includes(query);

      const matchCat = cat === "all" || category === cat;
      const matchType = type === "all" || contentType === type;

      const visible = matchQuery && matchCat && matchType;
      card.classList.toggle("hidden", !visible);
      if (visible) shown += 1;
    });

    const counter = qs("[data-result-count]");
    if (counter) counter.textContent = String(shown);
  };

  if (searchInput || categoryFilter || typeFilter) {
    [searchInput, categoryFilter, typeFilter].forEach((el) => {
      if (el) el.addEventListener("input", applyFilters);
      if (el) el.addEventListener("change", applyFilters);
    });

    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q && searchInput) searchInput.value = q;
    applyFilters();
  }

  // Hero scroller auto movement
  const scroller = qs("[data-auto-scroll]");
  if (scroller) {
    let raf = null;
    let paused = false;
    let dir = 1;

    const step = () => {
      if (!paused) {
        scroller.scrollLeft += dir * 0.45;
        const max = scroller.scrollWidth - scroller.clientWidth;
        if (scroller.scrollLeft >= max - 2) dir = -1;
        if (scroller.scrollLeft <= 0) dir = 1;
      }
      raf = requestAnimationFrame(step);
    };

    scroller.addEventListener("mouseenter", () => { paused = true; });
    scroller.addEventListener("mouseleave", () => { paused = false; });
    step();
  }

  // Detail page player
  const player = qs("[data-player]");
  if (player) {
    const video = qs("video", player);
    const playBtn = qs("[data-play-btn]", player);
    const hlsSrc = video?.dataset.hls || "";
    const mp4Src = video?.dataset.mp4 || "";
    const poster = video?.dataset.poster || "";

    if (video) {
      if (poster) video.poster = poster;

      // Prefer native HLS when supported; otherwise use MP4 fallback.
      const canNativeHls = video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL");
      if (hlsSrc && canNativeHls) {
        video.src = hlsSrc;
      } else if (mp4Src) {
        video.src = mp4Src;
      }

      const syncBtn = () => {
        if (!playBtn) return;
        const isPaused = video.paused;
        playBtn.setAttribute("aria-label", isPaused ? "播放" : "暂停");
        playBtn.innerHTML = isPaused
          ? '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
          : '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
      };

      if (playBtn) {
        playBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            if (video.paused) {
              await video.play();
            } else {
              video.pause();
            }
          } catch (err) {
            // Intentionally silent; browser may block autoplay until gesture.
          }
          syncBtn();
        });
      }

      video.addEventListener("play", syncBtn);
      video.addEventListener("pause", syncBtn);
      video.addEventListener("loadedmetadata", syncBtn);
      video.addEventListener("click", async () => {
        try {
          if (video.paused) await video.play();
          else video.pause();
        } catch (err) {}
        syncBtn();
      });
      syncBtn();
    }
  }

  // Simple current year
  const yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Category chips on catalog pages
  const categoryTabs = qsa("[data-chip-category]");
  if (categoryTabs.length) {
    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const value = tab.dataset.chipCategory || "all";
        if (categoryFilter) {
          categoryFilter.value = value;
          categoryFilter.dispatchEvent(new Event("change", { bubbles: true }));
        }
        categoryTabs.forEach((btn) => btn.classList.remove("is-active"));
        tab.classList.add("is-active");
      });
    });
  }

  // Progressive enhancement: ensure linked cards are keyboard focusable
  qsa("[data-card]").forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const link = qs("a", card);
        if (link) location.href = link.href;
      }
    });
  });
})();
