/* ═══════════════════════════════════════════════════════════════
   KRISHI SAATHI – script.js
   Vanilla JS (no JSX, no Babel needed)
   React components are mounted via inline <script type="text/babel">
   tags directly in index.html for reliable DOM timing.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────────────────────────
   1. PERSISTED THEME — apply before paint to avoid flash
─────────────────────────────────────────────────────────────── */
(function applyStoredTheme() {
  try {
    const saved = localStorage.getItem('ks-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (_) {}
})();

/* ───────────────────────────────────────────────────────────────
   2. LIVE CLOCK
─────────────────────────────────────────────────────────────── */
function initLiveClock() {
  const el = document.getElementById('clock-time');
  if (!el) return;
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    el.textContent = h + ':' + m + ':' + s;
  }
  tick();
  setInterval(tick, 1000);
}

/* ───────────────────────────────────────────────────────────────
   3. STICKY HEADER
─────────────────────────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.getElementById('top-header');
  if (!header) return;
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ───────────────────────────────────────────────────────────────
   4. SMOOTH SCROLL
─────────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var headerH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '64'
      );
      var navH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '52'
      );
      var offset = headerH + navH + 16;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      closeMobileNav();
    });
  });
}

/* ───────────────────────────────────────────────────────────────
   5. MOBILE MENU
─────────────────────────────────────────────────────────────── */
function closeMobileNav() {
  var mobileNav  = document.getElementById('mobile-nav');
  var overlay    = document.getElementById('mobile-overlay');
  var hamburger  = document.getElementById('hamburger');
  if (mobileNav)  { mobileNav.classList.remove('open');  mobileNav.setAttribute('aria-hidden', 'true'); }
  if (overlay)    { overlay.classList.remove('open'); }
  if (hamburger)  { hamburger.classList.remove('open');   hamburger.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
}

function initMobileMenu() {
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  var overlay   = document.getElementById('mobile-overlay');
  if (!hamburger || !mobileNav || !overlay) return;

  hamburger.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  overlay.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileNav();
  });
}

/* ───────────────────────────────────────────────────────────────
   6. ACTIVE NAV HIGHLIGHT
─────────────────────────────────────────────────────────────── */
function initActiveNavHighlight() {
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { rootMargin: '-116px 0px -60% 0px', threshold: 0 });

  sections.forEach(function (s) { observer.observe(s); });
}

/* ───────────────────────────────────────────────────────────────
   7. SCROLL ANIMATIONS
─────────────────────────────────────────────────────────────── */
function initScrollAnimations() {
  var elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(function (el) { observer.observe(el); });
}



/* ───────────────────────────────────────────────────────────────
   9. THEME TOGGLE — vanilla JS (replaces React ThemeToggle)
─────────────────────────────────────────────────────────────── */
function initThemeToggle() {
  var root = document.getElementById('theme-toggle-root');
  if (!root) return;

  var btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';

  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  function applyTheme(dark) {
    isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title',      dark ? 'Light mode' : 'Dark mode');
    try { localStorage.setItem('ks-theme', dark ? 'dark' : 'light'); } catch (_) {}
  }

  applyTheme(isDark);

  btn.addEventListener('click', function () { applyTheme(!isDark); });
  root.appendChild(btn);
}

/* ───────────────────────────────────────────────────────────────
   10. BENEFIT CARDS — vanilla JS with staggered scroll reveal
─────────────────────────────────────────────────────────────── */
var BENEFIT_CARDS = [
  {
    icon: '🌾',
    title: 'Crop Assistance',
    description: 'AI-powered crop identification and growth stage analysis. Upload a photo and get instant diagnosis, nutrient recommendations, and harvest timing advice.',
    tag: 'AI Powered',
  },
  {
    icon: '🔬',
    title: 'Disease Detection',
    description: 'CNN-based leaf disease classification with 98.2% accuracy. Detect 50+ crop diseases before symptoms become catastrophic, with personalised treatment plans.',
    tag: '98.2% Accuracy',
  },
  {
    icon: '🌦️',
    title: 'Weather Forecasting',
    description: '14-day hyper-local forecasting tailored to your GPS location and field microclimate. Irrigation and spraying advisories updated every 3 hours.',
    tag: 'Hyper-local',
  },
];

function initBenefitCards() {
  var root = document.getElementById('benefits-cards-root');
  if (!root) return;

  var grid = document.createElement('div');
  grid.className = 'benefits-grid';

  BENEFIT_CARDS.forEach(function (card, i) {
    var el = document.createElement('div');
    el.className = 'benefit-card';
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.55s ease ' + (i * 0.12) + 's, transform 0.55s ease ' + (i * 0.12) + 's';

    el.innerHTML =
      '<div class="benefit-icon-wrap">' + card.icon + '</div>' +
      '<h3>' + card.title + '</h3>' +
      '<p>' + card.description + '</p>' +
      '<span class="benefit-tag">' + card.tag + '</span>';

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    observer.observe(el);
    grid.appendChild(el);
  });

  root.appendChild(grid);
}

