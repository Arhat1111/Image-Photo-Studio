const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileLinks = mobileMenu.querySelectorAll('a');
const cursor = document.querySelector('.cursor-dot');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

function setMenu(open) {
  menuBtn.classList.toggle('active', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('menu-open', open);
}
menuBtn.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
mobileLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));

// Reveal-on-scroll animation
const reveals = document.querySelectorAll('.reveal');
reveals.forEach(el => {
  const delay = el.dataset.delay;
  if (delay) el.style.setProperty('--delay', `${delay}ms`);
});
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
reveals.forEach(el => observer.observe(el));

// Soft parallax on large visual panels.
const parallaxBlocks = [...document.querySelectorAll('.parallax-media')];
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let heroPointerX = 0;
let heroPointerY = 0;
function parallax() {
  if (prefersReduced) return;
  const vh = window.innerHeight;
  parallaxBlocks.forEach(block => {
    const rect = block.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;
    const center = rect.top + rect.height / 2;
    const delta = (center - vh / 2) / vh;
    const img = block.querySelector('img');
    if (img) {
      const isHero = block.classList.contains('hero-photo');
      const x = isHero ? heroPointerX : 0;
      const yExtra = isHero ? heroPointerY : 0;
      img.style.transform = `translate3d(${x.toFixed(2)}px, ${(-5 - delta * 7 + yExtra).toFixed(2)}%, 0) scale(1.035)`;
    }
  });
}
window.addEventListener('scroll', parallax, { passive: true });
window.addEventListener('resize', parallax);
parallax();

// Custom cursor on pointer devices.
if (window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('mousemove', e => {
    cursor.style.opacity = '1';
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });
  document.querySelectorAll('a, button, input, select, textarea, .gallery-card').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width = '28px'; cursor.style.height = '28px'; });
    el.addEventListener('mouseleave', () => { cursor.style.width = '10px'; cursor.style.height = '10px'; });
  });
}

// WhatsApp enquiry builder. No form data is stored.
const inquiryForm = document.getElementById('inquiryForm');
inquiryForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const shootType = document.getElementById('shootType').value;
  const shootDate = document.getElementById('shootDate').value;
  const message = document.getElementById('message').value.trim();

  const parts = [
    `Hi Image Photo Studio, I'm ${name}.`,
    `I'd like to enquire about: ${shootType}.`,
    shootDate ? `Preferred date: ${shootDate}.` : '',
    message ? `Details: ${message}` : '',
    'Please share availability and package details.'
  ].filter(Boolean);

  const url = `https://wa.me/919898551450?text=${encodeURIComponent(parts.join('\n'))}`;
  window.open(url, '_blank', 'noopener');
});

document.getElementById('year').textContent = new Date().getFullYear();

// Scroll progress indicator.
const progressBar = document.querySelector('.scroll-progress span');
function updateScrollProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progressBar.style.transform = `scaleX(${progress})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();

// Refined hero pointer drift. It is deliberately subtle and disabled on touch/reduced-motion devices.
if (!prefersReduced && window.matchMedia('(pointer:fine)').matches) {
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual) {
    let rafId = 0;
    const queueParallax = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(parallax);
    };
    heroVisual.addEventListener('pointermove', event => {
      const rect = heroVisual.getBoundingClientRect();
      heroPointerX = ((event.clientX - rect.left) / rect.width - .5) * 10;
      heroPointerY = ((event.clientY - rect.top) / rect.height - .5) * 6;
      queueParallax();
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroPointerX = 0;
      heroPointerY = 0;
      queueParallax();
    });
  }
}

// Magnetic buttons: a small pointer-follow effect that settles back immediately.
if (!prefersReduced && window.matchMedia('(pointer:fine)').matches) {
  document.querySelectorAll('.btn, .header-cta').forEach(button => {
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) * .10;
      const y = (event.clientY - (rect.top + rect.height / 2)) * .14;
      button.style.setProperty('--mx', `${x.toFixed(1)}px`);
      button.style.setProperty('--my', `${y.toFixed(1)}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mx', '0px');
      button.style.setProperty('--my', '0px');
    });
  });
}
