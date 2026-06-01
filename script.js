const FORM_URL = 'https://forms.gle/AtihxJ5adbEdPJxe6';
document.querySelectorAll('.register-link, .float-register').forEach((el) => {
  if (el.tagName === 'A') el.href = FORM_URL;
});
const isMobile = window.matchMedia('(max-width: 767px)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setHeaderHeight() {
  const header = document.getElementById('top-logos');
  const menu = document.getElementById('mobile-menu');
  if (!header) return;
  let h = header.offsetHeight;
  if (menu?.classList.contains('open')) h += menu.offsetHeight;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
setHeaderHeight();
window.addEventListener('resize', setHeaderHeight, { passive: true });

const topLogos = document.getElementById('top-logos');
window.addEventListener('scroll', () => {
  topLogos?.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuOverlay = document.getElementById('menu-overlay');
function closeMenu() {
  mobileMenu?.classList.remove('open');
  menuOverlay?.classList.add('hidden');
  menuBtn?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setHeaderHeight();
}
function openMenu() {
  mobileMenu?.classList.add('open');
  menuOverlay?.classList.remove('hidden');
  menuBtn?.setAttribute('aria-expanded', 'true');
  mobileMenu?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setHeaderHeight();
}
menuBtn?.addEventListener('click', () => {
  mobileMenu?.classList.contains('open') ? closeMenu() : openMenu();
});
menuOverlay?.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-nav').forEach(a => a.addEventListener('click', closeMenu));

document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-btn')?.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

const useHeavyMotion = !prefersReducedMotion && !isMobile;

if (!prefersReducedMotion) {
  AOS.init({
    duration: isMobile ? 400 : 700,
    once: true,
    offset: isMobile ? 24 : 60,
    easing: 'ease-out-cubic',
    disable: isMobile ? 'phone' : false
  });
} else {
  AOS.init({ disable: true });
}

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && useHeavyMotion) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ force3D: true });

  const animOpts = { duration: isMobile ? 0.5 : 0.75, ease: 'power2.out' };

  gsap.from('.hero-content > *', {
    y: isMobile ? 20 : 32, opacity: 0, ...animOpts, stagger: isMobile ? 0.06 : 0.08, delay: 0.1
  });

  if (!isMobile) {
    gsap.from('.code-card', { opacity: 0, y: 16, duration: 0.8, stagger: 0.15, delay: 0.35 });
  }

  gsap.utils.toArray('.overview-stat-card').forEach((card, i) => {
    gsap.fromTo(card, { y: 16, opacity: 0 }, {
      scrollTrigger: { trigger: card, start: 'top 96%', once: true },
      y: 0, opacity: 1, duration: 0.45, delay: isMobile ? 0 : i * 0.03, ease: 'power2.out'
    });
  });

  gsap.utils.toArray('.highlight-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 94%', once: true },
      y: 20, opacity: 0, duration: 0.45, delay: i * 0.03, ease: 'power2.out'
    });
    if (!isMobile) {
      card.addEventListener('mouseenter', () => gsap.to(card, { y: -4, duration: 0.25 }));
      card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.25 }));
    }
  });

  gsap.utils.toArray('.timeline-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 92%', once: true },
      y: 24,
      x: isMobile ? 0 : (i % 2 === 0 ? -24 : 24),
      opacity: 0,
      duration: 0.55,
      ease: 'power2.out'
    });
  });

  if (!isMobile) {
    gsap.to('#timeline-progress', {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline-wrap',
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 0.5
      }
    });
  }

  gsap.utils.toArray('.tool-pop').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: '#tool-ecosystem', start: 'top 90%', once: true },
      scale: 0.85, opacity: 0, duration: 0.4, delay: i * 0.04, ease: 'power2.out'
    });
    if (!isMobile) {
      gsap.to(el, {
        y: -6,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.15
      });
    }
  });

  gsap.utils.toArray('.outcome-item').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 94%', once: true },
      y: 12, opacity: 0, duration: 0.4, delay: i * 0.02
    });
  });

  ScrollTrigger.config({ limitCallbacks: true });
}

window.addEventListener('load', setHeaderHeight);