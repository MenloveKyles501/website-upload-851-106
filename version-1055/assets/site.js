
import { Hls } from './hls-vendor-dru42stk.js';

function setupMenu() {
  const button = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-mobile-nav]');
  if (!button || !nav) return;
  button.addEventListener('click', () => {
    const hidden = nav.hasAttribute('hidden');
    if (hidden) {
      nav.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
    } else {
      nav.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
    }
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupHeroCarousel() {
  const root = document.querySelector('[data-hero-carousel]');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(root.querySelectorAll('[data-hero-dot]'));
  const prev = root.querySelector('[data-hero-prev]');
  const next = root.querySelector('[data-hero-next]');
  if (!slides.length) return;
  let index = 0;
  let timer = null;
  const show = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, s) => slide.classList.toggle('is-active', s === index));
    dots.forEach((dot, s) => dot.classList.toggle('is-active', s === index));
  };
  const start = () => {
    stop();
    timer = window.setInterval(() => show(index + 1), 5000);
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  prev && prev.addEventListener('click', () => { show(index - 1); start(); });
  next && next.addEventListener('click', () => { show(index + 1); start(); });
  dots.forEach((dot) => dot.addEventListener('click', () => {
    const i = Number(dot.getAttribute('data-hero-dot') || '0');
    show(i);
    start();
  }));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  show(0);
  start();
}

function setupPlayers() {
  document.querySelectorAll('[data-player]').forEach((player) => {
    const video = player.querySelector('.player-video');
    const overlay = player.querySelector('[data-play-button]');
    const status = player.querySelector('[data-player-status]');
    if (!video || !overlay) return;

    const src = video.getAttribute('data-hls-src') || '';
    let hls = null;
    let ready = false;
    let hasError = false;

    const setStatus = (text) => { if (status) status.textContent = text; };

    const load = () => {
      if (ready || hasError) return;
      setStatus('正在加载播放器…');
      if (Hls && Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          ready = true;
          setStatus('播放器已就绪');
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data && data.fatal) {
            hasError = true;
            setStatus('加载失败，请刷新后重试');
            overlay.style.display = 'flex';
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          ready = true;
          setStatus('播放器已就绪');
        }, { once: true });
      } else {
        hasError = true;
        setStatus('当前浏览器不支持 HLS 播放');
      }
    };

    const play = async () => {
      load();
      try {
        await video.play();
        overlay.style.display = 'none';
        setStatus('播放中');
      } catch (err) {
        overlay.style.display = 'flex';
        setStatus('点击播放');
      }
    };

    const pause = () => {
      overlay.style.display = 'flex';
      setStatus('已暂停');
    };

    overlay.addEventListener('click', play);
    video.addEventListener('click', () => {
      if (video.paused) play();
      else video.pause();
    });
    video.addEventListener('play', () => {
      overlay.style.display = 'none';
      setStatus('播放中');
    });
    video.addEventListener('pause', pause);

    load();
  });
}

function setupBackToTop() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.textContent = '↑';
  btn.style.cssText = `
    position: fixed;
    right: 18px;
    bottom: 18px;
    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: 0;
    background: linear-gradient(135deg, #f59e0b, #ea580c);
    color: #fff;
    font-size: 20px;
    font-weight: 900;
    box-shadow: 0 18px 28px rgba(17, 24, 39, .18);
    display: none;
    z-index: 80;
    cursor: pointer;
  `;
  btn.setAttribute('aria-label', '返回顶部');
  document.body.appendChild(btn);
  const toggle = () => {
    btn.style.display = window.scrollY > 500 ? 'grid' : 'none';
    btn.style.placeItems = 'center';
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

document.addEventListener('DOMContentLoaded', () => {
  setupMenu();
  setupHeroCarousel();
  setupPlayers();
  setupBackToTop();
});
