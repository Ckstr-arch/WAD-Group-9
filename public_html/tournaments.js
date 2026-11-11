import { get, escapeHtml } from './services/api.js';
const target = document.querySelector('.feed-list');
try {
  const { data } = await get('tournaments.php');
  target.innerHTML = data.length ? data.map((item) => `<div class="feed-item"><strong>${escapeHtml(item.name)}</strong><p class="muted">${escapeHtml(item.sport)} · ${escapeHtml(item.start_date)} to ${escapeHtml(item.end_date)} · ${escapeHtml(item.status.replaceAll('_', ' '))}</p><p>${escapeHtml(item.description)}</p></div>`).join('') : '<p class="muted">No tournaments published.</p>';
} catch (e) { target.innerHTML = `<p class="form-error">${escapeHtml(e.message)}</p>`; }