/* ───────────────────────────────────────────────────────────────
   11. WORKFLOW STEPS — vanilla JS
─────────────────────────────────────────────────────────────── */
var WORKFLOW_STEPS = [
  { num: '01', icon: '👤', title: 'Register / Login',   description: 'Create your farmer profile in under 60 seconds. Link your Aadhaar for instant government scheme eligibility checks.' },
  { num: '02', icon: '🎛️', title: 'Select a Service',   description: 'Choose from 7 specialised services. Enter your crop type, location, and any current concerns you want addressed.' },
  { num: '03', icon: '💡', title: 'Get Smart Insights', description: 'Receive personalised, actionable recommendations in your preferred language — instantly, or scheduled as daily digests.' },
];

function initWorkflowCards() {
  var root = document.getElementById('workflow-root');
  if (!root) return;

  var wrap = document.createElement('div');
  wrap.className = 'workflow-steps';

  WORKFLOW_STEPS.forEach(function (step, i) {
    var el = document.createElement('div');
    el.className = 'workflow-card';
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'opacity 0.5s ease ' + (i * 0.15) + 's, transform 0.5s ease ' + (i * 0.15) + 's';

    el.innerHTML =
      '<div class="workflow-step-num">' + step.num + '</div>' +
      '<div class="workflow-icon">' + step.icon + '</div>' +
      '<h3>' + step.title + '</h3>' +
      '<p>' + step.description + '</p>';

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    observer.observe(el);
    wrap.appendChild(el);
  });

  root.appendChild(wrap);
}

/* ───────────────────────────────────────────────────────────────
   12. SERVICE HUB CARDS — vanilla JS
─────────────────────────────────────────────────────────────── */
var SERVICE_CARDS = [
  { icon: '🌿', title: 'Crop Identification',    description: 'Photograph any plant and get species identification, growth stage, and cultivation advice in seconds.',            href: 'services.html' },
  { icon: '🔬', title: 'Disease Detection',       description: 'Upload leaf images for AI-powered detection of 50+ diseases with confidence scores and treatment steps.',         href: 'services.html' },
  { icon: '🌤️', title: 'Weather Forecast',       description: 'Hyper-local 14-day forecasts with irrigation advisories and extreme weather early warnings.',                     href: 'services.html' },
  { icon: '🌱', title: 'Crop Recommendation',     description: 'Soil-based AI recommendations for the most profitable crops for your land and season.',                          href: 'services.html' },
  { icon: '📊', title: 'Market Prices',           description: 'Live mandi prices, price trend charts, and sell-timing alerts for 200+ agricultural commodities.',               href: 'services.html' },
  { icon: '🏛️', title: 'Government Schemes',     description: 'Personalised eligibility check for 80+ national and state agricultural schemes and subsidies.',                   href: 'services.html' },
  { icon: '🧭', title: 'Smart Farming Guide',     description: 'Step-by-step guides for precision agriculture, organic farming, and sustainable soil management.',               href: 'services.html' },
];

function initServiceCards() {
  var root = document.getElementById('service-cards-root');
  if (!root) return;

  var grid = document.createElement('div');
  grid.className = 'service-grid';

  SERVICE_CARDS.forEach(function (service, i) {
    var el = document.createElement('div');
    el.className = 'service-card';
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    el.style.cursor = 'pointer';

    var delay = (i % 4) * 0.1;
    el.style.transition =
      'opacity 0.5s ease ' + delay + 's, transform 0.5s ease ' + delay + 's';

    el.innerHTML =
      '<div class="service-card-icon">' + service.icon + '</div>' +
      '<h3>' + service.title + '</h3>' +
      '<p>' + service.description + '</p>' +
      '<span class="service-card-link">Explore →</span>';

    /* Hover arrow update */
    el.addEventListener('mouseenter', function () {
      el.querySelector('.service-card-link').textContent = 'Explore →→';
    });
    el.addEventListener('mouseleave', function () {
      el.querySelector('.service-card-link').textContent = 'Explore →';
    });

    /* Click to navigate */
    el.addEventListener('click', function () {
      window.location.href = service.href;
    });

    /* Scroll reveal */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(el);
    grid.appendChild(el);
  });

  root.appendChild(grid);
}

/* ───────────────────────────────────────────────────────────────
   INIT ALL
─────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initLiveClock();
  initStickyHeader();
 /* initServicesDropdown();   /* ← vanilla dropdown, guaranteed to show */
  initThemeToggle();
  initSmoothScroll();
  initMobileMenu();
  initActiveNavHighlight();
  initScrollAnimations();
  initBenefitCards();
  initWorkflowCards();
  initServiceCards();
});