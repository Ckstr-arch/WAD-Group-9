const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorBox = form?.querySelector('.form-error');
const submitBtn = form?.querySelector('button[type="submit"]');

const AUTH_ENDPOINT = 'backend/api/auth.php';

function setError(message = '') {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.style.display = message ? 'block' : 'none';
}

function getRedirectUrl(role = '') {
  const normalizedRole = String(role).trim().toLowerCase();
  if (normalizedRole === 'admin') {
    return 'admin-dashboard.html';
  }
  return 'student-dashboard.html';
}

if (form) {
  setError('');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');

    const email = emailInput?.value.trim().toLowerCase() || '';
    const password = passwordInput?.value || '';

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.user) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      sessionStorage.setItem('sportshub_user', JSON.stringify(data.user));
      window.location.assign(getRedirectUrl(data.user.role));
    } catch {
      setError('Unable to reach the authentication server.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}