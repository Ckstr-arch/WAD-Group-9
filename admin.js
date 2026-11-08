// login.js
import { api } from './services/api.js';

const form = document.getElementById('login-form');
const errorContainer = document.querySelector('.form-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorContainer.textContent = '';
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await api.login({ email, password });
    // Redirect based on role or to dashboard
    window.location.href = response.data.user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
  } catch (err) {
    errorContainer.textContent = err.message || 'Invalid login credentials.';
  }
});