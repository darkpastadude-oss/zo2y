/*
 * Zo2y Image Fallback Helper
 * --------------------------
 * Drop-in multi-step image fallback for <img> tags. Pages can declare:
 *
 *   data-fallback-chain='["https://...","https://..."]'   JSON array of URLs to try in order
 *   data-final-fallback="/images/fallback/book.svg"        last-resort URL (after the chain)
 *   data-final-action="hide"                                optional: hide img after final fallback fails
 *   data-final-action="replace-parent"                      optional: replace parent.innerHTML with data-final-html
 *   data-final-html="..."                                   HTML to inject when final fallback fails
 *
 * Books, music, etc. can build an OpenLibrary cover chain via
 *   Zo2yImgFallback.buildBookCoverChain({ isbn, coverId, olid })
 *
 * Attaches automatically on DOMContentLoaded and watches for new <img> nodes.
 */
(function () {
  'use strict';
  if (window.Zo2yImgFallback) return;

  function readChain(img) {
    var raw = img.getAttribute('data-fallback-chain') || '';
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(function (u) { return String(u || '').trim(); }).filter(Boolean);
      }
    } catch (_err) { /* fall through */ }
    return [];
  }

  function nextFromChain(img) {
    var chain = readChain(img);
    if (!chain.length) return null;
    var stepRaw = img.getAttribute('data-fallback-step') || '0';
    var step = Math.max(0, parseInt(stepRaw, 10) || 0);
    var currentSrc = String(img.src || '').trim();
    while (step < chain.length) {
      var candidate = chain[step];
      step += 1;
      if (!candidate || candidate === currentSrc) continue;
      img.setAttribute('data-fallback-step', String(step));
      return candidate;
    }
    img.setAttribute('data-fallback-step', String(chain.length));
    return null;
  }

  function applyFinalAction(img) {
    var action = String(img.getAttribute('data-final-action') || '').trim().toLowerCase();
    if (action === 'hide') {
      img.style.display = 'none';
      return;
    }
    if (action === 'replace-parent') {
      var html = img.getAttribute('data-final-html') || '';
      var parent = img.parentNode;
      if (parent && html) {
        parent.innerHTML = html;
      }
    }
  }

  function handleError(event) {
    var img = event && event.target;
    if (!img || img.tagName !== 'IMG') return;
    if (!img.hasAttribute('data-fallback-chain') && !img.hasAttribute('data-final-fallback')) return;
    if (img.getAttribute('data-fallback-done') === '1') {
      applyFinalAction(img);
      return;
    }

    var nextUrl = nextFromChain(img);
    if (nextUrl) {
      img.src = nextUrl;
      return;
    }
    var finalFallback = String(img.getAttribute('data-final-fallback') || '').trim();
    if (finalFallback && String(img.src || '').trim() !== finalFallback) {
      img.setAttribute('data-fallback-done', '1');
      img.src = finalFallback;
      return;
    }
    img.setAttribute('data-fallback-done', '1');
    applyFinalAction(img);
  }

  function attach(img) {
    if (!img || img.__zo2yImgFallbackAttached) return;
    img.__zo2yImgFallbackAttached = true;
    img.addEventListener('error', handleError);
    // If a broken image was rendered before this script attached, try the chain now.
    if (img.complete && img.naturalWidth === 0 && img.src) {
      handleError({ target: img });
    }
  }

  function attachAll(scope) {
    var root = scope || document;
    if (!root.querySelectorAll) return;
    var nodes = root.querySelectorAll('img[data-fallback-chain], img[data-final-fallback]');
    Array.prototype.forEach.call(nodes, attach);
  }

  function buildBookCoverChain(opts) {
    opts = opts || {};
    var chain = [];
    var rawIsbn = opts.isbn;
    var isbnList = Array.isArray(rawIsbn)
      ? rawIsbn
      : (rawIsbn ? [rawIsbn] : []);
    isbnList.forEach(function (entry) {
      var clean = String(entry || '').replace(/[^0-9Xx]/g, '');
      if (!clean) return;
      chain.push('https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(clean) + '-L.jpg');
      chain.push('https://covers.openlibrary.org/b/isbn/' + encodeURIComponent(clean) + '-M.jpg');
    });
    var coverIdList = Array.isArray(opts.coverId) ? opts.coverId : (opts.coverId ? [opts.coverId] : []);
    coverIdList.forEach(function (entry) {
      var id = parseInt(entry, 10);
      if (!Number.isFinite(id) || id <= 0) return;
      chain.push('https://covers.openlibrary.org/b/id/' + encodeURIComponent(String(id)) + '-L.jpg');
      chain.push('https://covers.openlibrary.org/b/id/' + encodeURIComponent(String(id)) + '-M.jpg');
    });
    var olidList = Array.isArray(opts.olid) ? opts.olid : (opts.olid ? [opts.olid] : []);
    olidList.forEach(function (entry) {
      var olid = String(entry || '').trim();
      if (!olid) return;
      chain.push('https://covers.openlibrary.org/b/olid/' + encodeURIComponent(olid) + '-L.jpg');
    });
    // Deduplicate.
    var seen = {};
    return chain.filter(function (url) {
      if (!url || seen[url]) return false;
      seen[url] = true;
      return true;
    });
  }

  function applyBookChain(img, opts) {
    if (!img) return;
    var chain = buildBookCoverChain(opts || {});
    var currentSrc = String(img.src || '').trim();
    chain = chain.filter(function (url) { return url !== currentSrc; });
    if (chain.length) {
      img.setAttribute('data-fallback-chain', JSON.stringify(chain));
    } else {
      img.removeAttribute('data-fallback-chain');
    }
    img.removeAttribute('data-fallback-step');
    img.removeAttribute('data-fallback-done');
    if (opts && opts.finalFallback) {
      img.setAttribute('data-final-fallback', String(opts.finalFallback));
    }
    if (opts && opts.finalAction) {
      img.setAttribute('data-final-action', String(opts.finalAction));
    }
    if (opts && opts.finalHtml) {
      img.setAttribute('data-final-html', String(opts.finalHtml));
    }
    attach(img);
  }

  // Document-level capture as a safety net in case attach() wasn't called.
  document.addEventListener('error', handleError, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { attachAll(); });
  } else {
    attachAll();
  }

  if (typeof MutationObserver === 'function') {
    try {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (!mutation || !mutation.addedNodes) return;
          mutation.addedNodes.forEach(function (node) {
            if (!node || node.nodeType !== 1) return;
            if (node.tagName === 'IMG') {
              attach(node);
            } else if (node.querySelectorAll) {
              attachAll(node);
            }
          });
        });
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch (_err) { /* ignore */ }
  }

  window.Zo2yImgFallback = {
    attach: attach,
    attachAll: attachAll,
    buildBookCoverChain: buildBookCoverChain,
    applyBookChain: applyBookChain
  };
})();
