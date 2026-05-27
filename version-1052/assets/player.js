(function () {
  window.initMoviePlayer = function (streamUrl) {
    var video = document.getElementById("movie-player");
    var layer = document.getElementById("play-layer");
    var started = false;
    var hlsInstance = null;

    if (!video) {
      return;
    }

    function safePlay() {
      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    function begin() {
      if (!streamUrl) {
        return;
      }

      if (layer) {
        layer.classList.add("is-hidden");
      }

      video.controls = true;

      if (!started) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, safePlay);
        } else {
          video.src = streamUrl;
        }

        started = true;
      }

      safePlay();
    }

    if (layer) {
      layer.addEventListener("click", begin);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        begin();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    });
  };
})();
