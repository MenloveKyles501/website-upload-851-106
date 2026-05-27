(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function bindMobileMenu() {
        var button = $('[data-menu-button]');
        var menu = $('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('open');
            button.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
        });
    }

    function bindHero() {
        var hero = $('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = $all('[data-hero-slide]', hero);
        var dots = $all('[data-hero-dot]', hero);
        var prev = $('[data-hero-prev]', hero);
        var next = $('[data-hero-next]', hero);
        if (!slides.length) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                start();
            });
        });
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function normalizeText(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, '');
    }

    function bindSearch() {
        var inputs = $all('[data-site-search]');
        if (!inputs.length) {
            return;
        }
        var cards = $all('[data-card]');
        var empty = $('[data-empty]');

        function run(value) {
            var keyword = normalizeText(value);
            var count = 0;
            cards.forEach(function (card) {
                var haystack = normalizeText(card.getAttribute('data-title') + card.getAttribute('data-meta') + card.textContent);
                var matched = !keyword || haystack.indexOf(keyword) !== -1;
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    count += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('show', count === 0);
            }
        }

        inputs.forEach(function (input) {
            input.addEventListener('input', function () {
                run(input.value);
            });
            var form = input.closest('form');
            if (form) {
                form.addEventListener('submit', function (event) {
                    if (form.getAttribute('data-search-mode') === 'global') {
                        return;
                    }
                    event.preventDefault();
                    run(input.value);
                });
            }
        });

        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q) {
            inputs.forEach(function (input) {
                input.value = q;
            });
            run(q);
        }
    }

    function bindHorizontal() {
        $all('[data-scroll-box]').forEach(function (box) {
            var targetId = box.getAttribute('data-scroll-box');
            var list = document.getElementById(targetId);
            if (!list) {
                return;
            }
            var left = $('[data-scroll-left="' + targetId + '"]');
            var right = $('[data-scroll-right="' + targetId + '"]');
            if (left) {
                left.addEventListener('click', function () {
                    list.scrollBy({ left: -420, behavior: 'smooth' });
                });
            }
            if (right) {
                right.addEventListener('click', function () {
                    list.scrollBy({ left: 420, behavior: 'smooth' });
                });
            }
        });
    }

    function bindPlayer() {
        var frame = $('[data-player-frame]');
        if (!frame) {
            return;
        }
        var video = $('video', frame);
        var button = $('[data-play-button]', frame);
        var overlay = $('[data-player-overlay]', frame);
        var status = $('[data-player-status]', frame);
        if (!video || !button) {
            return;
        }
        var url = video.getAttribute('data-stream') || '';
        var hls = null;
        var ready = false;

        function setStatus(message) {
            if (status) {
                status.textContent = message || '';
            }
        }

        function hideOverlay() {
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }

        function attach() {
            if (ready || !url) {
                return Promise.resolve();
            }
            ready = true;
            video.setAttribute('controls', 'controls');
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ lowLatencyMode: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                return new Promise(function (resolve) {
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        resolve();
                    });
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setStatus('视频加载失败，请稍后重试');
                        }
                    });
                    window.setTimeout(resolve, 900);
                });
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                return Promise.resolve();
            }
            setStatus('视频暂时无法在此设备播放');
            return Promise.resolve();
        }

        function play() {
            attach().then(function () {
                hideOverlay();
                var started = video.play();
                if (started && typeof started.catch === 'function') {
                    started.catch(function () {
                        setStatus('点击视频区域继续播放');
                    });
                }
            });
        }

        button.addEventListener('click', play);
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            } else {
                video.pause();
            }
        });
        video.addEventListener('play', hideOverlay);
        window.addEventListener('beforeunload', function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindMobileMenu();
        bindHero();
        bindSearch();
        bindHorizontal();
        bindPlayer();
    });
}());
