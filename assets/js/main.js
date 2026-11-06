/* ============================================================
   KOCHKA — interactions
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body   = document.body;

  if (reduce) document.documentElement.classList.add('no-pin');
  body.classList.add('is-loading');
  document.documentElement.classList.add('is-loading');

  /* ------------------------------------------------------------
     LOADER
  ------------------------------------------------------------ */
  const loader   = $('#loader');
  const loaderBar = $('#loaderBar');
  const loaderNum = $('#loaderNum');

  const setLoadProgress = (p) => {
    if (loaderBar) loaderBar.style.transform = `scaleX(${p})`;
    if (loaderNum) loaderNum.textContent = String(Math.round(p * 100)).padStart(2, '0');
  };

  const startTime = performance.now();
  const MIN_TIME = reduce ? 0 : 1500;

  const finishLoad = () => {
    // hero stagger delays first, then flip the class
    $$('#hero [data-hero]').forEach((el, i) => {
      el.style.transitionDelay = `${120 + i * 85}ms`;
    });
    body.classList.remove('is-loading');
    document.documentElement.classList.remove('is-loading');
    body.classList.add('is-loaded');
    if (loader) loader.setAttribute('aria-hidden', 'true');
    initReveal();
    requestAnimationFrame(() => {
      updateScroll();
      measureHorizontal();
    });
    setTimeout(() => $$('#hero [data-hero]').forEach(el => { el.style.transitionDelay = ''; }), 2600);
  };

  function loaderTick(now) {
    const t = clamp((now - startTime) / Math.max(MIN_TIME, 1));
    const eased = 1 - Math.pow(1 - t, 3);
    setLoadProgress(eased);
    if (t < 1) requestAnimationFrame(loaderTick);
    else {
      setLoadProgress(1);
      setTimeout(finishLoad, reduce ? 0 : 220);
    }
  }
  requestAnimationFrame(loaderTick);

  /* ------------------------------------------------------------
     REVEAL ON SCROLL
  ------------------------------------------------------------ */
  let revealObserver = null;

  function initReveal() {
    const items = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      $$('.section__head').forEach(el => el.classList.add('is-in'));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(el => revealObserver.observe(el));
    $$('.section__head').forEach(el => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------
     CUSTOM CURSOR
  ------------------------------------------------------------ */
  const cursorEl = $('.cursor');
  if (cursorEl && !fine) cursorEl.style.display = 'none';

  if (fine && !reduce) {
    body.classList.add('has-cursor');
    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add('is-on');
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }, { passive: true });

    const ringLoop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(ringLoop);
    };
    requestAnimationFrame(ringLoop);

    const hoverables = 'a, button, input, select, textarea, [data-cursor]';
    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(hoverables)) body.classList.add('cursor-hover');
    });
    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(hoverables)) body.classList.remove('cursor-hover');
    });
    document.addEventListener('pointerdown', () => ring.style.scale = '0.8');
    document.addEventListener('pointerup', () => ring.style.scale = '1');
  }

  /* ------------------------------------------------------------
     NAV / MENU
  ------------------------------------------------------------ */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  let lastY = window.scrollY;

  function updateNav(y) {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 24);
    if (body.classList.contains('menu-open')) {
      nav.classList.remove('is-hidden');
      return;
    }
    if (y > 480 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }

  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    // stagger links
    $$('#menu a').forEach((a, i) => {
      a.style.transitionDelay = open ? `${120 + i * 45}ms` : '0ms';
    });
  }

  burger && burger.addEventListener('click', () => toggleMenu());
  $$('#menu [data-menu-link]').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

  /* ------------------------------------------------------------
     SCROLL BAR
  ------------------------------------------------------------ */
  const scrollFill = $('#scrollFill');
  const stickyCta = $('#stickyCta');

  /* ------------------------------------------------------------
     PARALLAX ELEMENTS
  ------------------------------------------------------------ */
  const parallaxEls = reduce ? [] : $$('[data-parallax]');

  /* ------------------------------------------------------------
     MANIFESTO WORD HIGHLIGHT
  ------------------------------------------------------------ */
  const manifesto = $('#manifestoText');
  let manifestoWords = [];

  if (manifesto) {
    const text = manifesto.textContent.trim().replace(/\s+/g, ' ');
    manifesto.textContent = '';
    text.split(' ').forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      if (/^(рельеф|повторение)/i.test(word.replace(/[^\wа-яё]/gi, ''))) span.classList.add('hot');
      span.textContent = word;
      manifesto.appendChild(span);
      if (i < text.split(' ').length - 1) manifesto.appendChild(document.createTextNode(' '));
      manifestoWords.push(span);
    });
  }

  function updateManifesto() {
    if (!manifesto || reduce || !manifestoWords.length) return;
    const r = manifesto.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.55));
    const count = Math.round(p * manifestoWords.length * 1.12);
    manifestoWords.forEach((w, i) => w.classList.toggle('on', i < count));
  }

  /* ------------------------------------------------------------
     COUNTERS
  ------------------------------------------------------------ */
  function animateCount(el) {
    const target = Number(el.dataset.count || 0);
    const dur = reduce ? 1 : 1500;
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCount(e.target); countObs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(el => countObs.observe(el));
  } else {
    $$('[data-count]').forEach(animateCount);
  }

  /* ------------------------------------------------------------
     PROGRAMS PREVIEW (follows cursor)
  ------------------------------------------------------------ */
  const progList = $('#progList');
  const progPreview = $('#progPreview');

  if (progList && progPreview && fine && !reduce) {
    const previewImg = progPreview.querySelector('img');
    let px = 0, py = 0, tx = 0, ty = 0, previewActive = false;

    progList.addEventListener('pointerenter', () => { previewActive = true; });
    progList.addEventListener('pointerleave', () => {
      previewActive = false;
      progPreview.classList.remove('is-on');
    });

    progList.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!previewActive) { px = tx; py = ty; }
    });

    $$('.prog__row', progList).forEach(row => {
      row.addEventListener('pointerenter', () => {
        const src = row.dataset.img;
        if (src && previewImg.getAttribute('src') !== src) previewImg.src = src;
        progPreview.classList.add('is-on');
      });
    });

    const previewLoop = () => {
      px += (tx - px) * 0.14;
      py += (ty - py) * 0.14;
      progPreview.style.left = `${px}px`;
      progPreview.style.top = `${py}px`;
      requestAnimationFrame(previewLoop);
    };
    requestAnimationFrame(previewLoop);
  }

  /* ------------------------------------------------------------
     HORIZONTAL PIN — COACHES
  ------------------------------------------------------------ */
  const hSections = $$('[data-horizontal]');
  const coachFill = $('#coachFill');

  function measureHorizontal() {
    if (reduce) return;
    hSections.forEach(section => {
      const pin = section.querySelector('.coaches__pin') || section.firstElementChild;
      const track = section.querySelector('[id$="Track"], .coaches__track');
      if (!pin || !track) return;
      if (window.innerWidth <= 980) {
        section.style.height = '';
        track.style.transform = '';
        return;
      }
      const distance = Math.max(0, track.scrollWidth - pin.clientWidth);
      section.style.height = `${pin.offsetHeight + distance}px`;
      section.dataset.distance = String(distance);
    });
    updateScroll();
  }

  function updateHorizontal(y) {
    if (reduce || window.innerWidth <= 980) return;
    hSections.forEach(section => {
      const pin = section.querySelector('.coaches__pin') || section.firstElementChild;
      const track = section.querySelector('.coaches__track');
      if (!pin || !track) return;
      const distance = Number(section.dataset.distance || 0);
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - pin.offsetHeight;
      const progress = clamp(-rect.top / Math.max(total, 1));
      track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
      if (section.id === 'coaches' && coachFill) {
        coachFill.style.transform = `scaleX(${progress})`;
      }
    });
  }

  /* ------------------------------------------------------------
     SCHEDULE
  ------------------------------------------------------------ */
  const DAY_NAMES = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  const SCHEDULE = [
    [ // ПН
      { t: '07:30', n: 'Силовой тренинг', c: 'А. Волков', lvl: 2, free: 6 },
      { t: '10:00', n: 'Мобилити', c: 'Д. Ким', lvl: 1, free: 8 },
      { t: '18:30', n: 'Функционал', c: 'Д. Ким', lvl: 2, free: 2 },
      { t: '20:00', n: 'Бокс', c: 'М. Орлов', lvl: 2, free: 0 },
    ],
    [ // ВТ
      { t: '07:30', n: 'Функционал', c: 'Д. Ким', lvl: 2, free: 4 },
      { t: '12:00', n: 'Силовой тренинг', c: 'А. Волков', lvl: 1, free: 7 },
      { t: '19:00', n: 'Бокс', c: 'М. Орлов', lvl: 3, free: 1 },
      { t: '21:00', n: 'Мобилити', c: 'Д. Ким', lvl: 1, free: 9 },
    ],
    [ // СР
      { t: '08:00', n: 'Силовой тренинг', c: 'А. Волков', lvl: 2, free: 5 },
      { t: '11:00', n: 'Функционал', c: 'Д. Ким', lvl: 2, free: 6 },
      { t: '18:00', n: 'Бокс', c: 'М. Орлов', lvl: 2, free: 3 },
      { t: '20:30', n: 'Персональный', c: 'А. Волков', lvl: 3, free: 1 },
    ],
    [ // ЧТ
      { t: '07:00', n: 'Мобилити', c: 'Д. Ким', lvl: 1, free: 10 },
      { t: '12:30', n: 'Силовой тренинг', c: 'А. Волков', lvl: 2, free: 4 },
      { t: '19:00', n: 'Функционал', c: 'Д. Ким', lvl: 2, free: 2 },
      { t: '20:30', n: 'Бокс', c: 'М. Орлов', lvl: 3, free: 0 },
    ],
    [ // ПТ
      { t: '07:30', n: 'Силовой тренинг', c: 'А. Волков', lvl: 2, free: 6 },
      { t: '10:00', n: 'Функционал', c: 'Д. Ким', lvl: 2, free: 8 },
      { t: '18:30', n: 'Бокс', c: 'М. Орлов', lvl: 2, free: 3 },
      { t: '20:00', n: 'Мобилити', c: 'Д. Ким', lvl: 1, free: 7 },
    ],
    [ // СБ
      { t: '10:00', n: 'Силовой тренинг', c: 'А. Волков', lvl: 2, free: 5 },
      { t: '12:00', n: 'Функционал', c: 'Д. Ким', lvl: 3, free: 1 },
      { t: '14:00', n: 'Бокс', c: 'М. Орлов', lvl: 2, free: 4 },
      { t: '16:00', n: 'Мобилити', c: 'Д. Ким', lvl: 1, free: 9 },
    ],
    [ // ВС
      { t: '11:00', n: 'Мобилити', c: 'Д. Ким', lvl: 1, free: 8 },
      { t: '13:00', n: 'Бокс', c: 'М. Орлов', lvl: 2, free: 5 },
      { t: '15:00', n: 'Функционал', c: 'Д. Ким', lvl: 2, free: 3 },
      { t: '17:00', n: 'Силовой тренинг', c: 'А. Волков', lvl: 2, free: 6 },
    ],
  ];

  const daysEl = $('#days');
  const schedEl = $('#sched');
  const liveCount = $('#liveCount');
  const todayIndex = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();
  let activeDay = todayIndex;

  function mondayOfWeek() {
    const d = new Date();
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    return monday;
  }

  function levelDots(lvl) {
    return [1, 2, 3].map(i => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('');
  }

  function renderDays() {
    if (!daysEl) return;
    const monday = mondayOfWeek();
    daysEl.innerHTML = DAY_NAMES.map((name, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const num = String(date.getDate()).padStart(2, '0');
      const label = i === todayIndex ? 'Сегодня' : name;
      return `<button class="day${i === activeDay ? ' is-active' : ''}${i === todayIndex ? ' is-today' : ''}"
        role="tab" aria-selected="${i === activeDay}" data-day="${i}">
        ${label}<b>${num}</b>
      </button>`;
    }).join('');

    $$('.day', daysEl).forEach(btn => {
      btn.addEventListener('click', () => {
        activeDay = Number(btn.dataset.day);
        $$('.day', daysEl).forEach(b => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
        renderSchedule();
      });
    });
  }

  function renderSchedule() {
    if (!schedEl) return;
    const rows = SCHEDULE[activeDay] || [];
    schedEl.innerHTML = rows.map((r, i) => `
      <div class="sched__row" style="--i:${i}">
        <span class="sched__time">${r.t}</span>
        <span class="sched__name">${r.n}</span>
        <span class="sched__coach">${r.c}</span>
        <span class="sched__level" aria-label="Уровень ${r.lvl} из 3">${levelDots(r.lvl)}</span>
        <a href="#join" class="sched__cta${r.free === 0 ? ' is-full' : ''}">
          ${r.free === 0 ? 'Мест нет' : `Записаться · ${r.free}`}
        </a>
      </div>
    `).join('');

    const free = rows.reduce((sum, r) => sum + r.free, 0);
    if (liveCount) liveCount.textContent = String(free);
  }

  renderDays();
  renderSchedule();

  /* ------------------------------------------------------------
     PRICING TOGGLE
  ------------------------------------------------------------ */
  const toggle = $('.toggle');
  const priceSpans = $$('.plan__price span');

  function formatPrice(n) {
    return Number(n).toLocaleString('ru-RU');
  }

  $$('.toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      if (toggle.dataset.period === period) return;
      toggle.dataset.period = period;
      $$('.toggle__btn').forEach(b => b.classList.toggle('is-active', b === btn));

      priceSpans.forEach(span => {
        const wrap = span.parentElement;
        wrap.classList.add('is-swap');
        setTimeout(() => {
          const val = period === 'year' ? span.dataset.priceYear : span.dataset.priceMonth;
          span.textContent = formatPrice(val);
          wrap.classList.remove('is-swap');
        }, 190);
      });
    });
  });

  // initialise price labels
  priceSpans.forEach(span => {
    span.textContent = formatPrice(span.dataset.priceMonth);
  });

  /* ------------------------------------------------------------
     MAGNETIC BUTTONS
  ------------------------------------------------------------ */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach(el => {
      let raf = null;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${clamp(dx, -12, 12)}px, ${clamp(dy, -14, 14)}px)`;
        });
      });
      el.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------
     FORM
  ------------------------------------------------------------ */
  const form = $('#form');
  if (form) {
    const phone = form.querySelector('input[name="phone"]');
    const name = form.querySelector('input[name="name"]');

    phone && phone.addEventListener('input', () => {
      let v = phone.value.replace(/\D/g, '').slice(0, 11);
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v) { phone.value = ''; return; }
      if (v[0] !== '7') v = '7' + v;
      const p = v.slice(1);
      let out = '+7';
      if (p.length) out += ` (${p.slice(0, 3)}`;
      if (p.length >= 3) out += ')';
      if (p.length > 3) out += ` ${p.slice(3, 6)}`;
      if (p.length > 6) out += `-${p.slice(6, 8)}`;
      if (p.length > 8) out += `-${p.slice(8, 10)}`;
      phone.value = out;
      phone.classList.remove('is-error');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;

      if (!name.value.trim() || name.value.trim().length < 2) {
        name.classList.add('is-error'); ok = false;
      } else name.classList.remove('is-error');

      if (phone.value.replace(/\D/g, '').length < 11) {
        phone.classList.add('is-error'); ok = false;
      } else phone.classList.remove('is-error');

      if (!ok) {
        form.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
          { duration: 260, easing: 'ease-in-out' }
        );
        return;
      }
      form.classList.add('is-sent');
    });

    [name, phone].forEach(inp => inp && inp.addEventListener('input', () => inp.classList.remove('is-error')));
  }

  /* ------------------------------------------------------------
     SMOOTH ANCHORS
  ------------------------------------------------------------ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      try { history.replaceState(null, '', id); } catch (err) { /* file:// */ }
    });
  });

  /* ------------------------------------------------------------
     SCROLL ENGINE
  ------------------------------------------------------------ */
  let ticking = false;

  function updateScroll() {
    const y = window.scrollY;

    // top progress bar
    if (scrollFill) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollFill.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
    }

    updateNav(y);
    updateManifesto();
    updateHorizontal(y);

    // sticky mobile CTA
    if (stickyCta) {
      if (window.innerWidth <= 980) {
        const join = document.getElementById('join');
        const joinTop = join ? join.getBoundingClientRect().top : window.innerHeight * 2;
        const show = y > window.innerHeight * 0.7 && joinTop > window.innerHeight * 0.65;
        stickyCta.classList.toggle('is-on', show);
      } else {
        stickyCta.classList.remove('is-on');
      }
    }

    // parallax
    if (parallaxEls.length) {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = Number(el.dataset.parallax) || 0.1;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        const limit = el.offsetHeight * 0.09;
        const shift = clamp(-offset, -limit, limit);
        el.style.setProperty('--py', `${shift.toFixed(2)}px`);
      });
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScroll();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    measureHorizontal();
    onScroll();
  });

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => measureHorizontal());
    const track = $('#coachTrack');
    if (track) ro.observe(track);
  }

  window.addEventListener('load', () => {
    setTimeout(measureHorizontal, 120);
  });

  document.fonts && document.fonts.ready.then(() => {
    setTimeout(measureHorizontal, 60);
  });

  // prevent click-through on disabled schedule slots
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('.sched__cta');
    if (cta && cta.classList.contains('is-full')) e.preventDefault();
  });

  /* ------------------------------------------------------------
     TRAINER LIGHTBOX
  ------------------------------------------------------------ */
  const lb = $('#lightbox');
  const lbCards = $$('.coach').filter(c => c.querySelector('.coach__zoom'));
  if (lb && lbCards.length) {
    const lbImg = $('#lbImg');
    const lbName = $('#lbName');
    const lbMeta = $('#lbMeta');
    const lbCount = $('#lbCount');
    const lbClose = $('.lightbox__close');
    const lbBtns = $$('.lb-btn', lb);
    const total = lbCards.length;
    const pad2 = n => String(n).padStart(2, '0');
    let lbIndex = 0;
    let lbReturn = null;
    let lbScroll = 0;
    let lbTouchX = null;

    const isLbOpen = () => !lb.hidden;

    const preload = (i) => {
      const card = lbCards[(i + total) % total];
      const img = card && card.querySelector('img');
      if (img && img.getAttribute('src')) { const p = new Image(); p.src = img.getAttribute('src'); }
    };

    const renderLb = () => {
      const card = lbCards[lbIndex];
      const img = card.querySelector('img');
      const name = card.querySelector('h3');
      const tag = card.querySelector('.coach__tag');
      const role = card.querySelector('.coach__link');
      lbImg.src = img.getAttribute('src');
      lbImg.alt = (name ? name.textContent.trim() + ' — ' : '') + 'тренер клуба KOCHKA';
      lbName.textContent = name ? name.textContent.trim() : 'Тренер';
      lbMeta.textContent = [tag && tag.textContent.trim(), role && role.textContent.trim()].filter(Boolean).join(' · ');
      lbCount.textContent = pad2(lbIndex + 1) + ' / ' + pad2(total);
      preload(lbIndex + 1);
      preload(lbIndex - 1);
    };

    const openLb = (i, trigger) => {
      lbIndex = (i + total) % total;
      lbReturn = trigger || document.activeElement;
      lbScroll = window.scrollY;
      renderLb();
      lb.hidden = false;
      document.documentElement.classList.add('is-lb');
      body.classList.add('is-lb');
      requestAnimationFrame(() => lb.classList.add('is-open'));
      if (lbClose) lbClose.focus({ preventScroll: true });
    };

    const closeLb = () => {
      if (!isLbOpen()) return;
      lb.classList.remove('is-open');
      document.documentElement.classList.remove('is-lb');
      body.classList.remove('is-lb');
      const done = () => {
        lb.hidden = true;
        lbImg.removeAttribute('src');
        lbImg.alt = '';
      };
      if (reduce) done(); else setTimeout(done, 400);
      if (Math.abs(window.scrollY - lbScroll) > 1) window.scrollTo(0, lbScroll);
      if (lbReturn && lbReturn.focus) lbReturn.focus({ preventScroll: true });
    };

    const stepLb = (dir) => {
      lbIndex = (lbIndex + dir + total) % total;
      renderLb();
    };

    document.addEventListener('click', (e) => {
      const zoom = e.target.closest('.coach__zoom');
      if (zoom && !isLbOpen()) {
        e.preventDefault();
        openLb(lbCards.indexOf(zoom.closest('.coach')), zoom);
        return;
      }
      if (!isLbOpen()) return;
      if (e.target.closest('[data-lb-close]')) { e.preventDefault(); closeLb(); }
      else if (e.target.closest('[data-lb-prev]')) { e.preventDefault(); stepLb(-1); }
      else if (e.target.closest('[data-lb-next]')) { e.preventDefault(); stepLb(1); }
    });

    document.addEventListener('keydown', (e) => {
      if (!isLbOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLb(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepLb(1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepLb(-1); return; }
      if (e.key !== 'Tab') return;
      const f = [lbClose].concat(lbBtns).filter(Boolean);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    lb.addEventListener('touchstart', (e) => { lbTouchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (lbTouchX === null) return;
      const dx = e.changedTouches[0].clientX - lbTouchX;
      lbTouchX = null;
      if (Math.abs(dx) > 45) stepLb(dx < 0 ? 1 : -1);
    }, { passive: true });

    // keep the page from scrolling behind the dialog on touch devices
    lb.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
  }

  updateScroll();
})();
