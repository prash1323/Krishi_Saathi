/* ═══════════════════════════════════════════════════════════════════
   KRISHI SAATHI – services.js
   Service Portal · Vanilla JavaScript
   Handles: dark mode · search · filter pills · card rendering ·
            explore redirects · scroll animations · counter animation ·
            sticky header · keyboard shortcuts · mobile behaviour
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   DATA — Service catalogue
   Each entry: { id, icon, title, desc, href, category, tag }
───────────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    id: 'crop-recommendation',
    icon: '🌱',
    title: 'Crop Recommendation',
    desc: 'Get personalised crop suggestions based on your soil type, district, season, and water availability.',
    href: 'crop.html',
    category: 'crop',
    tag: 'AI Powered',
  },
  {
    id: 'disease-detection',
    icon: '🔬',
    title: 'Disease Detection',
    desc: 'Upload a photo of your crop leaf and receive an instant AI diagnosis with treatment steps.',
    href: 'disease.html',
    category: 'crop',
    tag: '98% Accuracy',
  },
  {
    id: 'weather-intelligence',
    icon: '🌤️',
    title: 'Weather Intelligence',
    desc: 'Access hyper-local 14-day forecasts, rainfall predictions, and irrigation advisories for your field.',
    href: 'weather.html',
    category: 'weather',
    tag: 'Live Data',
  },
  {
    id: 'crop-analytics',
    icon: '📈',
    title: 'Historical Crop Analytics',
    desc: 'Analyse previous crop patterns, yield trends, and seasonal productivity for smarter planning.',
    href: 'analytics.html',
    category: 'crop',
    tag: 'Data Insights',
  },
  {
    id: 'soil-health',
    icon: '🪱',
    title: 'Soil Health Analyzer',
    desc: 'Evaluate soil nutrients, pH levels, and organic matter to determine the best crop suitability.',
    href: 'soil.html',
    category: 'soil',
    tag: 'Lab-grade',
  },
  {
    id: 'fertilizer-recommendation',
    icon: '⚗️',
    title: 'Fertilizer Recommendation',
    desc: 'Receive precise fertilizer dosage and schedule recommendations tailored to your soil report.',
    href: 'fertilizer.html',
    category: 'soil',
    tag: 'Precision Input',
  },
  {
    id: 'irrigation-planner',
    icon: '💧',
    title: 'Irrigation Planner',
    desc: 'Optimise water usage with smart irrigation schedules built around your crop, soil, and weather.',
    href: 'irrigation.html',
    category: 'planning',
    tag: 'Water Smart',
  },
  {
    id: 'mandi-prices',
    icon: '📊',
    title: 'Mandi Price Intelligence',
    desc: 'Track live mandi prices, profit trend charts, and receive sell-timing alerts for 200+ commodities.',
    href: 'market.html',
    category: 'market',
    tag: 'Live Prices',
  },
  {
    id: 'gov-schemes',
    icon: '🏛️',
    title: 'Government Scheme Finder',
    desc: 'Instantly check eligibility for 80+ national and state agricultural subsidies and welfare schemes.',
    href: 'schemes.html',
    category: 'planning',
    tag: 'Free Benefits',
  },
  {
    id: 'pest-risk',
    icon: '🐛',
    title: 'Pest Risk Prediction',
    desc: 'Predict incoming pest attack probabilities using crop type, region, and live weather data.',
    href: 'pest.html',
    category: 'crop',
    tag: 'Early Warning',
  },
  {
    id: 'crop-calendar',
    icon: '📅',
    title: 'Crop Calendar Planner',
    desc: 'Track and schedule sowing, watering, fertilizing, and harvesting milestones in one visual calendar.',
    href: 'calendar.html',
    category: 'planning',
    tag: 'Season Planner',
  },
];

/* ─────────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────────── */
const state = {
  query: '',
  filter: 'all',
};

