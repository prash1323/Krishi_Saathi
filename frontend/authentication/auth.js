/**
 * auth.js — Krishi Saathi Frontend Authentication
 *
 * Handles: Signup · Login · JWT storage · Profile guard · Logout
 * Connects to: http://localhost:5000/api/auth
 *
 * Public API (attach to window for cross-page access):
 *   AuthGuard.requireAuth()   → Redirect to login if no token
 *   AuthGuard.logout()        → Clear session and redirect
 *   AuthGuard.getUser()       → Returns stored user object or null
 *   AuthGuard.getToken()      → Returns stored JWT or null
 */

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const API_BASE   = 'http://localhost:5000/api/auth';
const TOKEN_KEY  = 'token';
const USER_KEY   = 'user';

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS
───────────────────────────────────────────────────────────── */
const Storage = {
  setToken : (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken : ()      => localStorage.getItem(TOKEN_KEY),
  setUser  : (user)  => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser  : ()      => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
  clear    : ()      => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

/* ─────────────────────────────────────────────────────────────
   API HELPER  — unified fetch wrapper
───────────────────────────────────────────────────────────── */
/**
 * @param {string} endpoint  - e.g. '/login'
 * @param {object} body      - JSON payload
 * @returns {{ data, error }} - structured result
 */
async function apiPost(endpoint, body) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      // Surface the server's message if available
      const message =
        data?.message ||
        data?.error   ||
        `Server error (${response.status})`;
      return { data: null, error: message };
    }

    return { data, error: null };
  } catch (err) {
    // Network / CORS / offline
    if (!navigator.onLine) {
      return { data: null, error: 'No internet connection. Please check your network.' };
    }
    return { data: null, error: 'Cannot reach the server. Please try again later.' };
  }
}

/* ─────────────────────────────────────────────────────────────
   UI HELPERS — DOM utilities shared by both pages
───────────────────────────────────────────────────────────── */

/** Show or hide the global alert banner */
function showAlert(message, type = 'error') {
  const el = document.getElementById('authAlert');
  if (!el) return;
  el.className = `alert alert-${type} visible`;
  el.querySelector('.alert-body').textContent = message;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAlert() {
  const el = document.getElementById('authAlert');
  if (el) el.classList.remove('visible');
}

/** Set a submit button into loading state or restore it */
function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle('loading', isLoading);
}

/** Mark an individual field as invalid with an inline message */
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const msg   = document.getElementById(`${fieldId}Msg`);
  if (field) field.classList.add('field-error');
  if (msg)   { msg.textContent = message; msg.classList.add('visible'); }
}

/** Clear all field-level error states on a form */
function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  form.querySelectorAll('.field-msg.visible').forEach(el => el.classList.remove('visible'));
}

