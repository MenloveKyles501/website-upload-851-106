(function () {
  var player = document.querySelector('[data-player]');

  if (!player) {
    return;
  }

  var video = player.querySelector('video');
  var startButton = player.querySelector('[data-player-start]');
  var status = player.querySelector('[data-player-status]');

  if (!video) {
    return;
  }

  var source = video.getAttribute('data-video') || '';
  var hls = null;

  function showStatus(message) {
    if (status) {
      status.textContent = message || '';
    }
  }

  function hideButton() {
    if (startButton) {
      startButton.classList.add('is-hidden');
    }
  }

  function showButton() {
    if (startButton) {
      startButton.classList.remove('is-hidden');
    }
  }

  function bindSource() {
    if (!source) {
      showStatus('暂未获取到播放源');
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        showStatus('');
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          showStatus('视频加载失败，请刷新页面重试');
          showButton();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', function () {
        showStatus('');
      });
    } else {
      showStatus('当前浏览器暂不支持播放');
    }
  }

  function playVideo() {
    var promise = video.play();

    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        showStatus('请再次点击播放');
        showButton();
      });
    }
  }

  function toggleVideo() {
    if (video.paused) {
      playVideo();
    } else {
      video.pause();
    }
  }

  if (startButton) {
    startButton.addEventListener('click', function () {
      toggleVideo();
    });
  }

  video.addEventListener('click', function (event) {
    var safeArea = video.clientHeight - 56;

    if (event.offsetY < safeArea) {
      toggleVideo();
    }
  });

  video.addEventListener('play', function () {
    hideButton();
    showStatus('');
  });

  video.addEventListener('pause', function () {
    showButton();
  });

  video.addEventListener('ended', function () {
    showButton();
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });

  bindSource();
})();
