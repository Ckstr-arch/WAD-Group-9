import { get, put, escapeHtml } from './services/api.js';
const item = (entry, type) => `<div class="feed-item"><strong>${escapeHtml(type === 'booking' ? entry.facility : entry.club_name)}</strong><p class="muted">${escapeHtml(type === 'booking' ? `${entry.booking_date} · ${entry.start_time}` : entry.student_name)}</p><button class="btn btn-primary action" data-type="${type}" data-id="${entry.id}" data-status="${type === 'booking' ? 'confirmed' : 'approved'}">Approve</button></div>`;
async function loadPanel(selector, endpoint, type) {
  const target = document.querySelector(selector);
  try {
    const { data } = await get(endpoint);
    target.innerHTML = data.map((entry) => item(entry, type)).join('') || '<p class="muted">None.</p>';
    target.querySelectorAll('.action').forEach((button) => button.addEventListener('click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        const actionEndpoint = button.dataset.type === 'booking' ? 'bookings.php' : 'clubs.php';
        await put(actionEndpoint, { id: button.dataset.id, status: button.dataset.status });
        button.closest('.feed-item').remove();
      } catch (e) {
        alert(e.message);
      } finally {
        button.disabled = false;
      }
    }));
  } catch (e) {
    target.textContent = e.message;
  }
}

await Promise.all([
  loadPanel('#bookings', 'bookings.php?status=pending', 'booking'),
  loadPanel('#requests', 'clubs.php?view=requests', 'request'),
]);
