const API_BASE = 'backend/api';
const ADMIN_ROLES = new Set(['admin', 'sports_admin', 'super_admin']);

const els = {
  welcome: document.getElementById('admin-welcome'),
  meta: document.getElementById('admin-meta'),
  logoutBtn: document.getElementById('logout-btn'),
  navButtons: Array.from(document.querySelectorAll('.nav-item[data-target]')),
  sections: Array.from(document.querySelectorAll('.admin-section')),

  studentSearch: document.getElementById('student-search'),
  studentStatus: document.getElementById('student-status-filter'),
  refreshStudents: document.getElementById('refresh-students-btn'),
  studentsBody: document.getElementById('registered-students-body'),

  bookingStatus: document.getElementById('booking-status-filter'),
  refreshBookings: document.getElementById('refresh-bookings-btn'),
  bookingsBody: document.getElementById('bookings-approval-body'),

  clubRequestsBody: document.getElementById('club-requests-body'),
  createClubForm: document.getElementById('create-club-form'),
  clubName: document.getElementById('club-name'),
  clubSport: document.getElementById('club-sport'),
  clubPresident: document.getElementById('club-president'),
  clubDesc: document.getElementById('club-desc'),
  createClubStatus: document.getElementById('create-club-status'),

  announcementForm: document.getElementById('announcement-form'),
  announcementTitle: document.getElementById('announcement-title'),
  announcementText: document.getElementById('announcement-text'),
  announcementStatus: document.getElementById('announcement-status'),
  announcementsList: document.getElementById('announcements-list'),

  addInventoryForm: document.getElementById('add-inventory-form'),
  invItemName: document.getElementById('inv-item-name'),
  invTotalStock: document.getElementById('inv-total-stock'),
  inventoryStatus: document.getElementById('inventory-status'),
  inventoryContainer: document.getElementById('inventory-container'),
};

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}/${path}`, {
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text.trim() || `HTTP ${res.status}`);
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

function setActiveTab(targetId) {
  els.navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });
  els.sections.forEach((sec) => {
    const isTarget = sec.id === targetId;
    sec.hidden = !isTarget;
    sec.classList.toggle('active-section', isTarget);
  });
}

async function ensureAdminSession() {
  const session = await api('auth.php', { method: 'GET' });
  const user = session.user || {};
  if (!ADMIN_ROLES.has(String(user.role || '').toLowerCase())) {
    window.location.replace('student-dashboard.html');
    return null;
  }
  if (els.welcome && user.name) {
    els.welcome.textContent = `Welcome, ${user.name}`;
  }
  if (els.meta) {
    els.meta.textContent = `${user.email || ''} · Role: ${user.role || 'admin'}`;
  }
  return user;
}

async function loadStudents() {
  els.studentsBody.innerHTML = '<tr><td colspan="5" class="muted cell-center">Loading students...</td></tr>';
  try {
    const params = new URLSearchParams();
    const q = els.studentSearch?.value.trim() || '';
    const st = els.studentStatus?.value || '';
    if (q) params.set('search', q);
    if (st) params.set('status', st);

    const res = await api(`students.php${params.toString() ? `?${params}` : ''}`);
    const rows = Array.isArray(res.data) ? res.data : [];

    if (!rows.length) {
      els.studentsBody.innerHTML = '<tr><td colspan="5" class="muted cell-center">No matching student accounts found.</td></tr>';
      return;
    }

    els.studentsBody.innerHTML = rows.map((u) => {
      const active = Number(u.is_active ?? (u.status === 'approved' ? 1 : 0)) === 1;
      const badgeClass = active ? 'badge-active' : 'badge-inactive';
      const statusLabel = active ? 'active' : (u.status || 'inactive');
      return `
        <tr>
          <td>${esc(u.student_id || u.id)}</td>
          <td>${esc(u.name)}</td>
          <td>${esc(u.email)}</td>
          <td>${esc(u.role)}</td>
          <td><span class="badge ${badgeClass}">${esc(statusLabel)}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    els.studentsBody.innerHTML = `<tr><td colspan="5" class="form-error cell-center">${esc(err.message)}</td></tr>`;
  }
}

