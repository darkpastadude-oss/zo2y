(function () {
  if (window.__zo2yBooksEngine) return;

  var engine = {
    FALLBACK_BOOK_IMAGE: '/images/fallback/book.svg',
    computeGridPageSize: function () {
      var grid = document.getElementById('booksGrid');
      if (!grid) return 18;
      try {
        var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
        return cols * 3;
      } catch (_) { return 18; }
    }
  };

  window.__zo2yBooksEngine = engine;
})();