/* ─────────────────────────────────────────────────────────────────
   HELPER — SVG arrow (used in card buttons)
───────────────────────────────────────────────────────────────── */
function arrowSVG() {
  return `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ─────────────────────────────────────────────────────────────────
   1. RENDER SERVICE CARDS
───────────────────────────────────────────────────────────────── */
function getFilteredServices() {
  const q = state.query.trim().toLowerCase();
  return SERVICES.filter(s => {
    const matchFilter = state.filter === 'all' || s.category === state.filter;
    const matchQuery  = !q
      || s.title.toLowerCase().includes(q)
      || s.desc.toLowerCase().includes(q)
      || s.tag.toLowerCase().includes(q)
      || s.category.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });
}

function buildCard(service, index) {
  const card = document.createElement('article');
  card.className = 'svc-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('data-category', service.category);
  card.setAttribute('data-id', service.id);

  // Staggered reveal — delay proportional to position in current batch
  const delay = (index % 9) * 60; // ms, capped at 9 so long lists don't feel slow

  card.innerHTML = `
    <div class="svc-icon" aria-hidden="true">${service.icon}</div>
    <span class="svc-tag">${service.tag}</span>
    <h3 class="svc-title">${service.title}</h3>
    <p class="svc-desc">${service.desc}</p>
    <button
      class="svc-btn"
      data-href="${service.href}"
      aria-label="Explore ${service.title}"
    >
      Explore ${arrowSVG()}
    </button>
  `;

  /* Explore button → navigate */
  card.querySelector('.svc-btn').addEventListener('click', () => {
    window.location.href = service.href;
  });

  /* Entire card is also clickable (not just button) */
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.svc-btn')) {
      window.location.href = service.href;
    }
    card.style.cursor = 'pointer';
  });

  /* Scroll-reveal — IntersectionObserver with staggered delay */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  observer.observe(card);

  return card;
}

function renderCards() {
  const grid       = document.getElementById('cards-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl    = document.getElementById('service-count');
  if (!grid) return;

  const filtered = getFilteredServices();

  /* Update count badge */
  if (countEl) {
    countEl.textContent = filtered.length === 1
      ? '1 service'
      : `${filtered.length} services`;
  }

  /* Show / hide empty state */
  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState && (emptyState.hidden = false, emptyState.setAttribute('aria-hidden', 'false'));
    return;
  }

  emptyState && (emptyState.hidden = true, emptyState.setAttribute('aria-hidden', 'true'));

  /* Diff: only re-render if set changed (avoid flash on same results) */
  const currentIds = [...grid.querySelectorAll('.svc-card')].map(c => c.dataset.id).join(',');
  const newIds     = filtered.map(s => s.id).join(',');
  if (currentIds === newIds) return;

  /* Clear + rebuild */
  grid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  filtered.forEach((service, i) => {
    fragment.appendChild(buildCard(service, i));
  });
  grid.appendChild(fragment);

  /* Update ARIA live region for screen readers */
  const statusEl = document.getElementById('search-status');
  if (statusEl) {
    statusEl.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'service' : 'services'}`;
  }
}

/* ─────────────────────────────────────────────────────────────────
   2. SEARCH
───────────────────────────────────────────────────────────────── */
function initSearch() {
  const input = document.getElementById('service-search');
  if (!input) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.query = input.value;
      renderCards();
    }, 160); // debounce — snappy but not jittery
  });

  /* Clear on ESC */
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      state.query = '';
      renderCards();
      input.blur();
    }
  });

  /* Empty-state reset button */
  const resetBtn = document.getElementById('empty-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      input.value = '';
      state.query = '';
      renderCards();
      input.focus();
    });
  }
}

