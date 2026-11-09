import { post, get } from './services/api.js';

const form = document.querySelector('#login-form');
const error = document.querySelector('.form-error');

get('auth.php').then(({ user }) => {
  if (user) window.location.href = user.role === 'student' || user.role === 'club_manager' ? 'student-dashboard.html' : 'admin-dashboard.html';
}).catch(() => {});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.textContent = '';
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const { user } = await post('auth.php', Object.fromEntries(new FormData(form)));
    window.location.href = user.role === 'student' || user.role === 'club_manager' ? 'student-dashboard.html' : 'admin-dashboard.html';
  } catch (e) {
    error.textContent = e.message;
  } finally {
    button.disabled = false;
  }
});
