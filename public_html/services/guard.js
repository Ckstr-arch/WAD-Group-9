import { get, post } from './api.js';

const required = document.body.dataset.require || 'any';
try {
  const { user } = await get('auth.php');
  const admin = ['sports_admin', 'super_admin'].includes(user.role);
  if (required === 'admin' && !admin) throw new Error('You do not have administrator access.');
  document.querySelectorAll('[data-user-name]').forEach((el) => { el.textContent = user.name; });
  document.querySelectorAll('#logout-btn').forEach((button) => button.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await post('auth.php?action=logout', {});
      window.location.href = 'index.html';
    } catch (error) {
      alert(error.message);
    }
  }));
} catch {
  window.location.href = 'index.html';
}
