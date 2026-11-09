import { get, put, escapeHtml } from './services/api.js';
const item = (entry, type) => `<div class="feed-item"><strong>${escapeHtml(type === 'booking' ? entry.facility : entry.club_name)}</strong><p class="muted">${escapeHtml(type === 'booking' ? `${entry.booking_date} · ${entry.start_time}` : entry.student_name)}</p><button class="btn btn-primary action" data-type="${type}" data-id="${entry.id}" data-status="${type === 'booking' ? 'confirmed' : 'approved'}">Approve</button></div>`;
try {
  const [bookings, requests] = await Promise.all([get('bookings.php?status=pending'), get('clubs.php?view=requests')]);
  document.querySelector('#bookings').innerHTML = bookings.data.map((x) => item(x, 'booking')).join('') || '<p class="muted">None.</p>';
  document.querySelector('#requests').innerHTML = requests.data.map((x) => item(x, 'request')).join('') || '<p class="muted">None.</p>';
  document.querySelectorAll('.action').forEach((button) => button.addEventListener('click', async () => {
    const endpoint = button.dataset.type === 'booking' ? 'bookings.php' : 'clubs.php';
    await put(endpoint, { id: button.dataset.id, status: button.dataset.status });
    button.closest('.feed-item').remove();
  }));
} catch (e) { document.querySelector('#bookings').textContent = e.message; }
