import { get, escapeHtml } from './services/api.js';
const render = (items, empty) => items.length ? items.map((item) => `<div class="feed-item"><strong>${escapeHtml(item.title || item.event_name || item.facility)}</strong><p class="muted">${escapeHtml(item.content || item.notes || `${item.booking_date} · ${item.start_time}`)}</p></div>`).join('') : `<p class="muted">${empty}</p>`;
try {
  const [announcements, bookings] = await Promise.all([get('announcements.php'), get('bookings.php')]);
  document.querySelector('#announcements').innerHTML = render(announcements.data, 'No announcements yet.');
  document.querySelector('#bookings').innerHTML = render(bookings.data, 'No bookings yet.');
} catch (e) { document.querySelector('#announcements').textContent = e.message; }
