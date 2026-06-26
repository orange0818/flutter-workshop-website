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
    const [resp, eligResp] = await Promise.all([
      fetch('assets/FLUTTER ELIGIBLE CANDIDATES.txt'),
      fetch('assets/candidateswhocompletedtheassignment.txt')
    ]);
    if (!resp.ok) throw new Error('Failed to load certificate text data');
    const rawText = await resp.text();

    const parseTextData = (text) => {
      const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
      if (rows.length < 2) return [];
      const headers = rows[0].split(/\t+/).map((cell) => cell.trim().toLowerCase());
      const nameIndex = headers.findIndex((h) => /^(name)$/.test(h));
      const codeIndex = headers.findIndex((h) => /unique\s*code/i.test(h));
      if (nameIndex < 0 || codeIndex < 0) return [];
      return rows.slice(1).map((row) => {
        const cols = row.split(/\t+/).map((cell) => cell.trim());
        const name = cols[nameIndex] || '';
        const code = cols[codeIndex] || '';
        return {
          name,
          code,
          file: `assets/certificates/student/${name}.png`
        };
      }).filter((item) => item.name && item.code);
    };

    const rawData = parseTextData(rawText);
    if (!rawData.length) throw new Error('No certificate records found in text file');

    const eligibleNames = new Set();
    if (eligResp && eligResp.ok) {
      const txt = await eligResp.text();
      txt.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).forEach((n) => eligibleNames.add(n.toLowerCase()));
    }

    const students = rawData.map((item) => ({
      ...item,
      normalizedName: item.name.trim().toLowerCase(),
      normalizedCode: String(item.code || '').trim().toLowerCase()
    }));

    const isEligible = (student) => student && eligibleNames.has(student.normalizedName);

    const codeMap = new Map(students.filter((item) => item.normalizedCode).map((item) => [item.normalizedCode, item]));
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
    let selectedStudent = null;

    if (!nameInput || !suggestions || !downloadButton || !verifyButton) return;

    const normalizeText = (value) => String(value || '').trim().toLowerCase();

    const updateDownloadState = () => {
      const enabled = selectedStudent && selectedStudent.file && isEligible(selectedStudent);
      downloadButton.disabled = !enabled;
      downloadButton.classList.toggle('opacity-50', !enabled);
    };

    const renderSuggestions = (query) => {
      suggestions.innerHTML = '';
      const normalized = normalizeText(query);
      if (normalized.length < 2) {
        suggestions.classList.remove('open');
        return;
      }
      const matched = students.filter((item) => item.normalizedName.includes(normalized)).slice(0, 8);
      if (!matched.length) {
        suggestions.classList.remove('open');
        return;
      }
      matched.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.name;
        li.className = 'suggestion-item';
        li.dataset.name = item.normalizedName;
        li.dataset.file = item.file;
        li.dataset.code = item.normalizedCode;
        suggestions.appendChild(li);
      });
      suggestions.classList.add('open');
    };

    const clearSelection = () => {
      selectedStudent = null;
      updateDownloadState();
    };

    nameInput.addEventListener('input', (event) => {
      clearSelection();
      const value = event.target.value;
      renderSuggestions(value);
      nameWarning.textContent = '';
    });

    const renderBlurredPreview = async (student) => {
      try {
        const blob = await fetchCertificate(student);
        const img = await createImageBitmap(blob);
        const width = img.width;
        const height = img.height;

        const renderToCanvas = (blurRadius) => {
          const out = document.createElement('canvas');
          out.width = width;
          out.height = height;
          const outCtx = out.getContext('2d');
          outCtx.filter = `blur(${blurRadius}px)`;
          outCtx.drawImage(img, 0, 0);
          return out;
        };

        const baseCanvas = renderToCanvas(16);
        const edgeCanvas = renderToCanvas(42);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.sqrt(cx * cx + cy * cy);
        const gradient = maskCtx.createRadialGradient(cx, cy, maxRadius * 0.35, cx, cy, maxRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.55, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,1)');
        maskCtx.fillStyle = gradient;
        maskCtx.fillRect(0, 0, width, height);

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.drawImage(baseCanvas, 0, 0);

        const edgeMask = document.createElement('canvas');
        edgeMask.width = width;
        edgeMask.height = height;
        const edgeCtx = edgeMask.getContext('2d');
        edgeCtx.drawImage(edgeCanvas, 0, 0);
        edgeCtx.globalCompositeOperation = 'destination-in';
        edgeCtx.drawImage(maskCanvas, 0, 0);

        finalCtx.drawImage(edgeMask, 0, 0);
        finalCtx.globalCompositeOperation = 'source-atop';
        finalCtx.fillStyle = 'rgba(220,38,38,0.35)';
        finalCtx.fillRect(0, 0, width, height);

        return finalCanvas.toDataURL('image/png');
      } catch (e) {
        console.error('Blurred preview failed', e);
        return '';
      }
    };

    previewImage.addEventListener('contextmenu', (e) => e.preventDefault());
    const redactCode = (code) => String(code || '').replace(/[^\s-]/g, '•');

    // Fetch certificate from verified API endpoint only (strict security)
    const fetchCertificate = async (student) => {
      const apiUrl = new URL('/api/verify-certificate', window.location.origin);
      apiUrl.searchParams.set('name', student.name);
      apiUrl.searchParams.set('code', student.code);
      
      try {
        const res = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          credentials: 'same-origin'
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Verification failed: ${res.statusText}`);
        }
        
        return res.blob();
      } catch (error) {
        // Provide helpful error messages
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('API endpoint not available. Please ensure the server is running on http://localhost:3000 or the website is deployed.');
        }
        throw error;
      }
    };

    const renderPreview = async (student, eligible, showCode = true) => {
      if (!student) return;
      const codeText = showCode ? student.code : redactCode(student.code);
      previewLabel.textContent = `${student.name}${codeText ? ` · ${codeText}` : ''}`;
      const eligibilityNote = document.getElementById('certificate-eligibility-note');
      if (eligible) {
        codeWarning.textContent = '';
        if (eligibilityNote) eligibilityNote.textContent = '';
        
        try {
          const blob = await fetchCertificate(student);
          const blobUrl = URL.createObjectURL(blob);
          previewImage.src = blobUrl;
          previewImage.alt = `${student.name} certificate preview`;
          previewImage.draggable = false;
          previewContainer.classList.remove('hidden');
          updateDownloadState();
        } catch (error) {
          console.error('Failed to load certificate preview:', error);
          previewImage.alt = 'Failed to load certificate';
          codeWarning.textContent = 'Could not load certificate preview: ' + error.message;
        }
      } else {
        if (eligibilityNote) eligibilityNote.textContent = 'You have not completed required assignment or attendance threshold — download locked.';
        previewImage.src = '';
        previewImage.alt = `${student.name} certificate preview (locked)`;
        previewImage.draggable = false;
        previewContainer.classList.remove('hidden');
        const dataUrl = await renderBlurredPreview(student);
        if (dataUrl) {
          previewImage.src = dataUrl;
        }
        downloadButton.disabled = true;
        downloadButton.classList.add('opacity-50');
      }
    };

    suggestions.addEventListener('click', async (event) => {
      const target = event.target.closest('.suggestion-item');
      if (!target) return;
      const normalized = target.dataset.name;
      selectedStudent = students.find((item) => item.normalizedName === normalized) || null;
      if (selectedStudent) {
        nameInput.value = selectedStudent.name;
        nameWarning.textContent = '';
      }
      suggestions.classList.remove('open');
      updateDownloadState();
      await renderPreview(selectedStudent, isEligible(selectedStudent), false);
    });

    document.addEventListener('click', (event) => {
      if (!suggestions.contains(event.target) && event.target !== nameInput) {
        suggestions.classList.remove('open');
      }
    });

    downloadButton.addEventListener('click', () => {
      if (!selectedStudent || !selectedStudent.file) {
        nameWarning.textContent = 'Please select one of the name suggestions before downloading.';
        return;
      }
      if (!isEligible(selectedStudent)) {
        nameWarning.textContent = 'You are not eligible to download this certificate.';
        return;
      }
      nameWarning.textContent = '';
      
      // Use verified API endpoint - no fallback
      fetchCertificate(selectedStudent)
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = selectedStudent.name.replace(/\s+/g, '_') + '_certificate.png';
          anchor.setAttribute('data-security', 'verified');
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          nameWarning.textContent = '';
        })
        .catch(error => {
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
      const student = codeMap.get(code);
      if (!student || !student.file) {
        codeWarning.textContent = 'The code is invalid or the certificate does not exist.';
        previewContainer.classList.add('hidden');
        return;
      }
      const eligible = isEligible(student);
      if (!eligible) {
        codeWarning.textContent = '';
        await renderPreview(student, false);
        return;
      }
      codeWarning.textContent = '';
      await renderPreview(student, true);
    });

    previewClose?.addEventListener('click', () => {
      previewContainer.classList.add('hidden');
    });
  } catch (error) {
    console.error('Certificate page initialization failed:', error);
    const nameWarning = document.getElementById('student-name-warning');
    const codeWarning = document.getElementById('certificate-code-warning');
    if (nameWarning) nameWarning.textContent = 'Error loading certificate data. Please refresh the page.';
    if (codeWarning) codeWarning.textContent = 'Error loading certificate data. Please refresh the page.';
  }
}

window.addEventListener('load', initCertificatePage);