document.addEventListener('DOMContentLoaded', function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var input = document.querySelector('[data-filter-input]');
  var yearSelect = document.querySelector('[data-year-filter]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function applyFilter() {
    if (!cards.length) {
      return;
    }

    var term = normalize(input ? input.value : '');
    var year = normalize(yearSelect ? yearSelect.value : '');

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute('data-search'));
      var cardYear = normalize(card.getAttribute('data-year'));
      var matchedTerm = !term || haystack.indexOf(term) !== -1;
      var matchedYear = !year || cardYear === year;

      if (matchedTerm && matchedYear) {
        card.classList.remove('is-filter-hidden');
      } else {
        card.classList.add('is-filter-hidden');
      }
    });
  }

  if (input) {
    input.addEventListener('input', applyFilter);
  }

  if (yearSelect) {
    yearSelect.addEventListener('change', applyFilter);
  }
});
