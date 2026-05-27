import { H as Hls } from "./hls-vendor-dru42stk.js";
import { MOVIES } from "./movies-data.js";

const SELECTORS = {
  heroSlide: "[data-hero-slide]",
  heroDot: "[data-hero-dot]",
  heroPrev: "[data-hero-prev]",
  heroNext: "[data-hero-next]",
  menuToggle: "[data-menu-toggle]",
  mobileNav: "[data-mobile-nav]",
  cardFilter: "[data-card-filter]",
  tableFilter: "[data-table-filter]",
  playerStart: "[data-player-start]",
  searchResults: "[data-search-results]"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalise(value) {
  return String(value ?? "").trim().toLowerCase();
}

function setupMobileMenu() {
  const button = document.querySelector(SELECTORS.menuToggle);
  const nav = document.querySelector(SELECTORS.mobileNav);
  if (!button || !nav) {
    return;
  }

  button.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
}

function setupHero() {
  const slides = [...document.querySelectorAll(SELECTORS.heroSlide)];
  const dots = [...document.querySelectorAll(SELECTORS.heroDot)];
  const prev = document.querySelector(SELECTORS.heroPrev);
  const next = document.querySelector(SELECTORS.heroNext);
  if (slides.length === 0) {
    return;
  }

  let current = 0;
  let timer = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => show(current + 1), 5000);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  prev?.addEventListener("click", () => {
    show(current - 1);
    start();
  });

  next?.addEventListener("click", () => {
    show(current + 1);
    start();
  });

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => {
      show(dotIndex);
      start();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  show(0);
  start();
}

function setupCardFilters() {
  document.querySelectorAll(SELECTORS.cardFilter).forEach((input) => {
    const scope = input.closest("section")?.querySelector("[data-filter-scope]") || document;
    const cards = [...scope.querySelectorAll(".movie-card")];
    const yearSelect = input.closest(".toolbar")?.querySelector("[data-year-filter]");

    const applyFilter = () => {
      const keyword = normalise(input.value);
      const year = yearSelect ? String(yearSelect.value || "") : "";
      cards.forEach((card) => {
        const text = normalise(card.textContent);
        const cardYear = String(card.dataset.year || "");
        const matchedKeyword = !keyword || text.includes(keyword);
        const matchedYear = !year || cardYear === year;
        card.classList.toggle("is-filtered-out", !(matchedKeyword && matchedYear));
      });
    };

    input.addEventListener("input", applyFilter);
    yearSelect?.addEventListener("change", applyFilter);
  });
}

function setupTableFilter() {
  const input = document.querySelector(SELECTORS.tableFilter);
  const table = document.querySelector("[data-filter-table]");
  if (!input || !table) {
    return;
  }

  const rows = [...table.querySelectorAll("tbody tr")];
  input.addEventListener("input", () => {
    const keyword = normalise(input.value);
    rows.forEach((row) => {
      const text = normalise(row.textContent);
      row.classList.toggle("is-filtered-out", keyword && !text.includes(keyword));
    });
  });
}

function movieCardTemplate(movie) {
  const tags = (movie.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="movie-card">
      <a class="movie-poster" href="./${escapeHtml(movie.url)}" aria-label="${escapeHtml(movie.title)} 在线观看">
        <img src="./${escapeHtml(movie.cover)}" alt="${escapeHtml(movie.title)}" loading="lazy">
        <span class="movie-badge">${escapeHtml(movie.type)}</span>
      </a>
      <div class="movie-info">
        <h3><a href="./${escapeHtml(movie.url)}">${escapeHtml(movie.title)}</a></h3>
        <p class="movie-meta">${escapeHtml(movie.year)} · ${escapeHtml(movie.region)} · ${escapeHtml(movie.genre)}</p>
        <p class="movie-desc">${escapeHtml(movie.oneLine)}</p>
        <div class="tag-row">${tags}</div>
      </div>
    </article>`;
}

function setupSearchPage() {
  const results = document.querySelector(SELECTORS.searchResults);
  if (!results) {
    return;
  }

  const input = document.querySelector("#global-search-input");
  const count = document.querySelector("#search-count");
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  if (input) {
    input.value = initialQuery;
  }

  const render = (query) => {
    const keyword = normalise(query);
    const matched = keyword
      ? MOVIES.filter((movie) => {
          const haystack = normalise([
            movie.title,
            movie.year,
            movie.region,
            movie.type,
            movie.genre,
            movie.category,
            movie.oneLine,
            ...(movie.tags || [])
          ].join(" "));
          return haystack.includes(keyword);
        })
      : MOVIES.slice(0, 60);

    results.innerHTML = matched.slice(0, 240).map(movieCardTemplate).join("");
    if (count) {
      count.textContent = keyword ? `找到 ${matched.length} 条结果` : "推荐内容";
    }
  };

  render(initialQuery);
  input?.addEventListener("input", () => render(input.value));
}

function setupPlayers() {
  document.querySelectorAll(SELECTORS.playerStart).forEach((button) => {
    button.addEventListener("click", async () => {
      const shell = button.closest(".player-shell");
      const video = shell?.querySelector("video");
      const status = shell?.querySelector("[data-player-status]");
      const source = video?.dataset.m3u8;

      if (!video || !source) {
        return;
      }

      button.textContent = "加载中...";
      if (status) {
        status.textContent = "正在加载播放源";
      }

      try {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          window.location.href = source;
          return;
        }

        button.classList.add("is-hidden");
        await video.play();
        if (status) {
          status.textContent = "正在播放";
        }
      } catch (error) {
        button.classList.remove("is-hidden");
        button.textContent = "重试播放";
        if (status) {
          status.textContent = "播放加载失败，请重试或检查网络";
        }
        console.error(error);
      }
    });
  });
}

setupMobileMenu();
setupHero();
setupCardFilters();
setupTableFilter();
setupSearchPage();
setupPlayers();
