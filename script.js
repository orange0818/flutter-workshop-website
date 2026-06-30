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

// Register service worker for certificate security
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', { scope: '/' }).catch(err => {
    console.warn('Service worker registration failed:', err);
  });
}

async function initCertificatePage() {
  try {
    const nameInput = document.getElementById('student-name-input');
    const suggestions = document.getElementById('student-name-suggestions');
    const downloadButton = document.getElementById('download-certificate-btn');
    const nameWarning = document.getElementById('student-name-warning');
    const verifyButton = document.getElementById('verify-certificate-btn');
    const previewContainer = document.getElementById('certificate-preview-container');
    const previewImage = document.getElementById('certificate-preview-image');
    const previewLabel = document.getElementById('certificate-preview-label');
    const previewClose = document.getElementById('certificate-preview-close');

    if (!nameInput || !suggestions || !downloadButton || !verifyButton) return;

    let selectedStudent = null;
    let previewObjectUrl = null;

    const normalizeText = (value) => String(value || '').trim();

    const apiFetch = async (apiPath, params = {}) => {
      const apiUrl = new URL(apiPath, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          apiUrl.searchParams.set(key, value);
        }
      });

      const res = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'same-origin',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${res.statusText}`);
      }

      return res;
    };

    const revokePreviewUrl = () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
      }
    };

    const setPreviewImageFromBlob = (blob, altText) => {
      revokePreviewUrl();
      previewObjectUrl = URL.createObjectURL(blob);
      previewImage.src = previewObjectUrl;
      previewImage.alt = altText;
      previewImage.draggable = false;
      previewContainer.classList.remove('hidden');
    };

    const fetchPreview = async ({ name }) => {
      const res = await apiFetch('/api/certificate-preview', { name });
      return res.blob();
    };

    const fetchDownload = async ({ name }) => {
      const res = await apiFetch('/api/verify-certificate', { name });
      return res.blob();
    };

    const lookupByCode = async (code) => {
      const res = await apiFetch('/api/certificate-lookup', { code });
      return res.json();
    };

    const lookupStatusByName = async (name) => {
      const res = await apiFetch('/api/certificate-status', { name });
      return res.json();
    };

    const searchNames = async (query) => {
      const res = await apiFetch('/api/certificate-names', { q: query });
      const data = await res.json();
      return Array.isArray(data.names) ? data.names : [];
    };

    const renderSuggestions = async (query) => {
      suggestions.innerHTML = '';
      const normalized = normalizeText(query).toLowerCase();
      if (normalized.length < 2) {
        suggestions.classList.remove('open');
        return;
      }

      let matched = [];
      try {
        matched = await searchNames(query);
      } catch (error) {
        nameWarning.textContent = 'Could not load name suggestions.';
        suggestions.classList.remove('open');
        return;
      }

      if (!matched.length) {
        suggestions.classList.remove('open');
        return;
      }

      matched.forEach((name) => {
        const li = document.createElement('li');
        li.textContent = name;
        li.className = 'suggestion-item';
        li.dataset.name = name;
        suggestions.appendChild(li);
      });
      suggestions.classList.add('open');
    };

    const clearSelection = () => {
      selectedStudent = null;
      revokePreviewUrl();
      previewImage.src = '';
      previewContainer.classList.add('hidden');
    };

    previewImage.addEventListener('contextmenu', (e) => e.preventDefault());

    const renderPreview = async ({ name, label }) => {
      if (!name) return;

      previewLabel.textContent = label || name;
      nameWarning.textContent = '';

      try {
        const blob = await fetchPreview({ name });
        setPreviewImageFromBlob(blob, `${name} certificate preview`);
      } catch (error) {
        console.error('Failed to load certificate preview:', error);
        nameWarning.textContent = 'Could not load certificate preview: ' + error.message;
      }
    };

    nameInput.addEventListener('input', (event) => {
      clearSelection();
      renderSuggestions(event.target.value);
      nameWarning.textContent = '';
    });

    nameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        suggestions.classList.remove('open');
        triggerLookup();
      }
    });

    suggestions.addEventListener('click', async (event) => {
      const target = event.target.closest('.suggestion-item');
      if (!target) return;

      const name = target.dataset.name;
      selectedStudent = { name };
      nameInput.value = name;
      nameWarning.textContent = '';
      suggestions.classList.remove('open');

      try {
        const status = await lookupStatusByName(name);
        await renderPreview({ name, label: status.name });
      } catch (error) {
        nameWarning.textContent = error.message;
        selectedStudent = null;
      }
    });

    document.addEventListener('click', (event) => {
      if (!suggestions.contains(event.target) && event.target !== nameInput) {
        suggestions.classList.remove('open');
      }
    });

    const triggerLookup = async () => {
      const value = normalizeText(nameInput.value);
      if (!value) {
        nameWarning.textContent = 'Please enter your name or certificate code.';
        clearSelection();
        return;
      }

      nameWarning.textContent = '';

      // 1. Try code lookup first
      try {
        const lookup = await lookupByCode(value);
        selectedStudent = { name: lookup.name };
        await renderPreview({ name: lookup.name, label: `${lookup.name} · ${value.toUpperCase()}` });
        return;
      } catch (error) {
        console.log('Code lookup failed, trying name lookup...');
      }

      // 2. Try name lookup
      try {
        const status = await lookupStatusByName(value);
        selectedStudent = { name: status.name };
        await renderPreview({ name: status.name, label: status.name });
      } catch (error) {
        nameWarning.textContent = 'Certificate code or name not found. Please try again.';
        clearSelection();
      }
    };

    verifyButton.addEventListener('click', triggerLookup);

    downloadButton.addEventListener('click', () => {
      if (!selectedStudent?.name) {
        nameWarning.textContent = 'Please look up a certificate first.';
        return;
      }

      nameWarning.textContent = '';

      fetchDownload({ name: selectedStudent.name })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = selectedStudent.name.replace(/\s+/g, '_') + '_certificate.png';
          anchor.setAttribute('data-security', 'verified');
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        })
        .catch((error) => {
          console.error('Certificate download failed:', error);
          nameWarning.textContent = 'Download failed: ' + error.message;
        });
    });

    previewClose?.addEventListener('click', () => {
      clearSelection();
    });
  } catch (error) {
    console.error('Certificate page initialization failed:', error);
    const nameWarning = document.getElementById('student-name-warning');
    if (nameWarning) nameWarning.textContent = 'Error loading certificate portal. Please refresh the page.';
  }
}

window.addEventListener('load', initCertificatePage);