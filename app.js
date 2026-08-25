/* Virginia Bill Watch: motion layer.
   Everything here is enhancement. The page reads fine with JS off. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header: transparent over the dark band, solid once you scroll ---- */
  var head = document.querySelector('.site-head');
  function onScroll() {
    if (!head) return;
    head.classList.toggle('is-stuck', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- build the vote walls from the real tallies ---- */
  document.querySelectorAll('.wall').forEach(function (wall) {
    var yea = parseInt(wall.dataset.yea || 0, 10);
    var nay = parseInt(wall.dataset.nay || 0, 10);
    var other = parseInt(wall.dataset.other || 0, 10);
    var frag = document.createDocumentFragment();
    var i = 0;
    function push(n, cls) {
      for (var k = 0; k < n; k++) {
        var el = document.createElement('i');
        el.className = cls;
        el.style.setProperty('--i', i++);
        frag.appendChild(el);
      }
    }
    push(yea, 'y');
    push(nay, 'n');
    push(other, 'o');
    wall.appendChild(frag);
  });

  /* ---- count up the headline figures ---- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    var start = performance.now();
    var dur = 950;
    var exact = target.toLocaleString('en-US') + suffix;
    /* a throttled tab can stall requestAnimationFrame. The number on screen is
       never allowed to stay wrong, so snap to the real figure regardless. */
    setTimeout(function () { el.textContent = exact; }, dur + 150);
    function frame(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = t < 1 ? Math.round(target * eased).toLocaleString('en-US') + suffix : exact;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---- one observer drives every reveal on the page ---- */
  var seen = new WeakSet();
  function activate(el) {
    if (seen.has(el)) return;
    seen.add(el);
    el.classList.add('is-in');
    if (el.dataset.count !== undefined) countUp(el);
    el.querySelectorAll('[data-count]').forEach(function (n) {
      if (!seen.has(n)) { seen.add(n); countUp(n); }
    });
  }

  var targets = document.querySelectorAll('[data-reveal], .wall, .bar, [data-count]');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(activate);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* the hero should be finished before you can scroll it */
  window.addEventListener('load', function () {
    document.querySelectorAll('.hero [data-reveal], .pagehead [data-reveal], .hero .wall').forEach(activate);
  });
  setTimeout(function () {
    document.querySelectorAll('.hero [data-reveal], .pagehead [data-reveal], .hero .wall').forEach(activate);
  }, 60);

  /* ---- countdown to the gavel, live to the second ---- */
  var tickWrap = document.querySelector('[data-gavel]');
  if (tickWrap) {
    var gavel = new Date(tickWrap.dataset.gavel).getTime();
    var cells = {
      d: tickWrap.querySelector('[data-t="d"]'),
      h: tickWrap.querySelector('[data-t="h"]'),
      m: tickWrap.querySelector('[data-t="m"]'),
      s: tickWrap.querySelector('[data-t="s"]')
    };
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var timer;
    var tick = function () {
      var left = gavel - Date.now();
      if (left <= 0) {
        var box = tickWrap.closest('.countdown');
        box && box.remove();
        timer && clearInterval(timer);
        return;
      }
      var secs = Math.floor(left / 1000);
      cells.d.textContent = Math.floor(secs / 86400).toLocaleString('en-US');
      cells.h.textContent = pad(Math.floor(secs / 3600) % 24);
      cells.m.textContent = pad(Math.floor(secs / 60) % 60);
      cells.s.textContent = pad(secs % 60);
    };
    tick();
    timer = setInterval(tick, 1000);
  }
})();
