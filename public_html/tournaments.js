/* true = fake data from mock-api.js, false = real PHP backend */
const USE_MOCK = true;

const API_BASE = 'backend/api';
const USER_KEY = 'sportshub_user';

const STATUS_LABELS = {
  registration_open: 'Registration open',
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const STATUS_CLASS = {
  registration_open: 'badge-open',
  upcoming: 'badge-upcoming',
  ongoing: 'badge-ongoing',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

const els = {
  grid: document.getElementById('t-grid'),
  state: document.getElementById('state'),
  search: document.getElementById('search'),
  status: document.getElementById('status-filter'),
  sport: document.getElementById('sport-filter'),
  dialog: document.getElementById('register-dialog'),
  form: document.getElementById('register-form'),
  title: document.getElementById('register-title'),
  team: document.getElementById('team-name'),
  cancel: document.getElementById('register-cancel'),
  toast: document.getElementById('toast'),
};

let tournaments = [];
let pendingId = null;
let toastTimer = null;

function getUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle('error', isError);
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2800);
}

function setState(message, isError = false) {
  els.state.hidden = !message;
  els.state.textContent = message || '';
  els.state.classList.toggle('error', isError);
}

async function api(endpoint, options = {}) {
  if (USE_MOCK) {
    if (typeof window.mockApi !== 'function') {
      throw new Error('mock-api.js is not loaded.');
    }
    return window.mockApi(endpoint, options);
  }

  const user = getUser();
  const headers = { Accept: 'application/json' };
  if (user?.id) headers['X-User-Id'] = String(user.id);
  if (options.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}/${endpoint}`, { credentials: 'include', ...options, headers });
  const text = await res.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned invalid data (HTTP ${res.status}).`);
  }

  if (res.status === 401) {
    window.location.assign('login.html');
    throw new Error('Please sign in again.');
  }
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

function matchesFilters(t) {
  const q = els.search.value.trim().toLowerCase();
  if (els.status.value && t.status !== els.status.value) return false;
  if (els.sport.value && t.sport !== els.sport.value) return false;
  if (q && !`${t.name} ${t.sport} ${t.format}`.toLowerCase().includes(q)) return false;
  return true;
}

function actionButton(t) {
  if (t.is_registered) {
    const canWithdraw = t.status === 'registration_open' || t.status === 'upcoming';
    return canWithdraw
      ? `<button class="btn btn-outline" data-action="withdraw" data-id="${t.id}">Withdraw</button>`
      : '<span class="badge badge-registered">Registered</span>';
  }
  if (t.status !== 'registration_open') return '<button class="btn btn-outline" disabled>Closed</button>';
  if (t.spots_left <= 0) return '<button class="btn btn-outline" disabled>Full</button>';
  return `<button class="btn btn-primary" data-action="register" data-id="${t.id}">Register</button>`;
}

function render() {
  const list = tournaments.filter(matchesFilters);
  if (!list.length) {
    els.grid.innerHTML = '';
    setState(tournaments.length ? 'No tournaments match your filters.' : 'No tournaments have been published yet.');
    return;
  }
  setState('');

  els.grid.innerHTML = list
    .map((t) => {
      const pct = t.max_teams ? Math.min(100, Math.round((t.registered_teams / t.max_teams) * 100)) : 0;
      return `
        <article class="card t-card">
          <div class="t-head">
            <h3>${esc(t.name)}</h3>
            <span class="badge ${STATUS_CLASS[t.status] || 'badge-sport'}">${esc(STATUS_LABELS[t.status] || t.status)}</span>
          </div>
          <div class="t-meta">
            <span><span class="badge badge-sport">${esc(t.sport)}</span></span>
            <span>${esc(formatDate(t.start_date))} – ${esc(formatDate(t.end_date))}</span>
            <span>Format: ${esc(t.format)}</span>
          </div>
          <p class="t-desc">${esc(t.description)}</p>
          <div>
            <div class="progress"><span style="width:${pct}%"></span></div>
            <div class="progress-label">
              <span>${t.registered_teams} / ${t.max_teams} teams</span>
              <span>${t.spots_left} spots left</span>
            </div>
          </div>
          <div class="t-actions">${actionButton(t)}</div>
        </article>`;
    })
    .join('');
}

function populateSports() {
  const current = els.sport.value;
  const sports = [...new Set(tournaments.map((t) => t.sport))].sort();
  els.sport.innerHTML =
    '<option value="">All sports</option>' + sports.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  els.sport.value = sports.includes(current) ? current : '';
}

async function load() {
  setState('Loading tournaments…');
  try {
    const res = await api('tournaments.php');
    tournaments = Array.isArray(res.data) ? res.data : [];
    populateSports();
    render();
  } catch (err) {
    els.grid.innerHTML = '';
    setState(err.message, true);
  }
}

async function withdraw(id) {
  if (!confirm('Withdraw your registration from this tournament?')) return;
  try {
    const res = await api(`tournaments.php?tournament_id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    showToast(res.message || 'Registration withdrawn.');
    load();
  } catch (err) {
    showToast(err.message, true);
  }
}

els.grid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn || btn.disabled) return;
  const id = Number(btn.dataset.id);

  if (btn.dataset.action === 'withdraw') {
    withdraw(id);
    return;
  }
  const t = tournaments.find((x) => x.id === id);
  if (!t) return;
  pendingId = id;
  els.title.textContent = `Register for ${t.name}`;
  els.team.value = '';
  els.dialog.showModal();
});

els.cancel.addEventListener('click', () => els.dialog.close());

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (pendingId === null) return;
  const submitBtn = els.form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const res = await api('tournaments.php', {
      method: 'POST',
      body: JSON.stringify({ tournament_id: pendingId, team_name: els.team.value.trim() }),
    });
    els.dialog.close();
    showToast(res.message || 'Registered successfully.');
    load();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    submitBtn.disabled = false;
    pendingId = null;
  }
});

[els.search, els.status, els.sport].forEach((el) => el.addEventListener('input', render));

load();