/* ─────────────────────────────────────────────────────────────────
   3. FILTER PILLS
───────────────────────────────────────────────────────────────── */
function initFilterPills() {
  const pills = document.querySelectorAll('.pill');
  if (!pills.length) return;

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      /* Update active pill */
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      /* Update state + re-render */
      state.filter = pill.dataset.filter || 'all';
      renderCards();

      /* Clear search when switching filter so results make sense */
      const input = document.getElementById('service-search');
      if (input && input.value) {
        input.value = '';
        state.query = '';
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────────
   4. DARK MODE TOGGLE
───────────────────────────────────────────────────────────────── */
function initThemeToggle() {
  const btn  = document.getElementById('theme-toggle');
  const icon = btn ? btn.querySelector('.theme-icon') : null;
  if (!btn || !icon) return;

  /* Read persisted preference */
  let isDark = (() => {
    try { return localStorage.getItem('ks-theme') === 'dark'; } catch (_) { return false; }
  })();

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    icon.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title',      dark ? 'Light mode' : 'Dark mode');
    try { localStorage.setItem('ks-theme', dark ? 'dark' : 'light'); } catch (_) {}
  }

  /* Apply on load */
  applyTheme(isDark);

  btn.addEventListener('click', () => {
    isDark = !isDark;
    applyTheme(isDark);
  });
}

/* ─────────────────────────────────────────────────────────────────
   5. STICKY HEADER — shadow on scroll
───────────────────────────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.getElementById('services-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('sh-scrolled', window.scrollY > 16);
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────────
   6. SMOOTH SCROLL — anchor links
───────────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const HEADER_H = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '62'
      );
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - HEADER_H - 16,
        behavior: 'smooth',
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────────────
   7. COUNTER ANIMATION — impact stats
───────────────────────────────────────────────────────────────── */
function animateCounter(el, target, duration = 1600) {
  const start     = performance.now();
  const startVal  = 0;
  const isLarge   = target >= 1000;

  function formatNum(n) {
    if (isLarge) {
      return n >= 1000
        ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K+'
        : Math.floor(n).toString();
    }
    return Math.floor(n).toString() + '+';
  }

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatNum(startVal + (target - startVal) * eased);

    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatNum(target);
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('.impact-num[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target, 10);
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ─────────────────────────────────────────────────────────────────
   8. KEYBOARD SHORTCUT — ⌘K / Ctrl+K focuses search
───────────────────────────────────────────────────────────────── */
function initKeyboardShortcut() {
  document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const trigger = isMac ? (e.metaKey && e.key === 'k') : (e.ctrlKey && e.key === 'k');
    if (trigger) {
      e.preventDefault();
      const input = document.getElementById('service-search');
      if (input) {
        input.focus();
        input.select();
        // Smooth scroll to search if off-screen
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   9. HOVER INTERACTIONS — card keyboard accessibility
      Cards are navigable with Tab + Enter/Space
───────────────────────────────────────────────────────────────── */
function initCardAccessibility() {
  // Re-run after every render via MutationObserver
  const grid = document.getElementById('cards-grid');
  if (!grid) return;

  function applyTabIndex() {
    grid.querySelectorAll('.svc-card').forEach(card => {
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.querySelector('.svc-btn')?.click();
        }
      });
    });
  }

  const mo = new MutationObserver(applyTabIndex);
  mo.observe(grid, { childList: true });
  applyTabIndex(); // initial run
}

/* ─────────────────────────────────────────────────────────────────
   10. MOBILE — collapse logo text on small screens (already via CSS,
       but also ensure controls layout doesn't break on resize)
───────────────────────────────────────────────────────────────── */
function initResponsiveBehaviour() {
  // Nothing extra needed — CSS handles layout.
  // This hook is here for future mobile-specific JS if required.
}

/* ─────────────────────────────────────────────────────────────────
   11. RESTORE PERSISTED THEME on page load
       (mirrors landing page behaviour so theme is consistent)
───────────────────────────────────────────────────────────────── */
(function restoreTheme() {
  try {
    const saved = localStorage.getItem('ks-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (_) {}
})();

/* ─────────────────────────────────────────────────────────────────
   INIT — wire everything up on DOMContentLoaded
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderCards();          // 1. Render service cards from data
  initSearch();           // 2. Live search filter
  initFilterPills();      // 3. Category pill filters
  initThemeToggle();      // 4. Dark / light mode
  initStickyHeader();     // 5. Header shadow on scroll
  initSmoothScroll();     // 6. Smooth anchor scrolling
  initCounters();         // 7. Animated impact counters
  initKeyboardShortcut(); // 8. ⌘K / Ctrl+K search focus
  initCardAccessibility();// 9. Keyboard nav for cards
  initResponsiveBehaviour(); // 10. Mobile behaviour hook
});
