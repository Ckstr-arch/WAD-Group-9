/* true = fake data from mock-api.js, false = real PHP backend */
const USE_MOCK = true;

const API_BASE = 'backend/api';
const USER_KEY = 'sportshub_user';
const ADMIN_ROLES = ['admin', 'sports_admin', 'super_admin'];

const els = {
  tournament: document.getElementById('tournament-filter'),
  sport: document.getElementById('sport-filter'),
  state: document.getElementById('state'),
  list: document.getElementById('results-list'),
  hint: document.getElementById('standings-hint'),
  table: document.getElementById('standings-table'),
  body: document.getElementById('standings-body'),
  adminPanel: document.getElementById('admin-panel'),
  form: document.getElementById('result-form'),
  fTournament: document.getElementById('f-tournament'),
  fRound: document.getElementById('f-round'),
  fTeamA: document.getElementById('f-team-a'),
  fTeamB: document.getElementById('f-team-b'),
  fScoreA: document.getElementById('f-score-a'),
  fScoreB: document.getElementById('f-score-b'),
  fDate: document.getElementById('f-date'),
  toast: document.getElementById('toast'),
};

let tournaments = [];
let toastTimer = null;

function getUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* Mock mode: open result.html?admin=1 to see the admin form */
const isAdmin = USE_MOCK
  ? Boolean(window.MOCK_ADMIN)
  : ADMIN_ROLES.includes(String(getUser()?.role || '').toLowerCase());

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

function renderResults(results) {
  if (!results.length) {
    els.list.innerHTML = '<p class="muted">No results recorded yet.</p>';
    return;
  }
  els.list.innerHTML = results
    .map((m) => {
      const aWin = m.score_a > m.score_b;
      const bWin = m.score_b > m.score_a;
      const sub = [m.tournament_name, m.round_label, formatDate(m.played_on)].filter(Boolean).map(esc).join(' · ');
      return `
        <div class="match-row">
          <div class="match-main">
            <span class="team ${aWin ? 'win' : ''}">${esc(m.team_a)}</span>
            <span class="score">${m.score_a} – ${m.score_b}</span>
            <span class="team right ${bWin ? 'win' : ''}">${esc(m.team_b)}</span>
          </div>
          <div class="match-sub">${sub}</div>
          ${isAdmin ? `<button class="row-delete" data-id="${m.id}" type="button">Delete</button>` : ''}
        </div>`;
    })
    .join('');
}

function renderStandings(standings, tournamentSelected) {
  if (!tournamentSelected) {
    els.table.hidden = true;
    els.hint.textContent = 'Select a tournament to see its standings.';
    return;
  }
  if (!standings.length) {
    els.table.hidden = true;
    els.hint.textContent = 'No standings yet. Results will appear here once matches are recorded.';
    return;
  }
  els.hint.textContent = 'Win = 3 pts, draw = 1 pt, loss = 0.';
  els.table.hidden = false;
  els.body.innerHTML = standings
    .map(
      (s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(s.team)}</td>
        <td>${s.played}</td><td>${s.won}</td><td>${s.drawn}</td><td>${s.lost}</td>
        <td>${s.gd > 0 ? '+' : ''}${s.gd}</td>
        <td>${s.points}</td>
      </tr>`
    )
    .join('');
}

async function loadResults() {
  const params = new URLSearchParams();
  if (els.tournament.value) params.set('tournament_id', els.tournament.value);
  if (els.sport.value) params.set('sport', els.sport.value);

  setState('Loading results…');
  try {
    const res = await api(`results.php?${params.toString()}`);
    setState('');
    renderResults(res.data.results || []);
    renderStandings(res.data.standings || [], Boolean(els.tournament.value));
  } catch (err) {
    els.list.innerHTML = '';
    renderStandings([], Boolean(els.tournament.value));
    setState(err.message, true);
  }
}

function populateFilters() {
  els.tournament.innerHTML =
    '<option value="">All tournaments</option>' +
    tournaments.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('');

  const sports = [...new Set(tournaments.map((t) => t.sport))].sort();
  els.sport.innerHTML =
    '<option value="">All sports</option>' + sports.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');

  els.fTournament.innerHTML =
    '<option value="">Select tournament</option>' +
    tournaments.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
}

async function init() {
  if (isAdmin) {
    els.adminPanel.hidden = false;
    els.fDate.value = new Date().toLocaleDateString('en-CA');
  }
  try {
    const res = await api('tournaments.php');
    tournaments = Array.isArray(res.data) ? res.data : [];
    populateFilters();
  } catch (err) {
    setState(err.message, true);
    return;
  }
  loadResults();
}

els.tournament.addEventListener('change', loadResults);
els.sport.addEventListener('change', loadResults);

els.list.addEventListener('click', async (e) => {
  const btn = e.target.closest('.row-delete');
  if (!btn) return;
  if (!confirm('Delete this result?')) return;
  try {
    const res = await api(`results.php?id=${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
    showToast(res.message || 'Result deleted.');
    loadResults();
  } catch (err) {
    showToast(err.message, true);
  }
});

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = els.form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const res = await api('results.php', {
      method: 'POST',
      body: JSON.stringify({
        tournament_id: Number(els.fTournament.value),
        round_label: els.fRound.value.trim(),
        team_a: els.fTeamA.value.trim(),
        team_b: els.fTeamB.value.trim(),
        score_a: Number(els.fScoreA.value),
        score_b: Number(els.fScoreB.value),
        played_on: els.fDate.value,
      }),
    });
    showToast(res.message || 'Result recorded.');
    els.fTeamA.value = '';
    els.fTeamB.value = '';
    els.fScoreA.value = '';
    els.fScoreB.value = '';
    loadResults();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    submitBtn.disabled = false;
  }
});

init();