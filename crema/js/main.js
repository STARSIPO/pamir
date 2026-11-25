/* crema. — интерактивность без зависимостей */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Шапка: фон после прокрутки ---------- */
  var header = document.querySelector('[data-header]');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var panel = document.querySelector('[data-mobile-menu]');
  var toggleLabel = toggle.querySelector('.menu-toggle-label');
  var desktopQuery = window.matchMedia('(min-width: 861px)');

  function setMenu(open, opts) {
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Закрыть' : 'Меню';
    panel.hidden = !open;
    header.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) {
      var first = panel.querySelector('a');
      if (first) first.focus();
    } else if (!opts || opts.restoreFocus !== false) {
      toggle.focus();
    }
  }
  function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

  toggle.addEventListener('click', function () { setMenu(!isOpen()); });

  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      setMenu(false);
      return;
    }
    // Удерживаем фокус внутри шапки, пока меню открыто
    if (e.key === 'Tab') {
      var focusables = [toggle].concat(Array.prototype.slice.call(panel.querySelectorAll('a')));
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });

  desktopQuery.addEventListener('change', function (e) {
    if (e.matches && isOpen()) setMenu(false, { restoreFocus: false });
  });

  /* ---------- Плавная прокрутка с учётом reduced-motion ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    // Переносим фокус к разделу для клавиатуры и скринридеров
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
  });

  /* ---------- Активный пункт навигации ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-list a'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
    // Над первым разделом ничего не подсвечиваем
    var heroObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    heroObserver.observe(document.getElementById('top'));
  }

  /* ---------- Меню: вкладки ---------- */
  var tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    var tablist = tabs.querySelector('[data-tablist]');
    var tabButtons = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabButtons.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    tablist.hidden = false;
    tabs.classList.add('is-enhanced');

    function select(index, focus) {
      tabButtons.forEach(function (btn, i) {
        var active = i === index;
        btn.setAttribute('aria-selected', String(active));
        btn.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
        panels[i].classList.toggle('is-entering', active && !reduceMotion.matches);
      });
      if (focus) tabButtons[index].focus();
    }

    tabButtons.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(i, false); });
      btn.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabButtons.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabButtons.length) % tabButtons.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabButtons.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    panels.forEach(function (p) {
      p.addEventListener('animationend', function () { p.classList.remove('is-entering'); });
    });

    select(0, false);
    panels[0].classList.remove('is-entering');
  }

  /* ---------- Открыто / закрыто (время Кишинёва) ---------- */
  var HOURS = { weekday: [8, 21], weekend: [9, 21] };

  function chisinauNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Chisinau', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (type) { return parts.filter(function (p) { return p.type === type; })[0].value; };
      return { day: get('weekday'), minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
    } catch (err) {
      return null;
    }
  }

  function status() {
    var now = chisinauNow();
    if (!now) return null;
    var weekend = now.day === 'Sat' || now.day === 'Sun';
    var range = weekend ? HOURS.weekend : HOURS.weekday;
    var open = now.minutes >= range[0] * 60 && now.minutes < range[1] * 60;
    if (open) return { open: true, short: 'Открыто до ' + range[1] + ':00', long: 'Сейчас открыто — ждём до ' + range[1] + ':00' };
    var beforeOpening = now.minutes < range[0] * 60;
    var nextOpen;
    if (beforeOpening) nextOpen = range[0] + ':00';
    else {
      var tomorrowWeekend = now.day === 'Fri' || now.day === 'Sat';
      nextOpen = 'завтра в ' + (tomorrowWeekend ? HOURS.weekend[0] : HOURS.weekday[0]) + ':00';
    }
    return { open: false, short: 'Откроемся ' + (beforeOpening ? 'в ' : '') + nextOpen, long: 'Сейчас закрыто · откроемся ' + (beforeOpening ? 'в ' : '') + nextOpen };
  }

  function renderStatus() {
    var s = status();
    if (!s) return;
    var shortEl = document.querySelector('[data-open-status]');
    var longEl = document.querySelector('[data-open-status-long]');
    if (shortEl) { shortEl.textContent = s.short; shortEl.classList.toggle('is-open', s.open); }
    if (longEl) { longEl.textContent = s.long; longEl.classList.toggle('is-open', s.open); }
  }
  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* ---------- Появление при прокрутке ---------- */
  var revealItems = document.querySelectorAll('.reveal, .hero-photo');
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(function (el) { io.observe(el); });
  }
})();
