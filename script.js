(() => {
  'use strict';

  const qs = (s, root=document) => root.querySelector(s);
  const qsa = (s, root=document) => [...root.querySelectorAll(s)];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header / page-safe scroll progress
  const header = qs('.site-header');
  const progressBar = qs('.scroll-progress span');
  const isOverlayHeader = header?.dataset.variant === 'overlay';

  function setHeaderState(){
    if (header && isOverlayHeader) header.classList.toggle('scrolled', window.scrollY > 40);
    if (progressBar){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
  }
  window.addEventListener('scroll', setHeaderState, {passive:true});
  window.addEventListener('resize', setHeaderState);
  setHeaderState();

  // Mobile nav
  const menuBtn = qs('.menu-toggle');
  const mobileMenu = qs('.mobile-menu');
  const mobileServicesToggle = qs('.mobile-services-toggle');
  const mobileServices = qs('.mobile-services');

  function setMenu(open){
    if (!menuBtn || !mobileMenu) return;
    menuBtn.classList.toggle('active', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileMenu.classList.toggle('open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }
  menuBtn?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  qsa('a', mobileMenu || document.createElement('div')).forEach(a => a.addEventListener('click', () => setMenu(false)));
  mobileServicesToggle?.addEventListener('click', () => {
    if (!mobileServices) return;
    const open = !mobileServices.classList.contains('open');
    mobileServices.classList.toggle('open', open);
    mobileServicesToggle.classList.toggle('active', open);
    mobileServicesToggle.setAttribute('aria-expanded', String(open));
  });

  // Desktop services dropdown
  const dropdown = qs('.nav-dropdown');
  const dropdownToggle = qs('.nav-dropdown-toggle');
  dropdownToggle?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropdown) return;
    const open = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', open);
    dropdownToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (dropdown && !dropdown.contains(e.target)){
      dropdown.classList.remove('open');
      dropdownToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Reveal animations — never leave content invisible if observer is unavailable.
  const revealEls = qsa('.reveal');
  revealEls.forEach(el => {
    if (el.dataset.delay) el.style.setProperty('--delay', `${el.dataset.delay}ms`);
  });
  if ('IntersectionObserver' in window && !prefersReduced){
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:.08, rootMargin:'0px 0px -4%'});
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  // Hero slider — only runs on homepage.
  const heroSlider = qs('.hero-slider');
  if (heroSlider){
    const slides = qsa('.hero-slide', heroSlider);
    const dotsWrap = qs('.hero-dots', heroSlider);
    const progress = qs('.hero-progress span', heroSlider);
    const prev = qs('.hero-arrow.prev', heroSlider);
    const next = qs('.hero-arrow.next', heroSlider);
    const DURATION = 5200;
    let index = 0;
    let timer = null;
    const dots = [];

    if (dotsWrap){
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `hero-dot${i === 0 ? ' is-active' : ''}`;
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show slide ${i + 1}`);
        dot.addEventListener('click', () => go(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    if (!qs('#heroFillKeyframes')){
      const style = document.createElement('style');
      style.id = 'heroFillKeyframes';
      style.textContent = '@keyframes heroFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}';
      document.head.appendChild(style);
    }

    function restartProgress(){
      if (!progress) return;
      progress.style.animation = 'none';
      void progress.offsetHeight;
      if (!prefersReduced) progress.style.animation = `heroFill ${DURATION}ms linear forwards`;
    }
    function go(nextIndex){
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      restartProgress();
      clearTimeout(timer);
      if (!prefersReduced) timer = setTimeout(() => go(index + 1), DURATION);
    }
    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));
    let touchX = null;
    heroSlider.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive:true});
    heroSlider.addEventListener('touchend', e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      touchX = null;
    }, {passive:true});
    document.addEventListener('visibilitychange', () => {
      clearTimeout(timer);
      if (!document.hidden && !prefersReduced) timer = setTimeout(() => go(index + 1), DURATION);
    });
    go(0);
  }

  // Collage slider — homepage only.
  const collageTrack = qs('.collage-track');
  if (collageTrack){
    const slides = qsa('.collage-slide');
    const count = qs('.collage-count');
    const prev = qs('.collage-arrow.prev');
    const next = qs('.collage-arrow.next');
    const viewport = qs('.collage-viewport');
    let index = 0;
    function go(nextIndex){
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      collageTrack.style.transform = `translate3d(-${index * 100}%,0,0)`;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      if (count) count.textContent = `${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    }
    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));
    let touchX = null;
    viewport?.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, {passive:true});
    viewport?.addEventListener('touchend', e => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      touchX = null;
    }, {passive:true});
    go(0);
  }

  // Portfolio filters.
  const filterBtns = qsa('.filter-btn');
  const portfolioItems = qsa('.portfolio-item');
  if (filterBtns.length && portfolioItems.length){
    filterBtns.forEach(btn => btn.addEventListener('click', () => {
      const filter = btn.dataset.filter || 'all';
      filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
      portfolioItems.forEach(item => {
        const cats = (item.dataset.category || '').split(' ');
        item.classList.toggle('is-hidden', filter !== 'all' && !cats.includes(filter));
      });
    }));
  }

  // Contact form opens WhatsApp with the entered details.
  const form = qs('#quickContactForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name') || '';
    const service = fd.get('service') || '';
    const date = fd.get('date') || '';
    const note = fd.get('message') || '';
    const msg = `Hi Image Photo Studio, I’d like to enquire about a shoot.\n\nName: ${name}\nService: ${service}\nDate / occasion: ${date}\nMessage: ${note}`;
    window.open(`https://wa.me/919898551450?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  // Broken image fallback avoids empty-looking cards.
  qsa('img').forEach(img => img.addEventListener('error', () => {
    img.closest('figure, .category-card, .portfolio-item, .page-hero-media, .review-photo-main, .review-photo-small, .contact-page-media')?.classList.add('image-error');
  }, {once:true}));
})();
