(function () {
  function find(id) {
    return document.getElementById(id);
  }

  function initMoviePlayer(options) {
    var video = find(options.videoId);
    var play = find(options.playId);
    var smallPlay = find(options.smallPlayId);
    var mute = find(options.muteId);
    var fullscreen = find(options.fullscreenId);
    var errorBox = find(options.errorId);
    var hls = null;

    if (!video || !options.url) {
      return;
    }

    function showError(text) {
      if (errorBox) {
        errorBox.textContent = text;
        errorBox.hidden = false;
      }
    }

    function prepare() {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = options.url;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(options.url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }

          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
            return;
          }

          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
            return;
          }

          showError('播放加载失败，请稍后重试');
          hls.destroy();
        });
        return;
      }

      showError('播放加载失败，请稍后重试');
    }

    function updateButtons() {
      var paused = video.paused;
      if (play) {
        play.classList.toggle('is-hidden', !paused);
      }
      if (smallPlay) {
        smallPlay.textContent = paused ? '播放' : '暂停';
      }
      if (mute) {
        mute.textContent = video.muted ? '取消静音' : '静音';
      }
    }

    function start() {
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          if (play) {
            play.classList.remove('is-hidden');
          }
        });
      }
    }

    function togglePlay() {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    }

    prepare();

    video.addEventListener('click', togglePlay);
    video.addEventListener('play', updateButtons);
    video.addEventListener('pause', updateButtons);
    video.addEventListener('ended', updateButtons);

    if (play) {
      play.addEventListener('click', start);
    }

    if (smallPlay) {
      smallPlay.addEventListener('click', togglePlay);
    }

    if (mute) {
      mute.addEventListener('click', function () {
        video.muted = !video.muted;
        updateButtons();
      });
    }

    if (fullscreen) {
      fullscreen.addEventListener('click', function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (video.requestFullscreen) {
          video.requestFullscreen();
        }
      });
    }

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });

    updateButtons();
  }

  window.initMoviePlayer = initMoviePlayer;
}());
