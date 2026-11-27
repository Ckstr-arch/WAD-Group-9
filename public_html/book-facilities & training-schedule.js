/*
Weekly recurring schedule based on the actual sports practice
schedules displayed on the NSBM Recreation Centre notice board.
*/
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const trainingSessions = [
  { day: "Monday", sport: "Athletics", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 02 Ground", club: "athletics" },
  { day: "Monday", sport: "Cricket", time: "1:00 PM - 3:00 PM", venue: "NSBM Phase 02 Ground", club: "cricket" },
  { day: "Monday", sport: "Rugby", time: "2:00 PM - 6:00 PM", venue: "NSBM Phase 02 Ground", club: "rugby" },
  { day: "Monday", sport: "Netball", time: "2:30 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "netball" },
  { day: "Monday", sport: "Basketball", time: "10:00 AM - 1:30 PM", venue: "NSBM Indoor Stadium", club: "basketball" },
  { day: "Monday", sport: "Powerlifting", time: "11:30 AM - 2:30 PM", venue: "NSBM Gymnasium", club: "powerlifting" },

  { day: "Tuesday", sport: "Football", time: "3:00 PM - 6:00 PM", venue: "NSBM Phase 02 Ground", club: "football" },
  { day: "Tuesday", sport: "Archery", time: "9:00 AM - 12:00 PM", venue: "NSBM Phase 01 Ground", club: "archery" },
  { day: "Tuesday", sport: "Hockey", time: "2:00 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "hockey" },
  { day: "Tuesday", sport: "Badminton", time: "9:00 AM - 4:00 PM", venue: "NSBM Indoor Stadium", club: "badminton" },
  { day: "Tuesday", sport: "Karate", time: "2:00 PM - 6:00 PM", venue: "NSBM Indoor Stadium", club: "karate" },
  { day: "Tuesday", sport: "Table Tennis", time: "1:00 PM - 5:00 PM", venue: "NSBM Indoor Stadium", club: "table-tennis" },
  { day: "Tuesday", sport: "Powerlifting", time: "11:30 AM - 2:30 PM", venue: "NSBM Gymnasium", club: "powerlifting" },
  { day: "Tuesday", sport: "Swimming", time: "2:30 PM - 5:00 PM", venue: "NSBM Swimming Pool", club: "swimming" },

  { day: "Wednesday", sport: "Athletics", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 02 Ground", club: "athletics" },
  { day: "Wednesday", sport: "Cricket", time: "1:00 PM - 3:00 PM", venue: "NSBM Phase 02 Ground", club: "cricket" },
  { day: "Wednesday", sport: "Rugby", time: "2:00 PM - 6:00 PM", venue: "NSBM Phase 02 Ground", club: "rugby" },
  { day: "Wednesday", sport: "Calisthenics", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 02 Ground (Outdoor Gym)", club: "calisthenics" },
  { day: "Wednesday", sport: "Netball", time: "2:30 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "netball" },
  { day: "Wednesday", sport: "Volleyball", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "volleyball" },
  { day: "Wednesday", sport: "Basketball", time: "10:00 AM - 1:30 PM", venue: "NSBM Indoor Stadium", club: "basketball" },
  { day: "Wednesday", sport: "Taekwondo", time: "3:00 PM - 7:00 PM", venue: "NSBM Indoor Stadium", club: "taekwondo" },
  { day: "Wednesday", sport: "Table Tennis", time: "1:00 PM - 5:00 PM", venue: "NSBM Indoor Stadium", club: "table-tennis" },
  { day: "Wednesday", sport: "Powerlifting", time: "11:30 AM - 2:30 PM", venue: "NSBM Gymnasium", club: "powerlifting" },
  { day: "Wednesday", sport: "Chess", time: "9:00 AM - 12:00 PM", venue: "FOC - L - 104", club: "chess" },

  { day: "Thursday", sport: "Football", time: "3:00 PM - 6:00 PM", venue: "NSBM Phase 02 Ground", club: "football" },
  { day: "Thursday", sport: "Archery", time: "9:00 AM - 12:00 PM", venue: "NSBM Phase 01 Ground", club: "archery" },
  { day: "Thursday", sport: "Hockey", time: "2:00 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "hockey" },
  { day: "Thursday", sport: "Badminton", time: "9:00 AM - 4:00 PM", venue: "NSBM Indoor Stadium", club: "badminton" },
  { day: "Thursday", sport: "Karate", time: "2:00 PM - 6:00 PM", venue: "NSBM Indoor Stadium", club: "karate" },
  { day: "Thursday", sport: "Table Tennis", time: "1:00 PM - 5:00 PM", venue: "NSBM Indoor Stadium", club: "table-tennis" },
  { day: "Thursday", sport: "Swimming", time: "2:30 PM - 5:00 PM", venue: "NSBM Swimming Pool", club: "swimming" },

  { day: "Friday", sport: "Athletics", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 02 Ground", club: "athletics" },
  { day: "Friday", sport: "Rugby", time: "2:00 PM - 6:00 PM", venue: "NSBM Phase 02 Ground", club: "rugby" },
  { day: "Friday", sport: "Calisthenics", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 02 Ground (Outdoor Gym)", club: "calisthenics" },
  { day: "Friday", sport: "Netball", time: "2:30 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "netball" },
  { day: "Friday", sport: "Volleyball", time: "3:00 PM - 5:00 PM", venue: "NSBM Phase 01 Ground", club: "volleyball" },
  { day: "Friday", sport: "Taekwondo", time: "3:00 PM - 7:00 PM", venue: "NSBM Indoor Stadium", club: "taekwondo" },
  { day: "Friday", sport: "Powerlifting", time: "11:30 AM - 2:30 PM", venue: "NSBM Gymnasium", club: "powerlifting" },
  { day: "Friday", sport: "Chess", time: "9:00 AM - 12:00 PM", venue: "FOC - L - 104", club: "chess" }
];

const facilities = [
  { id: "cricket", name: "Cricket", img: "assets/pictures/Cricket.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "basketball-court", name: "Basketball Court", img: "assets/pictures/Indoor Court.jpg", desc: "NSBM Indoor Stadium" },
  { id: "table-tennis", name: "Table Tennis", img: "assets/pictures/Table Tennis.jpg", desc: "NSBM Indoor Stadium" },
  { id: "swimming-pool", name: "Swimming Pool", img: "assets/pictures/Swimming Pool.jpg", desc: "NSBM Swimming Pool" },
  { id: "badminton-hall", name: "Badminton Court", img: "assets/pictures/Badminton.jpg", desc: "NSBM Indoor Stadium" },
  { id: "athletics-track", name: "Athletics Track", img: "assets/pictures/Athletic.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "netball-court", name: "Netball", img: "assets/pictures/Netball.jpg", desc: "NSBM Phase 01 Ground" },
  { id: "football-court", name: "Football", img: "assets/pictures/Football.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "rugby", name: "Rugby", img: "assets/pictures/Rugby.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "calisthenics", name: "Calisthenics", img: "assets/pictures/Calisthenics.jpg", desc: "NSBM Phase 02 Ground (Outdoor Gym)" },
  { id: "archery", name: "Archery", img: "assets/pictures/Archery.jpg", desc: "NSBM Phase 01 Ground" },
  { id: "hockey", name: "Hockey", img: "assets/pictures/Hockey.jpg", desc: "NSBM Phase 01 Ground" },
  { id: "taekwondo", name: "Taekwondo", img: "assets/pictures/Taekwondo.jpg", desc: "NSBM Indoor Stadium" },
  { id: "karate", name: "Karate", img: "assets/pictures/Karate.jpg", desc: "NSBM Indoor Stadium" },
  { id: "powerlifting", name: "Powerlifting", img: "assets/pictures/Powerlifting.jpg", desc: "NSBM Gymnasium" },
  { id: "chess", name: "Chess", img: "assets/pictures/Chess.jpg", desc: "FOC - L - 104" }
];

const sportToFacility = {
  "athletics": "athletics-track",
  "cricket": "cricket",
  "rugby": "rugby",
  "netball": "netball-court",
  "basketball": "basketball-court",
  "powerlifting": "powerlifting",
  "football": "football-court",
  "archery": "archery",
  "hockey": "hockey",
  "badminton": "badminton-hall",
  "karate": "karate",
  "table-tennis": "table-tennis",
  "swimming": "swimming-pool",
  "calisthenics": "calisthenics",
  "taekwondo": "taekwondo",
  "chess": "chess"
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Training Schedule page
const scheduleList = document.getElementById("scheduleList");
if (scheduleList) {
  function renderSchedule(filter) {
    scheduleList.innerHTML = "";
    dayOrder
      .filter((day) => filter === "all" || day.toLowerCase() === filter)
      .forEach((day) => {
        const sessions = trainingSessions.filter((s) => s.day === day);
        if (!sessions.length) return;

        const heading = document.createElement("h2");
        heading.className = "day-heading";
        heading.textContent = day;
        scheduleList.appendChild(heading);

        sessions.forEach((s) => {
          const facilityId = sportToFacility[s.club];
          const bookLink =
            "book-facilities.html" + (facilityId ? "?facility=" + encodeURIComponent(facilityId) : "") + "#bookingSection";
          const card = document.createElement("div");
          card.className = "session-card";
          card.innerHTML = `
            <div class="session-info">
              <h3>${esc(s.sport)}</h3>
              <p>${esc(s.time)} &middot; ${esc(s.venue)}</p>
            </div>
            <a class="btn-outline" href="${esc(bookLink)}">Book Now</a>
          `;
          scheduleList.appendChild(card);
        });
      });
  }

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderSchedule(chip.dataset.filter || "all");
    });
  });

  renderSchedule("all");
}

// Book Facilities page
const facilitiesGrid = document.getElementById("facilitiesGrid");
const facilitySelect = document.getElementById("facilitySelect");
const bookingForm = document.getElementById("bookingForm");
const bookingsBody = document.getElementById("bookingsBody");
const noBookings = document.getElementById("noBookings");

if (facilitiesGrid && facilitySelect && bookingForm && bookingsBody && noBookings) {
  const SESSION_STORAGE_KEY = "sportshub_user";
  const LOCAL_BOOKINGS_KEY = "myBookings";
  let resolvedApiBase = null;

  function getActiveUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  async function resolveBookingApiBase() {
    if (resolvedApiBase) return resolvedApiBase;
    for (const candidate of ["backend/api", "api"]) {
      try {
        const res = await fetch(`${candidate}/auth.php`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const text = await res.text();
        JSON.parse(text);
        resolvedApiBase = candidate;
        return resolvedApiBase;
      } catch {
        // try next candidate
      }
    }
    resolvedApiBase = "backend/api";
    return resolvedApiBase;
  }

  async function bookingApi(path, options = {}) {
    const base = await resolveBookingApiBase();
    const user = getActiveUser();
    const headers = {
      Accept: "application/json",
      ...(user?.id ? { "X-User-Id": String(user.id) } : {}),
      ...(user?.role ? { "X-User-Role": String(user.role) } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${base}/${path}`, {
      credentials: "include",
      ...options,
      headers,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      const snippet = text.trim().replace(/\s+/g, " ").slice(0, 140) || "(empty response)";
      console.error(`Non-JSON response from ${base}/${path} (HTTP ${res.status}):`, text);
      throw new Error(`HTTP ${res.status} from ${base}/${path}: ${snippet}`);
    }

    if (!res.ok || data?.success === false) {
      throw new Error(data?.error || data?.message || `Booking request failed (${res.status})`);
    }
    return data;
  }

  facilities.forEach((f) => {
    const card = document.createElement("div");
    card.className = "facility-card";
    card.innerHTML = `
      ${f.img ? `<img class="facility-img" src="${esc(f.img)}" alt="${esc(f.name)}">` : ""}
      <h3>${esc(f.name)}</h3>
      <p>${esc(f.desc)}</p>
      <button type="button" class="btn-outline" data-id="${esc(f.id)}">Book Now</button>
    `;
    facilitiesGrid.appendChild(card);

    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    facilitySelect.appendChild(opt);
  });

  const preselect = new URLSearchParams(window.location.search).get("facility");
  if (preselect && facilities.some((f) => f.id === preselect)) {
    facilitySelect.value = preselect;
    bookingForm.scrollIntoView({ behavior: "smooth" });
  }

  facilitiesGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    facilitySelect.value = btn.dataset.id;
    bookingForm.scrollIntoView({ behavior: "smooth" });
  });

  const bookingDate = document.getElementById("bookingDate");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");

  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  if (bookingDate) {
    bookingDate.min = todayStr;
    if (!bookingDate.value) {
      bookingDate.value = todayStr;
    }
  }

  [bookingDate, startTimeInput, endTimeInput].forEach((input) => {
    if (!input) return;
    input.style.pointerEvents = "auto";
    input.style.position = "relative";
    input.style.zIndex = "2";
    input.style.cursor = "pointer";
    input.addEventListener("click", () => {
      if (typeof input.showPicker === "function") {
        try {
          input.showPicker();
        } catch {
          // ignore if browser blocks programmatic showPicker
        }
      }
    });
  });

  let bookings = [];

  function normalizeBookingRow(row) {
    const facilityId = row.facility_id || row.facility || "";
    const matchedFac = facilities.find(
      (f) =>
        f.id === facilityId ||
        f.name.toLowerCase() === String(row.facility_name || row.facility || "").toLowerCase()
    );
    const dateVal = row.booking_date || row.date || (row.start_time ? String(row.start_time).slice(0, 10) : "");
    const startVal = row.start_time || row.start || "";
    const endVal = row.end_time || row.end || "";
    return {
      facility: matchedFac ? matchedFac.name : row.facility_name || facilityId || "Facility",
      date: dateVal,
      time: [startVal, endVal].filter(Boolean).join(" - "),
      status: String(row.status || "pending").toLowerCase(),
    };
  }

  function renderBookings() {
    bookingsBody.innerHTML = "";
    noBookings.style.display = bookings.length ? "none" : "block";
    bookings.forEach((b) => {
      const statusClass = ["confirmed", "approved"].includes(b.status)
        ? "status-confirmed"
        : ["cancelled", "rejected"].includes(b.status)
          ? "status-cancelled"
          : "status-pending";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${esc(b.facility)}</td>
        <td>${esc(b.date)}</td>
        <td>${esc(b.time)}</td>
        <td><span class="status ${esc(statusClass)}">${esc(b.status)}</span></td>
      `;
      bookingsBody.appendChild(row);
    });
  }

  function readLocalBookings() {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || "[]");
      return Array.isArray(saved) ? saved.map(normalizeBookingRow) : [];
    } catch {
      return [];
    }
  }

  async function fetchBookingsFromDb() {
    try {
      const res = await bookingApi("bookings.php", { method: "GET" });
      const list = Array.isArray(res?.data) ? res.data : [];
      bookings = list.map(normalizeBookingRow);
      renderBookings();
    } catch (err) {
      console.error("Failed to fetch bookings from DB:", err);
      bookings = readLocalBookings();
      renderBookings();
    }
  }

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const facilityId = facilitySelect.value;
    const facObj = facilities.find((f) => f.id === facilityId);
    const date = bookingDate ? bookingDate.value : "";
    const start = startTimeInput ? startTimeInput.value : "";
    const end = endTimeInput ? endTimeInput.value : "";

    if (!date) {
      alert("Please select a booking date.");
      return;
    }
    if (bookingDate?.min && date < bookingDate.min) {
      alert("Please choose today or a future date.");
      return;
    }
    if (!start || !end || end <= start) {
      alert("End time must be after start time.");
      return;
    }

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await bookingApi("bookings.php", {
        method: "POST",
        body: JSON.stringify({
          facility: facilityId,
          facility_id: facilityId,
          facility_name: facObj ? facObj.name : facilityId,
          booking_date: date,
          date,
          start_time: start,
          end_time: end,
          start,
          end,
        }),
      });
      bookingForm.reset();
      if (bookingDate) bookingDate.value = todayStr;
      await fetchBookingsFromDb();
      alert("Booking request submitted.");
    } catch (err) {
      console.error("Booking submit error:", err);
      alert(err.message || "Could not submit booking request to database.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  fetchBookingsFromDb();
}