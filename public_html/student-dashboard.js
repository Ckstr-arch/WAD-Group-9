const SESSION_STORAGE_KEY = 'sportshub_user';

let resolvedApiBase = null;
let currentUser = null;

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  try {
    if (user && typeof user === 'object' && user.id) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore storage errors
  }
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function resolveApiBase() {
  if (resolvedApiBase) return resolvedApiBase;
  for (const candidate of ['backend/api', 'api']) {
    try {
      const res = await fetch(`${candidate}/auth.php`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const text = await res.text();
      JSON.parse(text);
      resolvedApiBase = candidate;
      return resolvedApiBase;
    } catch {
      // try next candidate
    }
  }
  resolvedApiBase = 'backend/api';
  return resolvedApiBase;
}

async function apiRequest(endpoint, options = {}) {
  const base = await resolveApiBase();
  const activeUser = currentUser || readStoredUser();
  const authHeaders = {};
  if (activeUser?.id) authHeaders['X-User-Id'] = String(activeUser.id);
  if (activeUser?.role) authHeaders['X-User-Role'] = String(activeUser.role);

  const res = await fetch(`${base}/${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from ${base}/${endpoint} (HTTP ${res.status})`);
  }

  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data;
}

function extractUser(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.user?.id) return payload.user;
  if (payload.data?.user?.id) return payload.data.user;
  if (payload.data?.id) return payload.data;
  if (payload.id) return payload;
  return null;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

document.addEventListener('DOMContentLoaded', async () => {
  const welcomeMsg = document.getElementById('welcome-msg');
  const clubsContainer = document.getElementById('clubs-container');
  const bookingsContainer = document.getElementById('bookings-container');
  const feedContainer = document.getElementById('feed-container');
  const bookBtn = document.getElementById('book-btn');
  const logoutBtn = document.getElementById('logout-btn');

  currentUser = readStoredUser();

  try {
    const sessionRes = await apiRequest('auth.php', { method: 'GET' });
    const serverUser = extractUser(sessionRes);
    if (serverUser?.id) {
      currentUser = serverUser;
      writeStoredUser(serverUser);
    }
  } catch {
    // keep stored user if session check fails
  }

  if (welcomeMsg && currentUser?.name) {
    welcomeMsg.textContent = `Welcome back, ${currentUser.name}`;
  }

  // 1. Load only clubs the student has joined or requested from DB
  if (clubsContainer) {
    try {
      const clubsRes = await apiRequest('clubs.php?view=joined', { method: 'GET' });
      const clubs = extractList(clubsRes);
      if (!clubs.length) {
        clubsContainer.innerHTML = '<p class="muted">You have not joined or requested any clubs yet.</p>';
      } else {
        clubsContainer.innerHTML = clubs
          .map((c) => {
            const name = c.club_name || c.name || 'Sports Club';
            const rawStatus = String(c.my_status || c.membership_status || c.status || 'pending').toLowerCase();
            const label = rawStatus === 'approved' ? 'Active Member' : rawStatus === 'pending' ? 'Pending Approval' : rawStatus;
            const badgeClass = rawStatus === 'approved' ? 'badge-success' : 'badge';
            return `<p class="muted"><strong>${esc(name)}</strong> · <span class="badge ${badgeClass}">${esc(label)}</span></p>`;
          })
          .join('');
      }
    } catch (err) {
      console.error('Clubs load error:', err);
      clubsContainer.innerHTML = '<p class="muted">Unable to load clubs right now.</p>';
    }
  }

  // 2. Load student bookings from DB
  if (bookingsContainer) {
    try {
      const bookingsRes = await apiRequest('bookings.php', { method: 'GET' });
      const bookings = extractList(bookingsRes);
      if (!bookings.length) {
        bookingsContainer.innerHTML = '<p class="muted">No facility reservations found for this week.</p>';
      } else {
        bookingsContainer.innerHTML = bookings
          .slice(0, 5)
          .map((b) => {
            const fac = b.facility_name || b.facility || 'Facility';
            const date = b.booking_date || b.date || '';
            const start = b.start_time || b.start || '';
            const end = b.end_time || b.end || '';
            const timeStr = [start, end].filter(Boolean).join(' - ');
            const status = b.status || 'pending';
            return `<p class="muted"><strong>${esc(fac)}</strong> · ${esc(date)} ${esc(timeStr)} (${esc(status)})</p>`;
          })
          .join('');
      }
    } catch (err) {
      console.error('Bookings load error:', err);
      bookingsContainer.innerHTML = '<p class="muted">Unable to load bookings right now.</p>';
    }
  }

  // 3. Load announcements feed from DB
  if (feedContainer) {
    try {
      const annRes = await apiRequest('announcements.php?limit=10', { method: 'GET' });
      const items = extractList(annRes);
      if (!items.length) {
        feedContainer.innerHTML = '<div class="feed-item"><p class="muted">No announcements posted yet.</p></div>';
      } else {
        feedContainer.innerHTML = items
          .map((a) => {
            const title = a.title || 'Announcement';
            const body = a.content || a.body || '';
            return `<div class="feed-item"><strong>${esc(title)}</strong><p class="muted">${esc(body)}</p></div>`;
          })
          .join('');
      }
    } catch (err) {
      console.error('Announcements load error:', err);
      feedContainer.innerHTML = '<div class="feed-item"><p class="muted">Unable to load announcements right now.</p></div>';
    }
  }

  bookBtn?.addEventListener('click', () => {
    window.location.href = 'book-facilities.html#bookingSection';
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('auth.php?action=logout', { method: 'POST' });
    } catch {
      // ignore logout network errors
    } finally {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
      window.location.href = 'index.html';
    }
  });
});