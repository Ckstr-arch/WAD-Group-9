const facilities = [
  { id: "cricket", name: "Cricket", img: "pictures/Cricket.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "basketball-court", name: "Basketball Court", img: "pictures/Indoor Court.jpg", desc: "NSBM Indoor Stadium" },
  { id: "tennis-court", name: "Tennis Court", img: "pictures/Table Tennis.jpg", desc: "NSBM Indoor Stadium" },
  { id: "swimming-pool", name: "Swimming Pool", img: "pictures/Swimming Pool.jpg", desc: "NSBM Swimming Pool" },
  { id: "badminton-hall", name: "Badminton Court", img: "pictures/Badminton.jpg", desc: "NSBM Indoor Stadium" },
  { id: "athletics-track", name: "Athletics Track", img: "pictures/Athletic.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "netball-court", name: "Netball", img: "pictures/Netball.jpg", desc: "NSBM Phase 01 Ground" },
  { id: "football-court", name: "Football", img: "pictures/Football.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "rugby", name: "Rugby", img: "pictures/Rugby.jpg", desc: "NSBM Phase 02 Ground" },
  { id: "calisthenics", name: "Calisthenics", img: "pictures/Calisthenics.jpg", desc: "NSBM Phase 02 Ground (Outdoor Gym)" },
  { id: "archery", name: "Archery", img: "pictures/Archery.jpg", desc: "NSBM Phase 01 Ground" },
  { id: "hockey", name: "Hockey", img: "pictures/Hockey.jpg", desc: "NSBM Phase 01 Ground" },
  { id: "taekwondo", name: "Taekwondo", img: "pictures/Taekwondo.jpg", desc: "NSBM Indoor Stadium" },
  { id: "karate", name: "Karate", img: "pictures/Karate.jpg", desc: "NSBM Indoor Stadium" },
  { id: "powerlifting", name: "Powerlifting", img: "pictures/Powerlifting.jpg", desc: "NSBM Gymnasium" },
  { id: "chess", name: "Chess", img: "pictures/Chess.jpg", desc: "FOC - L - 104" }
];

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

  let bookings = JSON.parse(localStorage.getItem("myBookings") || "[]");

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
    if (end <= start) { alert("End time must be after start time."); return; }
    bookings.push({ facility, date, start, end, status: "pending" });
    localStorage.setItem("myBookings", JSON.stringify(bookings));
    renderBookings();
    bookingForm.reset();
  });

  renderBookings();
}