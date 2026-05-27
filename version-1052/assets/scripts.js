(function () {
  var toggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
    });
  }
})();

(function () {
  var hero = document.querySelector("[data-hero]");
  if (!hero) {
    return;
  }

  var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
  var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
  var prev = hero.querySelector("[data-hero-prev]");
  var next = hero.querySelector("[data-hero-next]");
  var index = 0;
  var timer = null;

  function show(nextIndex) {
    if (!slides.length) {
      return;
    }

    index = (nextIndex + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === index);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === index);
    });
  }

  function restart() {
    if (timer) {
      window.clearInterval(timer);
    }

    timer = window.setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  if (prev) {
    prev.addEventListener("click", function () {
      show(index - 1);
      restart();
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      show(index + 1);
      restart();
    });
  }

  dots.forEach(function (dot, dotIndex) {
    dot.addEventListener("click", function () {
      show(dotIndex);
      restart();
    });
  });

  show(0);
  restart();
})();

(function () {
  var input = document.querySelector("[data-search-input]");
  var region = document.querySelector("[data-filter-region]");
  var type = document.querySelector("[data-filter-type]");
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-search-card]"));
  var empty = document.querySelector("[data-empty-state]");

  if (!input || !cards.length) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var query = params.get("q");

  if (query) {
    input.value = query;
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function filterCards() {
    var keyword = normalize(input.value);
    var regionValue = region ? normalize(region.value) : "";
    var typeValue = type ? normalize(type.value) : "";
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute("data-search"));
      var cardRegion = normalize(card.getAttribute("data-region"));
      var cardType = normalize(card.getAttribute("data-type"));
      var matched = true;

      if (keyword && haystack.indexOf(keyword) === -1) {
        matched = false;
      }

      if (regionValue && cardRegion.indexOf(regionValue) === -1) {
        matched = false;
      }

      if (typeValue && cardType.indexOf(typeValue) === -1) {
        matched = false;
      }

      card.style.display = matched ? "" : "none";

      if (matched) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle("is-visible", visible === 0);
    }
  }

  input.addEventListener("input", filterCards);

  if (region) {
    region.addEventListener("change", filterCards);
  }

  if (type) {
    type.addEventListener("change", filterCards);
  }

  filterCards();
})();
