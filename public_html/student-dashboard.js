import { get, escapeHtml } from './services/api.js';
const render = (items, empty) => items.length ? items.map((item) => `<div class="feed-item"><strong>${escapeHtml(item.title || item.event_name || item.facility)}</strong><p class="muted">${escapeHtml(item.content || item.notes || `${item.booking_date} · ${item.start_time}`)}</p></div>`).join('') : `<p class="muted">${empty}</p>`;
async function loadPanel(selector, endpoint, empty) {
  const target = document.querySelector(selector);
  try {
    const { data } = await get(endpoint);
    target.innerHTML = render(data, empty);
  } catch (e) {
    target.textContent = e.message;
  }
}

await Promise.all([
  loadPanel('#announcements', 'announcements.php', 'No announcements yet.'),
  loadPanel('#bookings', 'bookings.php', 'No bookings yet.'),
]);
