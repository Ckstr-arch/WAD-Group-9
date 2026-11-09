import { get, post, escapeHtml } from './services/api.js';
const list = document.querySelector('#club-list');
try {
  const { data } = await get('clubs.php');
  list.innerHTML = data.map((club) => `<article class="card"><h2>${escapeHtml(club.name)}</h2><p class="muted">${escapeHtml(club.description)}</p><small>${escapeHtml(club.member_count)} members</small><button class="btn btn-primary join" data-id="${club.id}" ${club.my_status === 'approved' || club.my_status === 'pending' ? 'disabled' : ''}>${club.my_status === 'approved' ? 'Member' : club.my_status === 'pending' ? 'Request pending' : 'Join club'}</button></article>`).join('');
  list.addEventListener('click', async (event) => {
    const button = event.target.closest('.join');
    if (!button) return;
    button.disabled = true;
    try { await post('clubs.php', { club_id: button.dataset.id }); button.textContent = 'Request pending'; } catch (e) { button.disabled = false; alert(e.message); }
  });
} catch (e) { document.querySelector('#club-error').textContent = e.message; }
