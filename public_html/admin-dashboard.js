/* ============================================================
 * admin-dashboard.js
 * NSBM Sports Admin Dashboard — Client Logic
 * ============================================================ */

(function () {
    'use strict';

    /* --------------------------------------------------------
     * 1. STATE & CONFIG
     * ------------------------------------------------------ */
    const state = {
        currentAdminUser: null,
        currentSection: 'dashboard',
        students: [],
        studentsLoaded: false,
        clubs: [],
        bookings: [],
        announcements: [],
        filters: {
            students: { search: '', status: '' },
            clubs: { search: '', status: '' },
            bookings: { search: '', status: '' }
        }
    };

    const API = {
        auth: 'api/auth.php',
        dashboard: 'api/dashboard.php',
        students: 'api/students.php',
        clubs: 'api/clubs.php',
        bookings: 'api/bookings.php',
        announcements: 'api/announcements.php',
        profile: 'api/profile.php'
    };

    /* --------------------------------------------------------
     * 2. UTILITIES
     * ------------------------------------------------------ */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('en-GB', {
                year: 'numeric', month: 'short', day: '2-digit'
            });
        } catch (_) {
            return '—';
        }
    }

    function formatDateTime(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleString('en-GB', {
                year: 'numeric', month: 'short', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (_) {
            return '—';
        }
    }

    function roleLabel(role) {
        const map = {
            student: 'Student',
            club_manager: 'Club Manager',
            sports_admin: 'Sports Admin',
            admin: 'Admin',
            super_admin: 'Super Admin'
        };
        return map[role] || (role || 'User');
    }

    function statusBadge(isActive) {
        if (isActive) {
            return '<span class="badge badge-active">Active</span>';
        }
        return '<span class="badge badge-inactive">Inactive</span>';
    }

    /* --------------------------------------------------------
     * 3. NETWORKING (45s default timeout)
     * ------------------------------------------------------ */
    async function fetchWithTimeout(url, options = {}, timeout = 45000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                credentials: 'same-origin'
            });
            clearTimeout(timer);
            return response;
        } catch (error) {
            clearTimeout(timer);
            if (error.name === 'AbortError') {
                const err = new Error('Request timed out');
                err.isTimeout = true;
                throw err;
            }
            throw error;
        }
    }

    async function apiRequest(url, options = {}) {
        const res = await fetchWithTimeout(url, options);
        let data = null;
        const text = await res.text();
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (_) {
                data = null;
            }
        }
        return { ok: res.ok, status: res.status, data };
    }

    async function apiJson(url, method = 'GET', body = null) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        };
        if (body !== null && body !== undefined) {
            opts.body = JSON.stringify(body);
        }
        return apiRequest(url, opts);
    }

    /* --------------------------------------------------------
     * 4. TOAST NOTIFICATIONS
     * ------------------------------------------------------ */
    function getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText =
                'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:360px;';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'info', duration = 4000) {
        const container = getToastContainer();
        const toast = document.createElement('div');
        const colors = {
            success: { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
            error: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
            warning: { bg: '#fef9c3', border: '#ca8a04', text: '#854d0e' },
            info: { bg: '#dbeafe', border: '#1d63b8', text: '#1e3a8a' }
        };
        const c = colors[type] || colors.info;
        toast.style.cssText = `
            background:${c.bg};border-left:4px solid ${c.border};color:${c.text};
            padding:12px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);
            font-size:0.9rem;font-weight:600;opacity:0;transform:translateX(20px);
            transition:opacity 0.25s ease, transform 0.25s ease;
        `;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /* --------------------------------------------------------
     * 5. MODAL HELPERS
     * ------------------------------------------------------ */
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /* --------------------------------------------------------
     * 6. SESSION / AUTH
     * ------------------------------------------------------ */
    async function loadCurrentUser() {
        try {
            const { ok, data } = await apiJson(API.auth, 'GET');
            if (ok && data && data.success && data.data) {
                state.currentAdminUser = data.data;
                renderUserBadge();
                return true;
            }
        } catch (_) { /* swallow */ }
        window.location.href = 'login.html';
        return false;
    }

    function renderUserBadge() {
        const user = state.currentAdminUser;
        if (!user) return;
        const badge = document.getElementById('user-badge');
        if (badge) {
            const initials = user.avatar_initials || (user.name || 'AD').slice(0, 2).toUpperCase();
            badge.innerHTML = `
                <span class="avatar-circle">${escapeHtml(initials)}</span>
                <div>
                    <div style="font-weight:700;font-size:0.9rem;">${escapeHtml(user.name || 'Admin')}</div>
                    <div style="font-size:0.78rem;color:var(--admin-muted);">${escapeHtml(roleLabel(user.role))}</div>
                </div>
            `;
        }
    }

    async function logout() {
        try {
            await apiJson(API.auth, 'POST', { action: 'logout' });
        } catch (_) { /* ignore */ }
        window.location.href = 'login.html';
    }

    /* --------------------------------------------------------
     * 7. NAVIGATION
     * ------------------------------------------------------ */
    function switchSection(sectionId) {
        state.currentSection = sectionId;
        document.querySelectorAll('.nav-item[data-section]').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });
        document.querySelectorAll('.admin-section').forEach((sec) => {
            if (sec.id === 'section-' + sectionId) {
                sec.removeAttribute('hidden');
            } else {
                sec.setAttribute('hidden', '');
            }
        });

        switch (sectionId) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'students':
                loadStudents();
                break;
            case 'clubs':
                loadClubs();
                break;
            case 'bookings':
                loadBookings();
                break;
            case 'announcements':
                loadAnnouncements();
                break;
            case 'profile':
                loadProfile();
                break;
        }
    }

    function bindNavigation() {
        document.querySelectorAll('.nav-item[data-section]').forEach((btn) => {
            btn.addEventListener('click', () => switchSection(btn.dataset.section));
        });
        const signout = document.querySelector('.nav-signout');
        if (signout) {
            signout.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }

    /* --------------------------------------------------------
     * 8. DASHBOARD OVERVIEW
     * ------------------------------------------------------ */
    async function loadDashboard() {
        const grid = document.getElementById('stats-grid');
        if (!grid) return;
        grid.innerHTML = '<p class="muted">Loading overview…</p>';
        try {
            const { ok, data } = await apiJson(API.dashboard, 'GET');
            if (!ok || !data || !data.success) {
                grid.innerHTML = '<p class="muted">Unable to load dashboard stats.</p>';
                return;
            }
            const s = data.data || {};
            grid.innerHTML = `
                <div class="card">
                    <span class="eyebrow">Total Students</span>
                    <h2>${escapeHtml(s.total_students ?? 0)}</h2>
                    <p class="muted">Registered student accounts</p>
                </div>
                <div class="card">
                    <span class="eyebrow">Active Clubs</span>
                    <h2>${escapeHtml(s.active_clubs ?? 0)}</h2>
                    <p class="muted">Approved clubs on campus</p>
                </div>
                <div class="card">
                    <span class="eyebrow">Bookings Today</span>
                    <h2>${escapeHtml(s.bookings_today ?? 0)}</h2>
                    <p class="muted">Facility reservations</p>
                </div>
                <div class="card">
                    <span class="eyebrow">Pending Requests</span>
                    <h2>${escapeHtml(s.pending_requests ?? 0)}</h2>
                    <p class="muted">Awaiting admin review</p>
                </div>
            `;
        } catch (err) {
            grid.innerHTML = '<p class="muted">Network error while loading dashboard.</p>';
        }
    }

    /* --------------------------------------------------------
     * 9. STUDENTS MODULE
     * ------------------------------------------------------ */
    async function loadStudents() {
        const tbody = document.getElementById('students-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Loading students…</td></tr>';

        const { search, status } = state.filters.students;
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        const url = API.students + (params.toString() ? '?' + params.toString() : '');

        try {
            const { ok, data } = await apiJson(url, 'GET');
            if (!ok || !data || !data.success) {
                tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Unable to load students.</td></tr>';
                return;
            }
            state.students = data.data || [];
            state.studentsLoaded = true;
            renderStudentsTable();
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Network error.</td></tr>';
        }
    }

    function isProtectedAccount(row) {
        const studentId = (row.student_id || '').toString().toUpperCase();
        const email = (row.email || '').toString().toLowerCase();
        const isPrimaryAdmin = studentId === 'ADMIN001' || email === 'admin@nsbmsport.ac.lk';
        const isSelf = state.currentAdminUser && row.id === state.currentAdminUser.id;
        return isPrimaryAdmin || isSelf;
    }

    function renderStudentsTable() {
        const tbody = document.getElementById('students-tbody');
        if (!tbody) return;

        if (!state.students.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">No students match your filters.</td></tr>';
            return;
        }

        tbody.innerHTML = state.students.map((row) => {
            const protected_ = isProtectedAccount(row);
            const actions = protected_
                ? '<span class="badge badge-inactive">Protected</span>'
                : `<button class="btn btn-sm btn-reject" data-action="delete" data-id="${row.id}">Delete</button>
                   <button class="btn btn-sm btn-approve" data-action="edit" data-id="${row.id}" style="margin-left:6px;">Edit</button>`;

            return `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span class="avatar-circle">${escapeHtml(row.avatar_initials || 'ST')}</span>
                            <div>
                                <div style="font-weight:600;">${escapeHtml(row.name || '')}</div>
                                <div class="muted" style="font-size:0.8rem;">${escapeHtml(row.student_id || '')}</div>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(row.email || '')}</td>
                    <td>${escapeHtml(row.faculty || '—')}</td>
                    <td>${escapeHtml(row.batch_number || '—')}</td>
                    <td>${escapeHtml(roleLabel(row.role))}</td>
                    <td>${statusBadge(row.is_active)}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');
    }

    function bindStudentsToolbar() {
        const searchInput = document.getElementById('students-search');
        const statusSelect = document.getElementById('students-status');
        const addBtn = document.getElementById('btn-add-student');
        const form = document.getElementById('student-form');

        if (searchInput) {
            let timer;
            searchInput.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    state.filters.students.search = searchInput.value.trim();
                    loadStudents();
                }, 300);
            });
        }
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                state.filters.students.status = statusSelect.value;
                loadStudents();
            });
        }
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                resetStudentForm();
                openModal('student-modal');
            });
        }
        if (form) {
            form.addEventListener('submit', handleStudentFormSubmit);
        }
    }

    function resetStudentForm() {
        const form = document.getElementById('student-form');
        if (!form) return;
        form.reset();
        const idField = form.querySelector('[name="id"]');
        if (idField) idField.value = '';
        const status = document.getElementById('student-form-status');
        if (status) status.textContent = '';
        const title = document.getElementById('student-modal-title');
        if (title) title.textContent = 'Register New Student';
    }

    async function handleStudentFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const status = document.getElementById('student-form-status');
        if (status) status.textContent = '';

        const formData = new FormData(form);
        const payload = {
            id: formData.get('id') ? Number(formData.get('id')) : null,
            name: (formData.get('name') || '').toString().trim(),
            student_id: (formData.get('student_id') || '').toString().trim(),
            email: (formData.get('email') || '').toString().trim(),
            faculty: (formData.get('faculty') || '').toString().trim(),
            batch_number: (formData.get('batch_number') || '').toString().trim(),
            role: (formData.get('role') || 'student').toString(),
            password: (formData.get('password') || '').toString(),
            is_active: formData.get('is_active') === 'on' || formData.get('is_active') === '1'
        };

        if (!payload.name || !payload.student_id || !payload.email) {
            if (status) status.textContent = 'Name, student number, and email are required.';
            return;
        }
        if (!payload.id && !payload.password) {
            if (status) status.textContent = 'Password is required for new students.';
            return;
        }

        const method = payload.id ? 'PUT' : 'POST';
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        if (status) status.textContent = 'Saving…';

        try {
            const { ok, data } = await apiJson(API.students, method, payload);
            if (ok && data && data.success) {
                showToast(payload.id ? 'Student updated.' : 'Student registered.', 'success');
                closeModal('student-modal');
                await loadStudents();
            } else {
                const msg = (data && (data.message || data.error)) || 'Unable to save student.';
                if (status) status.textContent = msg;
                showToast(msg, 'error');
            }
        } catch (err) {
            const msg = err.isTimeout ? 'Request timed out. Please try again.' : 'Network error.';
            if (status) status.textContent = msg;
            showToast(msg, 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    async function openEditStudentModal(id) {
        const row = state.students.find((s) => s.id === id);
        if (!row) return;
        const form = document.getElementById('student-form');
        if (!form) return;
        form.reset();
        const setVal = (name, val) => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) el.value = val ?? '';
        };
        setVal('id', row.id);
        setVal('name', row.name);
        setVal('student_id', row.student_id);
        setVal('email', row.email);
        setVal('faculty', row.faculty);
        setVal('batch_number', row.batch_number);
        setVal('role', row.role);
        const active = form.querySelector('[name="is_active"]');
        if (active) active.checked = !!row.is_active;
        const title = document.getElementById('student-modal-title');
        if (title) title.textContent = 'Edit Student';
        openModal('student-modal');
    }

    async function deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this user? This will also remove their club memberships, bookings, and announcements.')) {
            return;
        }

        // Optimistic: disable the button
        const btn = document.querySelector(`[data-action="delete"][data-id="${id}"]`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Deleting…';
        }

        try {
            const { ok, data } = await apiJson(API.students, 'DELETE', { id });

            // If the server returned success, we're done.
            if (ok && data && data.success) {
                showToast('User and related records deleted successfully.', 'success');
                await loadStudents();
                return;
            }

            // If we got a clear server error (e.g. "Primary admin cannot be deleted"), show it.
            if (data && (data.message || data.error)) {
                showToast(data.message || data.error || 'Failed to delete user.', 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Delete';
                }
                return;
            }

            // If we got here, the response was ambiguous (e.g. timeout after server succeeded).
            // Refresh the list to see the real state instead of popping a false alert.
            showToast('Checking deletion status…', 'info', 2000);
            await loadStudents();

            // If the row is still present, the delete genuinely failed.
            const stillPresent = state.students.some((s) => s.id === id);
            if (stillPresent) {
                showToast('Deletion could not be confirmed. Please try again.', 'error');
            } else {
                showToast('User deleted successfully.', 'success');
            }
        } catch (err) {
            // Network error / timeout — refresh to check real state, avoid false abort alert.
            console.error('Delete error:', err);
            try {
                await loadStudents();
                const stillPresent = state.students.some((s) => s.id === id);
                if (!stillPresent) {
                    showToast('User deleted successfully.', 'success');
                    return;
                }
            } catch (_) { /* ignore secondary failure */ }
            showToast(err.isTimeout
                ? 'The request timed out. Please refresh and check if the user was deleted.'
                : 'A network error occurred. Please try again.', 'error');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Delete';
            }
        }
    }

    function bindStudentsTableEvents() {
        const tbody = document.getElementById('students-tbody');
        if (!tbody) return;
        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (!id) return;
            if (btn.dataset.action === 'delete') {
                await deleteStudent(id);
            } else if (btn.dataset.action === 'edit') {
                await openEditStudentModal(id);
            }
        });
    }

    /* --------------------------------------------------------
     * 10. CLUBS MODULE
     * ------------------------------------------------------ */
    async function loadClubs() {
        const tbody = document.getElementById('clubs-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px;">Loading clubs…</td></tr>';
        try {
            const { ok, data } = await apiJson(API.clubs, 'GET');
            if (!ok || !data || !data.success) {
                tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px;">Unable to load clubs.</td></tr>';
                return;
            }
            state.clubs = data.data || [];
            renderClubsTable();
        } catch (_) {
            tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px;">Network error.</td></tr>';
        }
    }

    function renderClubsTable() {
        const tbody = document.getElementById('clubs-tbody');
        if (!tbody) return;
        if (!state.clubs.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center;padding:24px;">No clubs found.</td></tr>';
            return;
        }
        tbody.innerHTML = state.clubs.map((c) => {
            let statusBadge = '';
            if (c.status === 'approved') statusBadge = '<span class="badge badge-approved">Approved</span>';
            else if (c.status === 'pending') statusBadge = '<span class="badge badge-pending">Pending</span>';
            else statusBadge = '<span class="badge badge-rejected">Rejected</span>';

            const actions = c.status === 'pending'
                ? `<button class="btn btn-sm btn-approve" data-action="approve-club" data-id="${c.id}">Approve</button>
                   <button class="btn btn-sm btn-reject" data-action="reject-club" data-id="${c.id}" style="margin-left:6px;">Reject</button>`
                : '—';

            return `
                <tr>
                    <td style="font-weight:600;">${escapeHtml(c.name || '')}</td>
                    <td>${escapeHtml(c.category || '—')}</td>
                    <td>${escapeHtml(c.manager_name || '—')}</td>
                    <td>${escapeHtml(formatDate(c.created_at))}</td>
                    <td>${statusBadge}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('');
    }

    async function handleClubAction(id, action) {
        try {
            const { ok, data } = await apiJson(API.clubs, 'PUT', { id, status: action === 'approve-club' ? 'approved' : 'rejected' });
            if (ok && data && data.success) {
                showToast('Club ' + (action === 'approve-club' ? 'approved' : 'rejected') + '.', 'success');
                await loadClubs();
            } else {
                showToast((data && data.message) || 'Unable to update club.', 'error');
            }
        } catch (_) {
            showToast('Network error.', 'error');
        }
    }

    function bindClubsTableEvents() {
        const tbody = document.getElementById('clubs-tbody');
        if (!tbody) return;
        tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            if (!id) return;
            await handleClubAction(id, btn.dataset.action);
        });
    }

    /* --------------------------------------------------------
     * 11. BOOKINGS MODULE
     * ------------------------------------------------------ */
    async function loadBookings() {
        const tbody = document.getElementById('bookings-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Loading bookings…</td></tr>';
        try {
            const { ok, data } = await apiJson(API.bookings, 'GET');
            if (!ok || !data || !data.success) {
                tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Unable to load bookings.</td></tr>';
                return;
            }
            state.bookings = data.data || [];
            renderBookingsTable();
        } catch (_) {
            tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">Network error.</td></tr>';
        }
    }

    function renderBookingsTable() {
        const tbody = document.getElementById('bookings-tbody');
        if (!tbody) return;
        if (!state.bookings.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:24px;">No bookings found.</td></tr>';
            return;
        }
        tbody.innerHTML = state.bookings.map((b) => {
            let badge = '';
            if (b.status === 'confirmed') badge = '<span class="badge badge-confirmed">Confirmed</span>';
            else if (b.status === 'pending') badge = '<span class="badge badge-pending">Pending</span>';
            else if (b.status === 'cancelled') badge = '<span class="badge badge-cancelled">Cancelled</span>';
            else badge = '<span class="badge">' + escapeHtml(b.status || '—') + '</span>';

            return `
                <tr>
                    <td>${escapeHtml(b.facility || '—')}</td>
                    <td>${escapeHtml(b.booked_by_name || '—')}</td>
                    <td>${escapeHtml(formatDateTime(b.start_time))}</td>
                    <td>${escapeHtml(formatDateTime(b.end_time))}</td>
                    <td>${escapeHtml(b.purpose || '—')}</td>
                    <td>${badge}</td>
                    <td>${escapeHtml(formatDate(b.created_at))}</td>
                </tr>
            `;
        }).join('');
    }

    /* --------------------------------------------------------
     * 12. ANNOUNCEMENTS MODULE
     * ------------------------------------------------------ */
    async function loadAnnouncements() {
        const list = document.getElementById('announcements-list');
        if (!list) return;
        list.innerHTML = '<p class="muted">Loading announcements…</p>';
        try {
            const { ok, data } = await apiJson(API.announcements, 'GET');
            if (!ok || !data || !data.success) {
                list.innerHTML = '<p class="muted">Unable to load announcements.</p>';
                return;
            }
            state.announcements = data.data || [];
            renderAnnouncements();
        } catch (_) {
            list.innerHTML = '<p class="muted">Network error.</p>';
        }
    }

    function renderAnnouncements() {
        const list = document.getElementById('announcements-list');
        if (!list) return;
        if (!state.announcements.length) {
            list.innerHTML = '<p class="muted">No announcements yet.</p>';
            return;
        }
        list.innerHTML = state.announcements.map((a) => `
            <div class="feed-item">
                <div style="display:flex;justify-content:space-between;gap:12px;">
                    <strong>${escapeHtml(a.title || '')}</strong>
                    <span class="muted" style="font-size:0.8rem;">${escapeHtml(formatDateTime(a.created_at))}</span>
                </div>
                <p>${escapeHtml(a.body || '')}</p>
                <div class="muted" style="font-size:0.8rem;">By ${escapeHtml(a.author_name || 'Admin')}</div>
            </div>
        `).join('');
    }

    /* --------------------------------------------------------
     * 13. PROFILE MODULE
     * ------------------------------------------------------ */
    async function loadProfile() {
        const form = document.getElementById('profile-form');
        if (!form || !state.currentAdminUser) return;
        const setVal = (name, val) => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) el.value = val ?? '';
        };
        setVal('name', state.currentAdminUser.name);
        setVal('email', state.currentAdminUser.email);
    }

    function bindProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = document.getElementById('profile-form-status');
            if (status) status.textContent = '';
            const formData = new FormData(form);
            const payload = {
                name: (formData.get('name') || '').toString().trim(),
                password: (formData.get('password') || '').toString()
            };
            try {
                const { ok, data } = await apiJson(API.profile, 'PUT', payload);
                if (ok && data && data.success) {
                    showToast('Profile updated.', 'success');
                    await loadCurrentUser();
                } else {
                    showToast((data && data.message) || 'Unable to update profile.', 'error');
                }
            } catch (_) {
                showToast('Network error.', 'error');
            }
        });
    }

    /* --------------------------------------------------------
     * 14. MODAL CLOSE HANDLERS
     * ------------------------------------------------------ */
    function bindModalCloseHandlers() {
        document.querySelectorAll('[data-close-modal]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.closeModal;
                if (target) closeModal(target);
            });
        });
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    const modal = backdrop.closest('[id]');
                    if (modal) closeModal(modal.id);
                }
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('[id$="-modal"]').forEach((m) => {
                    if (m.style.display === 'flex') closeModal(m.id);
                });
            }
        });
    }

    /* --------------------------------------------------------
     * 15. INITIALIZATION
     * ------------------------------------------------------ */
    async function init() {
        bindNavigation();
        bindStudentsToolbar();
        bindStudentsTableEvents();
        bindClubsTableEvents();
        bindProfileForm();
        bindModalCloseHandlers();

        const authenticated = await loadCurrentUser();
        if (!authenticated) return;

        // Default section
        const initialSection = state.currentSection || 'dashboard';
        switchSection(initialSection);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();