async function loadBookings() {
  els.bookingsBody.innerHTML = '<tr><td colspan="5" class="muted cell-center">Loading bookings...</td></tr>';
  try {
    const st = els.bookingStatus?.value || '';
    const qs = st ? `?status=${encodeURIComponent(st)}` : '';
    const res = await api(`bookings.php${qs}`);
    const rows = Array.isArray(res.data) ? res.data : [];

    if (!rows.length) {
      els.bookingsBody.innerHTML = '<tr><td colspan="5" class="muted cell-center">No facility bookings found.</td></tr>';
      return;
    }

    els.bookingsBody.innerHTML = rows.map((b) => {
      const status = String(b.status || 'pending');
      const badgeClass = status === 'confirmed' || status === 'approved' ? 'badge-confirmed'
        : status === 'cancelled' || status === 'rejected' ? 'badge-cancelled' : 'badge-pending';
      const facilityLabel = b.facility_name || b.facility || 'Facility';
      const sportSuffix = b.sport ? ` (${b.sport})` : '';
      const when = b.date_time || `${b.booking_date || ''} ${b.start_time || ''}`.trim();

      return `
        <tr>
          <td>${esc(b.student_name || b.booked_by_name || b.booked_by || '')}</td>
          <td>${esc(facilityLabel + sportSuffix)}</td>
          <td>${esc(when)}</td>
          <td><span class="badge ${badgeClass}">${esc(status)}</span></td>
          <td>
            <button type="button" class="btn-sm btn-approve" data-booking-id="${esc(b.id)}" data-status="confirmed">Confirm</button>
            <button type="button" class="btn-sm btn-reject" data-booking-id="${esc(b.id)}" data-status="cancelled">Cancel</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    els.bookingsBody.innerHTML = `<tr><td colspan="5" class="form-error cell-center">${esc(err.message)}</td></tr>`;
  }
}

async function loadClubRequests() {
  els.clubRequestsBody.innerHTML = '<tr><td colspan="3" class="muted cell-center">Loading club requests...</td></tr>';
  try {
    const res = await api('clubs.php?view=requests&status=pending');
    const rows = Array.isArray(res.data) ? res.data : [];

    if (!rows.length) {
      els.clubRequestsBody.innerHTML = '<tr><td colspan="3" class="muted cell-center">No pending club requests.</td></tr>';
      return;
    }

    els.clubRequestsBody.innerHTML = rows.map((r) => `
      <tr>
        <td>${esc(r.student_name)}</td>
        <td>${esc(r.club_name)}</td>
        <td>
          <button type="button" class="btn-sm btn-approve" data-req-id="${esc(r.id)}" data-status="approved">Approve</button>
          <button type="button" class="btn-sm btn-reject" data-req-id="${esc(r.id)}" data-status="rejected">Reject</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    els.clubRequestsBody.innerHTML = `<tr><td colspan="3" class="muted cell-center">${esc(err.message)}</td></tr>`;
  }
}

async function loadAnnouncements() {
  if (!els.announcementsList) return;
  try {
    const res = await api('announcements.php?limit=10');
    const rows = Array.isArray(res.data) ? res.data : [];
    if (!rows.length) {
      els.announcementsList.innerHTML = '<p class="muted">No announcements published yet.</p>';
      return;
    }
    els.announcementsList.innerHTML = rows.map((a) => `
      <div class="feed-item">
        <strong>${esc(a.title)}</strong>
        <p>${esc(a.content)}</p>
        <small class="muted">By ${esc(a.posted_by_name || 'Admin')} · ${esc(a.created_at || '')}</small>
      </div>
    `).join('');
  } catch (err) {
    els.announcementsList.innerHTML = `<p class="muted">${esc(err.message)}</p>`;
  }
}

async function loadInventory() {
  els.inventoryContainer.innerHTML = '<div class="feed-item"><p class="muted">Loading inventory...</p></div>';
  try {
    const res = await api('inventory.php');
    const items = Array.isArray(res.data) ? res.data : [];
    if (!items.length) {
      els.inventoryContainer.innerHTML = '<div class="feed-item"><p class="muted">No inventory items yet. Add one above.</p></div>';
      return;
    }

    els.inventoryContainer.innerHTML = items.map((item) => {
      const total = Number(item.total_stock ?? item.total ?? 0);
      const issued = Number(item.issued_count ?? 0);
      const avail = Math.max(0, total - issued);
      return `
        <div class="inv-row" data-inv-id="${esc(item.id)}">
          <div>
            <strong>${esc(item.item_name || item.name)}</strong>
            <div class="muted">Available: <strong>${avail}</strong> / ${total}</div>
          </div>
          <div class="inv-controls">
            <label class="muted">Total: <input type="number" min="0" class="inv-total" value="${total}"></label>
            <label class="muted">Issued: <input type="number" min="0" class="inv-issued" value="${issued}"></label>
            <button type="button" class="btn-sm btn-approve inv-save">Save</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    els.inventoryContainer.innerHTML = `<div class="feed-item"><p class="form-error">${esc(err.message)}</p></div>`;
  }
}

function bindEvents() {
  els.navButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.target));
  });

  els.logoutBtn?.addEventListener('click', async () => {
    try {
      await api('auth.php?action=logout', { method: 'POST' });
    } finally {
      window.location.replace('index.html');
    }
  });

  els.refreshStudents?.addEventListener('click', loadStudents);
  els.studentStatus?.addEventListener('change', loadStudents);
  els.studentSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadStudents();
  });

  els.refreshBookings?.addEventListener('click', loadBookings);
  els.bookingStatus?.addEventListener('change', loadBookings);

  els.bookingsBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-booking-id]');
    if (!btn) return;
    btn.disabled = true;
    try {
      await api('bookings.php', {
        method: 'PUT',
        body: JSON.stringify({ id: Number(btn.dataset.bookingId), status: btn.dataset.status }),
      });
      await loadBookings();
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
    }
  });

  els.clubRequestsBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-req-id]');
    if (!btn) return;
    btn.disabled = true;
    try {
      await api('clubs.php', {
        method: 'PUT',
        body: JSON.stringify({ id: Number(btn.dataset.reqId), status: btn.dataset.status }),
      });
      await loadClubRequests();
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
    }
  });

  els.createClubForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.createClubStatus.textContent = 'Saving club...';
    try {
      await api('clubs.php', {
        method: 'POST',
        body: JSON.stringify({
          name: els.clubName.value.trim(),
          sport: els.clubSport.value.trim(),
          president: els.clubPresident.value.trim(),
          description: els.clubDesc.value.trim(),
        }),
      });
      els.createClubForm.reset();
      els.createClubStatus.textContent = 'Club saved to database.';
    } catch (err) {
      els.createClubStatus.textContent = err.message;
    }
  });

  els.announcementForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.announcementStatus.textContent = 'Publishing...';
    try {
      await api('announcements.php', {
        method: 'POST',
        body: JSON.stringify({
          title: els.announcementTitle.value.trim(),
          content: els.announcementText.value.trim(),
        }),
      });
      els.announcementForm.reset();
      els.announcementStatus.textContent = 'Announcement published.';
      await loadAnnouncements();
    } catch (err) {
      els.announcementStatus.textContent = err.message;
    }
  });

  els.addInventoryForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.inventoryStatus.textContent = 'Adding item...';
    try {
      await api('inventory.php', {
        method: 'POST',
        body: JSON.stringify({
          item_name: els.invItemName.value.trim(),
          total_stock: Number(els.invTotalStock.value),
        }),
      });
      els.addInventoryForm.reset();
      els.inventoryStatus.textContent = 'Inventory item added.';
      await loadInventory();
    } catch (err) {
      els.inventoryStatus.textContent = err.message;
    }
  });

  els.inventoryContainer?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.inv-save');
    if (!btn) return;
    const row = btn.closest('.inv-row');
    const id = Number(row?.dataset.invId);
    const totalStock = Number(row?.querySelector('.inv-total')?.value);
    const issuedCount = Number(row?.querySelector('.inv-issued')?.value);
    btn.disabled = true;
    try {
      await api('inventory.php', {
        method: 'PUT',
        body: JSON.stringify({ id, total_stock: totalStock, issued_count: issuedCount }),
      });
      els.inventoryStatus.textContent = 'Inventory updated.';
      await loadInventory();
    } catch (err) {
      els.inventoryStatus.textContent = err.message;
      btn.disabled = false;
    }
  });
}

(async function init() {
  bindEvents();
  const user = await ensureAdminSession();
  if (!user) return;
  await Promise.all([
    loadStudents(),
    loadBookings(),
    loadClubRequests(),
    loadAnnouncements(),
    loadInventory(),
  ]);
})();