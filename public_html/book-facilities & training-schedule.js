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

// Links each sport in the schedule to its container on the Book Facilities page
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

//Training Schedule page
const scheduleList = document.getElementById("scheduleList");
if (scheduleList) {
  function renderSchedule(filter) {
    scheduleList.innerHTML = "";
    dayOrder
      .filter(day => filter === "all" || day.toLowerCase() === filter)
      .forEach(day => {
        const sessions = trainingSessions.filter(s => s.day === day);
        if (!sessions.length) return;

        const heading = document.createElement("h2");
        heading.className = "day-heading";
        heading.textContent = day;
        scheduleList.appendChild(heading);

        sessions.forEach(s => {
          const facilityId = sportToFacility[s.club];
          const bookLink = "book-facilities.html" + (facilityId ? "?facility=" + facilityId : "") + "#bookingSection";
          const card = document.createElement("div");
          card.className = "session-card";
          card.innerHTML = `
            <div class="session-info">
              <h3>${s.sport}</h3>
              <p>${s.time} &middot; ${s.venue}</p>
            </div>
            <a class="btn-outline" href="${bookLink}">Book Now</a>
          `;
          scheduleList.appendChild(card);
        });
      });
  }
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderSchedule(chip.dataset.filter);
    });
  });
  renderSchedule("all");
}

//Book Facilities page
const facilitiesGrid = document.getElementById("facilitiesGrid");
const facilitySelect = document.getElementById("facilitySelect");
const bookingForm = document.getElementById("bookingForm");
const bookingsBody = document.getElementById("bookingsBody");
const noBookings = document.getElementById("noBookings");

if (facilitiesGrid) {
  facilities.forEach(f => {
    const card = document.createElement("div");
    card.className = "facility-card";
    card.innerHTML = `
      ${f.img ? `<img class="facility-img" src="${f.img}" alt="${f.name}">` : `<div class="icon">${f.icon}</div>`}
      <h3>${f.name}</h3>
      <p>${f.desc}</p>
      <button class="btn-outline" data-id="${f.id}">Book Now</button>
    `;
    facilitiesGrid.appendChild(card);

    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    facilitySelect.appendChild(opt);
  });

  // If we arrived from a Book Now button on the schedule page, preselect that facility
  const preselect = new URLSearchParams(window.location.search).get("facility");
  if (preselect && facilities.some(f => f.id === preselect)) {
    facilitySelect.value = preselect;
    bookingForm.scrollIntoView({ behavior: "smooth" });
  }

  facilitiesGrid.addEventListener("click", e => {
    if (e.target.dataset.id) {
      facilitySelect.value = e.target.dataset.id;
      bookingForm.scrollIntoView({ behavior: "smooth" });
    }
  });

  let bookings;
  try {
    const savedBookings = JSON.parse(localStorage.getItem("myBookings") || "[]");
    bookings = Array.isArray(savedBookings) ? savedBookings : [];
  } catch (error) {
    console.error("Could not read saved booking requests.", error);
    bookings = [];
  }

  function renderBookings() {
    bookingsBody.innerHTML = "";
    noBookings.style.display = bookings.length ? "none" : "block";
    bookings.forEach(b => {
      const facName = facilities.find(f => f.id === b.facility)?.name || b.facility;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${facName}</td>
        <td>${b.date}</td>
        <td>${b.start} - ${b.end}</td>
        <td><span class="status status-${b.status}">${b.status}</span></td>
      `;
      bookingsBody.appendChild(row);
    });
  }

  bookingForm.addEventListener("submit", e => {
    e.preventDefault();
    const facility = facilitySelect.value;
    const date = document.getElementById("bookingDate").value;
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
    if (date < bookingDate.min) { alert("Please choose today or a future date."); return; }
    if (end <= start) { alert("End time must be after start time."); return; }
    bookings.push({ facility, date, start, end, status: "pending" });
    try {
      localStorage.setItem("myBookings", JSON.stringify(bookings));
    } catch (error) {
      bookings.pop();
      console.error("Could not save the booking request.", error);
      alert("Your booking request could not be saved in this browser.");
      return;
    }
    renderBookings();
    bookingForm.reset();
  });

  const bookingDate = document.getElementById("bookingDate");
  const today = new Date();
  bookingDate.min = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  renderBookings();
}