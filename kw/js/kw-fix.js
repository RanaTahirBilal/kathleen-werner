/* Kathleen M. Werner — reveal safety net.

   The template hides every .wow element and waits for WOW.js to clear it.
   In testing the About photo never came back at desktop widths, and any
   section could blank out on a fast scroll. An IntersectionObserver is the
   reliable path, with a timed sweep behind it. If this file fails to load
   at all, kw-fix.css leaves everything visible, so a broken script costs an
   animation and never costs content. */
(function () {
  "use strict";

  var items = [].slice.call(document.querySelectorAll('.wow'));
  if (!items.length) { return; }

  function show(el) {
    if (el.classList.contains('kw-in')) { return; }
    el.style.visibility = 'visible';
    el.classList.add('kw-in');
  }
  function showAll() { items.forEach(show); }

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) { showAll(); return; }

  document.documentElement.classList.add('kw-anim');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' });

  items.forEach(function (el) { io.observe(el); });

  // Backstop for anything the observer skipped.
  function sweep() {
    var limit = window.innerHeight * 0.95;
    items.forEach(function (el) {
      if (el.classList.contains('kw-in')) { return; }
      if (el.getBoundingClientRect().top < limit) { show(el); io.unobserve(el); }
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; sweep(); });
    }
  }, { passive: true });
  window.addEventListener('resize', sweep, { passive: true });
  window.addEventListener('load', sweep);
  sweep();

  // Last resort. If something above went wrong, nothing stays hidden.
  window.setTimeout(showAll, 6000);

  /* Anchor links parked their section under the fixed header. The template
     binds .scroll to an animation that ignores header height. */
  var nav = document.querySelector('.navbar') || document.querySelector('header nav');
  if (window.jQuery) { window.jQuery('.scroll').off('click'); }

  [].slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (a) {
    var id = a.getAttribute('href');
    if (!id || id === '#') { return; }
    a.addEventListener('click', function (e) {
      var target = document.querySelector(id);
      if (!target) { return; }
      e.preventDefault();
      var close = document.getElementById('btn_sideNavClose');
      if (close && document.querySelector('.side-menu:not(.hidden)')) { close.click(); }
      var offset = (nav ? nav.getBoundingClientRect().height : 0) + 12;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y < 0 ? 0 : y, behavior: still ? 'auto' : 'smooth' });
      if (history.replaceState) { history.replaceState(null, '', id); }
    });
  });

  /* Native loading="lazy" was leaving photos unpainted in production: the file
     downloaded, the element stayed blank. Rather than trust the browser's own
     deferral, watch each lazy image and load it outright once it is close. */
  var lazies = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
  if (lazies.length) {
    var wake = function (img) {
      if (img.dataset.kwWoke) { return; }
      img.dataset.kwWoke = '1';
      img.removeAttribute('loading');
      var src = img.getAttribute('src');
      if (src && !img.complete) { img.src = src; }
    };
    if ('IntersectionObserver' in window) {
      var lio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { wake(e.target); lio.unobserve(e.target); }
        });
      }, { rootMargin: '600px 0px' });
      lazies.forEach(function (img) { lio.observe(img); });
    } else {
      lazies.forEach(wake);
    }
    // Anything still blank after the page settles gets loaded regardless.
    window.setTimeout(function () {
      lazies.forEach(function (img) { if (!img.complete || !img.naturalWidth) { wake(img); } });
    }, 4000);
  }
}());
