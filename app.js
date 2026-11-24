/* Addis Medical Center — shared behaviour for all pages */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* toast */
  function showToast(msg) {
    let t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 3400);
  }

  /* drawer */
  const drawer = $('#drawer'), burger = $('#burger');
  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const openDrawer = () => {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.inert = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const first = $('.drawer__nav a', drawer);
    if (first) first.focus({ preventScroll: true });
  };
  if (drawer && burger) {
    burger.addEventListener('click', () => (drawer.classList.contains('is-open') ? closeDrawer() : openDrawer()));
    $('#drawerClose').addEventListener('click', () => { closeDrawer(); burger.focus({ preventScroll: true }); });
    drawer.addEventListener('click', e => { if (e.target === drawer) closeDrawer(); });
    $$('.drawer__nav a', drawer).forEach(a => a.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) { closeDrawer(); burger.focus({ preventScroll: true }); }
    });
  }

  /* header, progress, back-top */
  const hdr = $('#hdr'), progress = $('#scrollProgress'), backTop = $('#backTop');
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`;
    if (hdr) hdr.classList.toggle('is-scrolled', scrollY > 8);
    if (backTop) backTop.classList.toggle('is-visible', scrollY > 600);
  }
  addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();
  if (backTop) backTop.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

  /* reveal on scroll */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }

  /* counters */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (!Number.isFinite(target)) return;
    const suffix = el.querySelector('span') ? el.querySelector('span').outerHTML : '';
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.innerHTML = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counters = $$('.stat__num[data-target]');
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver((entries, obs) => entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); }
    }), { threshold: 0.35 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(animateCounter);
  }

  /* active nav (file based) */
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href.endsWith('.html') && !/\?/.test(href)) return;
    const path = href.split('?')[0].split('#')[0].toLowerCase();
    if (path === current) a.setAttribute('aria-current', 'page');
  });

  /* equipment / cards filter */
  $$('.filter-row .chip[data-filter]').forEach(chip => chip.addEventListener('click', () => {
    $$('.filter-row .chip[data-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const f = chip.dataset.filter;
    const root = chip.closest('section') || document;
    $$('.filterable', root).forEach(card => { card.hidden = f !== 'all' && card.dataset.cat !== f; });
  }));

  /* demo forms: never submit data, show an honest confirmation */
  $$('form[data-demo-form]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const success = form.querySelector('.form-success');
    const summary = form.querySelector('.form-success .form-summary');
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim() || '—';
    if (summary) {
      summary.textContent = `Thank you, ${name}. This preview does not send data anywhere — no message, booking or subscription was created. Use the verified contact details on the Contact page for anything real.`;
    }
    if (success) { success.classList.add('show'); success.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    form.reset();
    showToast('Demo only — nothing was sent. See the note above.');
  }));

  /* newsletter shortcut */
  $$('form[data-newsletter]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    showToast('Demo only — no subscription was created.');
    f.reset();
  }));

  /* home hero tilt (only where the element exists) */
  const tilt = $('#heroTilt'), visual = $('#heroVisual');
  if (tilt && visual && matchMedia('(pointer: fine)').matches) {
    visual.addEventListener('mousemove', e => {
      const r = visual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    visual.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  /* year + image fallback */
  $$('#year').forEach(y => { y.textContent = new Date().getFullYear(); });
  $$('img').forEach(img => img.addEventListener('error', () => img.classList.add('img-fallback'), { once: true }));
})();