/** Toggle password visibility */
function initPasswordToggles() {
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input    = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type   = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁️';
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────────────────────── */
const Validators = {
  notEmpty  : (val)      => val.trim().length > 0,
  isEmail   : (val)      => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
  minLength : (val, n)   => val.trim().length >= n,
};

/** Validate the signup form; returns true if valid */
function validateSignupForm(fields) {
  let valid = true;
  const form = document.getElementById('signupForm');
  clearFieldErrors(form);

  if (!Validators.notEmpty(fields.name)) {
    setFieldError('name', 'Full name is required'); valid = false;
  }

  if (!Validators.isEmail(fields.email)) {
    setFieldError('email', 'Enter a valid email address'); valid = false;
  }

  if (!Validators.minLength(fields.password, 6)) {
    setFieldError('password', 'Password must be at least 6 characters'); valid = false;
  }

  if (!Validators.notEmpty(fields.state)) {
    setFieldError('state', 'Please select your state'); valid = false;
  }

  if (!Validators.notEmpty(fields.district)) {
    setFieldError('district', 'District is required'); valid = false;
  }

  if (!Validators.notEmpty(fields.soil_type)) {
    setFieldError('soil_type', 'Please select soil type'); valid = false;
  }

  return valid;
}

/** Validate the login form; returns true if valid */
function validateLoginForm(email, password) {
  const form = document.getElementById('loginForm');
  clearFieldErrors(form);
  let valid = true;

  if (!Validators.isEmail(email)) {
    setFieldError('email', 'Enter a valid email address'); valid = false;
  }
  if (!Validators.notEmpty(password)) {
    setFieldError('password', 'Password is required'); valid = false;
  }
  return valid;
}

/* ─────────────────────────────────────────────────────────────
   SIGNUP
───────────────────────────────────────────────────────────── */
async function handleSignup(e) {
  e.preventDefault();
  clearAlert();

  const btn    = document.getElementById('signupBtn');
  const fields = {
    name:      document.getElementById('name')?.value      || '',
    email:     document.getElementById('email')?.value     || '',
    password:  document.getElementById('password')?.value  || '',
    state:     document.getElementById('state')?.value     || '',
    district:  document.getElementById('district')?.value  || '',
    soil_type: document.getElementById('soil_type')?.value || '',
  };

  if (!validateSignupForm(fields)) return;

  setLoading(btn, true);

  const { data, error } = await apiPost('/signup', fields);

  setLoading(btn, false);

  if (error) {
    // Handle specific known errors
    if (error.toLowerCase().includes('already') || error.toLowerCase().includes('duplicate')) {
      showAlert('An account with this email already exists. Please log in instead.');
      setFieldError('email', 'Email already registered');
    } else {
      showAlert(error);
    }
    return;
  }

  // ✅ Success — redirect to login
  showAlert('Account created successfully! Redirecting to login…', 'success');
  setTimeout(() => { window.location.href = 'login.html'; }, 1800);
}

/* ─────────────────────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  clearAlert();

  const email    = document.getElementById('email')?.value    || '';
  const password = document.getElementById('password')?.value || '';
  const btn      = document.getElementById('loginBtn');

  if (!validateLoginForm(email, password)) return;

  setLoading(btn, true);

  const { data, error } = await apiPost('/login', { email, password });

  setLoading(btn, false);

  if (error) {
    if (error.toLowerCase().includes('invalid') || error.toLowerCase().includes('incorrect')) {
      showAlert('Incorrect email or password. Please try again.');
    } else if (error.toLowerCase().includes('not found') || error.toLowerCase().includes('no user')) {
      showAlert('No account found with this email. Please sign up first.');
    } else {
      showAlert(error);
    }
    return;
  }

  // ✅ Store JWT and user, then redirect
  const token = data?.token || data?.access_token;
  const user  = data?.user  || data;

  if (!token) {
    showAlert('Login failed: unexpected server response. Please try again.');
    return;
  }

  Storage.setToken(token);
  Storage.setUser(user);

  showAlert(`Welcome back, ${user?.name || 'Farmer'}! 🌾`, 'success');
  setTimeout(() => { window.location.href = '../dashboard.html'; }, 1200);
}

/* ─────────────────────────────────────────────────────────────
   AUTH GUARD  — protect pages that require login
───────────────────────────────────────────────────────────── */
const AuthGuard = {
  /**
   * Call on any page that requires authentication.
   * If no token is stored, redirects to login immediately.
   */
  requireAuth() {
    const token = Storage.getToken();
    if (!token) {
      window.location.href = '/frontend/auth/login.html';
      return false;
    }
    return true;
  },

  /** Remove session data and redirect to login */
  logout() {
    Storage.clear();
    window.location.href = '/frontend/auth/login.html';
  },

  /** Returns the stored user object, or null */
  getUser() {
    return Storage.getUser();
  },

  /** Returns the stored JWT token, or null */
  getToken() {
    return Storage.getToken();
  },

  /**
   * Returns headers object pre-filled with Authorization.
   * Use for authenticated API calls on protected pages.
   */
  authHeaders() {
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${Storage.getToken()}`,
    };
  },
};

// Expose AuthGuard globally so other scripts can use it
window.AuthGuard = AuthGuard;

/* ─────────────────────────────────────────────────────────────
   INIT — wire up whichever form exists on the current page
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);

    // Inline clearing on re-type
    signupForm.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('field-error');
        const msg = document.getElementById(`${field.id}Msg`);
        if (msg) msg.classList.remove('visible');
        clearAlert();
      });
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);

    loginForm.querySelectorAll('input').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('field-error');
        const msg = document.getElementById(`${field.id}Msg`);
        if (msg) msg.classList.remove('visible');
        clearAlert();
      });
    });
  }

  // Redirect already-logged-in users away from auth pages
  const isAuthPage = !!document.getElementById('loginForm') || !!document.getElementById('signupForm');
  if (isAuthPage && Storage.getToken()) {
    window.location.href = '../dashboard.html';
  }
});
