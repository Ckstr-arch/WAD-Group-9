// student-dashboard.js - Logic with API endpoints ready
import { api } from './services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const welcomeMsg = document.getElementById('welcome-msg');
  const clubsContainer = document.getElementById('clubs-container');
  const bookingsContainer = document.getElementById('bookings-container');
  const feedContainer = document.getElementById('feed-container');
  const bookBtn = document.getElementById('book-btn');
  const logoutBtn = document.getElementById('logout-btn');

  try {
    // 1. Fetch active session/user endpoint
    const sessionRes = await api.session();
    const user = sessionRes?.data?.user;

    if (user) {
      welcomeMsg.textContent = `Welcome back, ${user.name || 'Student'}`;
    }

    // 2. Mock or fetch student memberships endpoint (e.g., api.getStudentClubs())
    clubsContainer.innerHTML = `
      <p class="muted">ITF Taekwon-Do Club</p>
      <span class="badge badge-success">Active Member</span>
    `;

    // 3. Mock or fetch bookings endpoint (e.g., api.getBookings())
    bookingsContainer.innerHTML = `
      <p class="muted">No facility reservations found for this week.</p>
    `;

    // 4. Mock or fetch announcements / feed endpoint (e.g., api.getAnnouncements())
    feedContainer.innerHTML = `
      <div class="feed-item">
        <strong>Inter-Faculty Cricket Registration Open</strong>
        <p class="muted">Register your faculty teams before Friday evening.</p>
      </div>
      <div class="feed-item">
        <strong>Taekwon-Do Conditioning Session</strong>
        <p class="muted">Outdoor training scheduled for Saturday at 4:00 PM.</p>
      </div>
    `;

  } catch (err) {
    console.error('Failed to load dashboard data from endpoints:', err);
    welcomeMsg.textContent = 'Welcome back, Student';
    feedContainer.innerHTML = `<div class="feed-item"><strong>Session expired or offline.</strong><p class="muted">Please log in again.</p></div>`;
  }

  // Action: Open booking flow
  bookBtn.addEventListener('click', () => {
    alert('Trigger facility booking endpoint / modal here.');
  });

  // Action: Logout endpoint / clear storage
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
  });
});
