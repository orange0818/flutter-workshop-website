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
    const codeInput = document.getElementById('certificate-code-input');
    const verifyButton = document.getElementById('verify-certificate-btn');
    const codeWarning = document.getElementById('certificate-code-warning');
    const previewContainer = document.getElementById('certificate-preview-container');
    const previewImage = document.getElementById('certificate-preview-image');
    const previewLabel = document.getElementById('certificate-preview-label');
    const previewClose = document.getElementById('certificate-preview-close');
    const eligibilityNote = document.getElementById('certificate-eligibility-note');

    if (!nameInput || !suggestions || !downloadButton || !verifyButton) return;

    let selectedStudent = null;
    let selectedStatus = null;
    let previewObjectUrl = null;

    const normalizeText = (value) => String(value || '').trim().toLowerCase();

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

    const fetchPreview = async ({ name, code }) => {
      const res = await apiFetch('/api/certificate-preview', { name, code });
      return res.blob();
    };

    const fetchDownload = async ({ name, code }) => {
      const res = await apiFetch('/api/verify-certificate', { name, code });
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

    const updateDownloadState = () => {
      const enabled = Boolean(
        selectedStudent &&
        selectedStatus?.assignmentCompleted &&
        normalizeText(codeInput?.value)
      );
      downloadButton.disabled = !enabled;
      downloadButton.classList.toggle('opacity-50', !enabled);
    };

    const renderSuggestions = async (query) => {
      suggestions.innerHTML = '';
      const normalized = normalizeText(query);
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
      selectedStatus = null;
      revokePreviewUrl();
      previewImage.src = '';
      updateDownloadState();
    };

    previewImage.addEventListener('contextmenu', (e) => e.preventDefault());

    const renderPreview = async ({ name, code = '', assignmentCompleted, showCode = false }) => {
      if (!name) return;

      previewLabel.textContent = showCode && code
        ? `${name} · ${code}`
        : name;

      if (!assignmentCompleted) {
        if (eligibilityNote) {
          eligibilityNote.textContent =
            'You have not completed the required assignment — preview is blurred and download is locked.';
        }
        codeWarning.textContent = '';
        nameWarning.textContent = '';

        try {
          const blob = await fetchPreview({ name });
          setPreviewImageFromBlob(blob, `${name} certificate preview (locked)`);
        } catch (error) {
          console.error('Failed to load blurred preview:', error);
          codeWarning.textContent = 'Could not load certificate preview: ' + error.message;
        }

        downloadButton.disabled = true;
        downloadButton.classList.add('opacity-50');
        return;
      }

      if (!normalizeText(code)) {
        if (eligibilityNote) {
          eligibilityNote.textContent = 'Enter your certificate code to unlock preview and download.';
        }
        revokePreviewUrl();
        previewImage.src = '';
        previewImage.alt = `${name} certificate preview (code required)`;
        previewContainer.classList.remove('hidden');
        updateDownloadState();
        return;
      }

      if (eligibilityNote) eligibilityNote.textContent = '';
      codeWarning.textContent = '';
      nameWarning.textContent = '';

      try {
        const blob = await fetchPreview({ name, code });
        setPreviewImageFromBlob(blob, `${name} certificate preview`);
        updateDownloadState();
      } catch (error) {
        console.error('Failed to load certificate preview:', error);
        codeWarning.textContent = 'Could not load certificate preview: ' + error.message;
        updateDownloadState();
      }
    };

    nameInput.addEventListener('input', (event) => {
      clearSelection();
      renderSuggestions(event.target.value);
      nameWarning.textContent = '';
      previewContainer.classList.add('hidden');
    });

    codeInput?.addEventListener('input', () => {
      updateDownloadState();
      if (selectedStudent?.name && selectedStatus?.assignmentCompleted) {
        renderPreview({
          name: selectedStudent.name,
          code: codeInput.value,
          assignmentCompleted: true,
          showCode: false,
        }).catch(() => {});
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
        selectedStatus = await lookupStatusByName(name);
        await renderPreview({
          name,
          code: codeInput?.value || '',
          assignmentCompleted: selectedStatus.assignmentCompleted,
          showCode: false,
        });
      } catch (error) {
        nameWarning.textContent = error.message;
        selectedStudent = null;
        selectedStatus = null;
      }
    });

    document.addEventListener('click', (event) => {
      if (!suggestions.contains(event.target) && event.target !== nameInput) {
        suggestions.classList.remove('open');
      }
    });

    downloadButton.addEventListener('click', () => {
      if (!selectedStudent?.name) {
        nameWarning.textContent = 'Please select one of the name suggestions before downloading.';
        return;
      }

      const code = normalizeText(codeInput?.value);
      if (!code) {
        nameWarning.textContent = 'Please enter your certificate code before downloading.';
        return;
      }

      if (!selectedStatus?.assignmentCompleted) {
        nameWarning.textContent = 'Assignment not completed. Certificate download is locked.';
        return;
      }

      nameWarning.textContent = '';

      fetchDownload({ name: selectedStudent.name, code })
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

    verifyButton.addEventListener('click', async () => {
      const code = normalizeText(codeInput.value);
      if (!code) {
        codeWarning.textContent = 'Please enter your certificate code.';
        previewContainer.classList.add('hidden');
        return;
      }

      try {
        const lookup = await lookupByCode(code);
        selectedStudent = { name: lookup.name };
        selectedStatus = lookup;
        nameInput.value = lookup.name;
        codeWarning.textContent = '';
        await renderPreview({
          name: lookup.name,
          code,
          assignmentCompleted: lookup.assignmentCompleted,
          showCode: true,
        });
      } catch (error) {
        codeWarning.textContent = error.message;
        previewContainer.classList.add('hidden');
      }
    });

    previewClose?.addEventListener('click', () => {
      previewContainer.classList.add('hidden');
      revokePreviewUrl();
    });
  } catch (error) {
    console.error('Certificate page initialization failed:', error);
    const nameWarning = document.getElementById('student-name-warning');
    const codeWarning = document.getElementById('certificate-code-warning');
    if (nameWarning) nameWarning.textContent = 'Error loading certificate portal. Please refresh the page.';
    if (codeWarning) codeWarning.textContent = 'Error loading certificate portal. Please refresh the page.';
  }
}

window.addEventListener('load', initCertificatePage);