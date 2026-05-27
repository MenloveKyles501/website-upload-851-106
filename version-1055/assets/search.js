
import { SITE_DATA } from './site-data.js';

function movieCard(movie) {
  const article = document.createElement('a');
  article.className = 'movie-card';
  article.href = `./${movie.url}`;
  const hue = (movie.year * 37) % 360;
  const hue2 = (hue + 38) % 360;
  article.innerHTML = `
    <div class="poster poster-md movie-card-poster" style="--hue:${hue};--hue2:${hue2};">
      <div class="poster-glow"></div>
      <div class="poster-bloom"></div>
      <div class="poster-number">${movie.id}</div>
      <div class="poster-title">${movie.title}</div>
      <div class="poster-meta">${movie.region} · ${movie.year}</div>
      <div class="poster-badges">
        <span class="poster-badge">${movie.bucketName}</span>
        <span class="poster-badge poster-badge-alt">${movie.type}</span>
      </div>
    </div>
    <div class="movie-card-body">
      <div class="movie-card-topline">
        <span class="chip chip-accent">${movie.bucketName}</span>
        <span class="chip">${movie.region}</span>
      </div>
      <h3 class="movie-card-title">${movie.title}</h3>
      <p class="movie-card-desc">${movie.oneLine}</p>
      <div class="movie-card-meta">
        <span>${movie.year}</span>
        <span>·</span>
        <span>${movie.type}</span>
        <span>·</span>
        <span>${movie.genre}</span>
      </div>
    </div>
  `;
  return article;
}

function uniqueValues(items, key) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN'));
}

function fillSelect(select, values) {
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function initSearchPage() {
  const input = document.querySelector('[data-search-input]');
  const regionSelect = document.querySelector('[data-filter-region]');
  const typeSelect = document.querySelector('[data-filter-type]');
  const bucketSelect = document.querySelector('[data-filter-bucket]');
  const results = document.querySelector('[data-search-results]');
  const status = document.querySelector('[data-search-status]');
  if (!input || !regionSelect || !typeSelect || !bucketSelect || !results || !status) return;

  fillSelect(regionSelect, uniqueValues(SITE_DATA.movies, 'region'));
  fillSelect(typeSelect, uniqueValues(SITE_DATA.movies, 'type'));
  fillSelect(bucketSelect, uniqueValues(SITE_DATA.movies, 'bucketName'));

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) input.value = q;

  let previousTip = null;

  function render() {
    if (previousTip) {
      previousTip.remove();
      previousTip = null;
    }
    const query = input.value.trim().toLowerCase();
    const region = regionSelect.value;
    const type = typeSelect.value;
    const bucket = bucketSelect.value;

    const filtered = SITE_DATA.movies.filter((movie) => {
      const hay = [
        movie.title,
        movie.region,
        movie.type,
        movie.genre,
        movie.bucketName,
        movie.oneLine,
        ...(movie.tags || []),
      ].join(' ').toLowerCase();

      return (!query || hay.includes(query))
        && (!region || movie.region === region)
        && (!type || movie.type === type)
        && (!bucket || movie.bucketName === bucket);
    });

    status.textContent = `已找到 ${filtered.length} 条结果。`;
    results.innerHTML = '';
    const fragment = document.createDocumentFragment();
    filtered.slice(0, 180).forEach((movie) => fragment.appendChild(movieCard(movie)));
    results.appendChild(fragment);

    if (filtered.length > 180) {
      previousTip = document.createElement('div');
      previousTip.className = 'search-status';
      previousTip.textContent = '仅显示前 180 条匹配结果，继续缩小条件可查看更多。';
      results.parentElement.insertBefore(previousTip, results.nextSibling);
    }
  }

  [input, regionSelect, typeSelect, bucketSelect].forEach((el) => el.addEventListener('input', render));
  render();
}

document.addEventListener('DOMContentLoaded', initSearchPage);
