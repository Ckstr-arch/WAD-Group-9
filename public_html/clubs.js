(() => {
  const mainEl = document.getElementById("main");
  const API_BASE = (mainEl?.dataset.apiBase || "/api").replace(/\/+$/, "");

  const ENDPOINTS = {
    clubs: `${API_BASE}/clubs`,
    clubDetail: (slug) => `${API_BASE}/clubs/${encodeURIComponent(slug)}`,
    joinClub: `${API_BASE}/clubs/join`,
    upcomingFixtures: `${API_BASE}/tournaments/upcoming`,
  };

  // Fallback dataset used only if backend endpoints are unavailable during standalone preview
  const FALLBACK_CLUBS = [
    {
      slug: "nsbm-athletics-club",
      name: "Athletics Club",
      category: "field",
      categoryLabel: "Track & Field",
      venue: "NSBM Athletics Track & Grounds",
      schedule: "Tue & Thu · 4:00 PM – 6:00 PM",
      membersCount: 84,
      lead: "Athletics Captain · Sports Council",
      summary: "Sprint, middle-distance, relay, and field event training for university track meets and inter-university championships.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/4-768x512.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/nsbm-athletics-club/",
    },
    {
      slug: "nsbm-badminton-club",
      name: "Badminton Club",
      category: "indoor",
      categoryLabel: "Indoor Court",
      venue: "NSBM Indoor Sports Complex",
      schedule: "Mon & Wed · 4:30 PM – 6:30 PM",
      membersCount: 68,
      lead: "Badminton Captain · Sports Council",
      summary: "Singles and doubles drills, footwork conditioning, and selection trials for inter-faculty and SLUG badminton tournaments.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/badminton-club-768x215.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/nsbm-badminton-club/",
    },
    {
      slug: "chess-club",
      name: "Chess Club",
      category: "indoor",
      categoryLabel: "Mind Sport",
      venue: "Student Centre · Level 2",
      schedule: "Wed & Fri · 3:30 PM – 5:30 PM",
      membersCount: 52,
      lead: "Chess President · Sports Council",
      summary: "Rapid and classical over-the-board sessions, opening prep, and inter-university chess squad selection.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/07/chess-club-768x512.jpg",
      officialUrl: "https://www.nsbm.ac.lk/club/chess-club/",
    },
    {
      slug: "cricket-club",
      name: "Cricket Club",
      category: "field",
      categoryLabel: "Field Sport",
      venue: "NSBM Cricket Ground & Nets",
      schedule: "Tue, Thu & Sat · 3:30 PM – 6:00 PM",
      membersCount: 96,
      lead: "Cricket Captain · Sports Council",
      summary: "Net practice, fielding drills, and squad matches across hard-ball and university tournament formats.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/08/cricket-768x214.jpg",
      officialUrl: "https://www.nsbm.ac.lk/club/cricket-club/",
    },
    {
      slug: "nsbm-martial-arts-club",
      name: "Martial Arts Club",
      category: "combat-aquatic",
      categoryLabel: "Combat & Martial Arts",
      venue: "NSBM Multi-Purpose Martial Arts Hall",
      schedule: "Tue & Thu · 4:30 PM – 6:30 PM",
      membersCount: 61,
      lead: "Martial Arts Lead · Sports Council",
      summary: "Structured technique, pattern/form discipline, sparring conditioning, and grading preparation for beginners and experienced practitioners.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/taekwondo7-768x626.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/nsbm-martial-arts-club/",
    },
    {
      slug: "nsbm-netball-club",
      name: "Netball Club",
      category: "field",
      categoryLabel: "Court Sport",
      venue: "NSBM Outdoor Courts",
      schedule: "Mon & Thu · 4:00 PM – 6:00 PM",
      membersCount: 57,
      lead: "Netball Captain · Sports Council",
      summary: "Tactical court play, shooting accuracy, agility work, and inter-university netball fixtures.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/4-jpg.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/nsbm-netball-club/",
    },
    {
      slug: "nsbm-rugby-club",
      name: "Rugby Club",
      category: "field",
      categoryLabel: "Field Sport",
      venue: "NSBM Main Sports Field",
      schedule: "Mon, Wed & Fri · 4:15 PM – 6:30 PM",
      membersCount: 73,
      lead: "Rugby Captain · Sports Council",
      summary: "Contact and sevens rugby conditioning, set-piece execution, and inter-university tournament preparation.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/rugby4-768x512.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/nsbm-rugby-club/",
    },
    {
      slug: "swimming-club",
      name: "Swimming Club",
      category: "combat-aquatic",
      categoryLabel: "Aquatics",
      venue: "NSBM Aquatic Centre",
      schedule: "Tue & Fri · 3:30 PM – 5:30 PM",
      membersCount: 49,
      lead: "Swimming Captain · Sports Council",
      summary: "Stroke mechanics, endurance sets, and time trials for freestyle, backstroke, breaststroke, and butterfly swimmers.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/08/swimming-club-768x512.jpeg",
      officialUrl: "https://www.nsbm.ac.lk/club/swimming-club/",
    },
    {
      slug: "table-tennis-club",
      name: "Table Tennis Club",
      category: "indoor",
      categoryLabel: "Indoor Sport",
      venue: "NSBM Indoor Recreation Zone",
      schedule: "Wed & Fri · 4:00 PM – 6:00 PM",
      membersCount: 44,
      lead: "Table Tennis Lead · Sports Council",
      summary: "Spin control, rally consistency, ladder matches, and inter-faculty table tennis tournaments.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/7-768x432.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/table-tennis-club/",
    },
    {
      slug: "tennis-club",
      name: "Tennis Club",
      category: "field",
      categoryLabel: "Court Sport",
      venue: "NSBM Hard Courts",
      schedule: "Tue & Thu · 4:00 PM – 6:00 PM",
      membersCount: 38,
      lead: "Tennis Captain · Sports Council",
      summary: "Groundstroke consistency, serve drills, and singles/doubles match play across all skill tiers.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/tennis-768x511.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/tennis-club/",
    },
    {
      slug: "nsbm-volleyball-club",
      name: "Volleyball Club",
      category: "field",
      categoryLabel: "Court Sport",
      venue: "NSBM Sports Arena",
      schedule: "Mon, Wed & Fri · 4:00 PM – 6:00 PM",
      membersCount: 66,
      lead: "Volleyball Captain · Sports Council",
      summary: "Passing, setting, spiking, rotation drills, and inter-university volleyball squad training.",
      image: "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/vb2-768x512.webp",
      officialUrl: "https://www.nsbm.ac.lk/club/nsbm-volleyball-club/",
    },
  ];

  const FALLBACK_FIXTURES = [
    {
      id: 1,
      dateLabel: "Upcoming · Nov 28, 2026",
      title: "Inter-Faculty Athletics & Relay Trials",
      venue: "NSBM Athletics Track · 3:30 PM",
    },
    {
      id: 2,
      dateLabel: "Upcoming · Dec 03, 2026",
      title: "Campus Open Chess & Table Tennis Qualifiers",
      venue: "Student Centre & Indoor Zone · 2:00 PM",
    },
    {
      id: 3,
      dateLabel: "Upcoming · Dec 09, 2026",
      title: "Volleyball & Cricket Squad Selection Camp",
      venue: "NSBM Main Grounds · 4:00 PM",
    },
  ];

  // DOM References
  const gridEl = document.getElementById("clubs-grid");
  const emptyEl = document.getElementById("clubs-empty");
  const searchInput = document.getElementById("club-search-input");
  const filterChips = Array.from(document.querySelectorAll(".sh-chip[data-category]"));
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const syncStatusEl = document.getElementById("api-sync-status");
  const heroCountEl = document.getElementById("hero-club-count");
  const dirCountEl = document.getElementById("directory-club-count");
  const fixturesListEl = document.getElementById("upcoming-fixtures-list");
  const refreshFixturesBtn = document.getElementById("refresh-fixtures-btn");

  // Modal & Form References
  const modalEl = document.getElementById("club-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const detailViewEl = document.getElementById("modal-detail-view");
  const joinFormEl = document.getElementById("club-join-form");
  const joinClubSelect = document.getElementById("join-club-select");
  const switchToJoinBtn = document.getElementById("switch-to-join-btn");
  const backToDetailBtn = document.getElementById("back-to-detail-btn");
  const joinFeedbackEl = document.getElementById("join-feedback");
  const openJoinModalBtn = document.getElementById("open-join-modal-btn");
  const ctaJoinClubBtn = document.getElementById("cta-join-club-btn");

  let state = {
    clubs: [],
    category: "all",
    search: "",
    activeClubSlug: null,
  };

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setSyncStatus(text, isFallback = false) {
    if (!syncStatusEl) return;
    syncStatusEl.textContent = text;
    syncStatusEl.style.background = isFallback ? "#fffbeb" : "#ecfdf5";
    syncStatusEl.style.color = isFallback ? "#92400e" : "#15803d";
    syncStatusEl.style.borderColor = isFallback ? "#fde68a" : "#bbf7d0";
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    return response.json();
  }

  function normalizeClubs(payload) {
    const rawList = Array.isArray(payload) ? payload : payload?.clubs;
    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error("Invalid clubs payload");
    }

    return rawList.map((club, index) => ({
      slug: club.slug || `club-${index + 1}`,
      name: club.name || club.club_name || "Sports Club",
      category: club.category || "field",
      categoryLabel: club.category_label || club.categoryLabel || "Sports Club",
      venue: club.venue || club.location || "NSBM Sports Facilities",
      schedule: club.schedule || club.training_schedule || "Weekly Campus Sessions",
      membersCount: club.members_count ?? club.membersCount ?? "Active",
      lead: club.lead || club.captain || "NSBM Sports Council",
      summary: club.summary || club.description || "Official NSBM student sports club.",
      image:
        club.image ||
        club.image_url ||
        "https://d3c539pel8wzjz.cloudfront.net/wp-content/uploads/2023/clubs/sports/4-768x512.webp",
      officialUrl: club.official_url || club.officialUrl || "https://www.nsbm.ac.lk/sports-clubs/",
    }));
  }

  async function loadClubs() {
    gridEl.setAttribute("aria-busy", "true");
    try {
      const data = await fetchJson(ENDPOINTS.clubs);
      state.clubs = normalizeClubs(data);
      setSyncStatus("Live · Connected to /api/clubs", false);
    } catch (_err) {
      state.clubs = FALLBACK_CLUBS;
      setSyncStatus("Preview Mode · Using local fallback", true);
    } finally {
      gridEl.setAttribute("aria-busy", "false");
    }

    const totalCount = state.clubs.length;
    if (heroCountEl) heroCountEl.textContent = String(totalCount);
    if (dirCountEl) dirCountEl.textContent = String(totalCount);
    gridEl.dataset.count = String(totalCount);

    populateClubSelect();
    renderClubs();
  }

  function populateClubSelect() {
    if (!joinClubSelect) return;
    joinClubSelect.innerHTML = state.clubs
      .map(
        (club) =>
          `<option value="${escapeHtml(club.slug)}">${escapeHtml(club.name)}</option>`
      )
      .join("");
  }

  function getFilteredClubs() {
    const q = state.search.trim().toLowerCase();
    return state.clubs.filter((club) => {
      const matchesCategory = state.category === "all" || club.category === state.category;
      const haystack = `${club.name} ${club.categoryLabel} ${club.venue} ${club.lead} ${club.summary}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  function renderClubs() {
    const filtered = getFilteredClubs();

    if (filtered.length === 0) {
      gridEl.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;
    gridEl.innerHTML = filtered
      .map(
        (club, idx) => `
        <li class="ab-clubcard" style="--i:${idx % 3}">
          <button type="button" class="ab-clubcard__trigger" data-club-slug="${escapeHtml(club.slug)}">
            <span class="ab-clubcard__media">
              <img src="${escapeHtml(club.image)}" alt="${escapeHtml(club.name)}" loading="lazy" decoding="async">
            </span>
            <span class="ab-clubcard__body">
              <span class="ab-clubcard__tag">${escapeHtml(club.categoryLabel)}</span>
              <span class="ab-clubcard__name">${escapeHtml(club.name)}</span>
              <span class="ab-clubcard__meta">${escapeHtml(club.venue)} · ${escapeHtml(club.schedule)}</span>
              <span class="ab-clubcard__more">
                Explore &amp; Join
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6"></path>
                </svg>
              </span>
            </span>
          </button>
        </li>
      `
      )
      .join("");
  }

  async function loadUpcomingFixtures() {
    if (!fixturesListEl) return;
    fixturesListEl.innerHTML = `<div class="sh-fixture-card">Loading upcoming fixtures...</div>`;

    try {
      const data = await fetchJson(ENDPOINTS.upcomingFixtures);
      const raw = Array.isArray(data) ? data : data?.fixtures;
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error("No fixtures returned");
      }
      renderFixtures(
        raw.map((item, i) => ({
          id: item.id || i + 1,
          dateLabel: item.date_label || item.dateLabel || item.event_date || "Upcoming",
          title: item.title || item.name || "SportsHub Event",
          venue: item.venue || item.location || "NSBM Campus",
        }))
      );
    } catch (_err) {
      renderFixtures(FALLBACK_FIXTURES);
    }
  }

  function renderFixtures(items) {
    fixturesListEl.innerHTML = items
      .map(
        (f) => `
        <article class="sh-fixture-card">
          <div class="sh-fixture-card__date">${escapeHtml(f.dateLabel)}</div>
          <h3 class="sh-fixture-card__title">${escapeHtml(f.title)}</h3>
          <p class="sh-fixture-card__venue">${escapeHtml(f.venue)}</p>
        </article>
      `
      )
      .join("");
  }

  function openModal({ mode = "detail", clubSlug = null } = {}) {
    const club =
      state.clubs.find((c) => c.slug === clubSlug) ||
      state.clubs.find((c) => c.slug === state.activeClubSlug) ||
      state.clubs[0];

    if (club) {
      state.activeClubSlug = club.slug;
      document.getElementById("modal-club-category").textContent = club.categoryLabel;
      document.getElementById("modal-title").textContent = club.name;
      document.getElementById("modal-club-desc").textContent = club.summary;
      document.getElementById("modal-club-venue").textContent = club.venue;
      document.getElementById("modal-club-schedule").textContent = club.schedule;
      document.getElementById("modal-club-members").textContent = String(club.membersCount);
      document.getElementById("modal-club-lead").textContent = club.lead;

      const officialLink = document.getElementById("modal-official-link");
      officialLink.href = club.officialUrl;

      if (joinClubSelect) {
        joinClubSelect.value = club.slug;
      }
    }

    joinFeedbackEl.textContent = "";
    joinFeedbackEl.className = "sh-form-feedback";

    if (mode === "join") {
      detailViewEl.hidden = true;
      joinFormEl.hidden = false;
      backToDetailBtn.hidden = !club;
    } else {
      detailViewEl.hidden = false;
      joinFormEl.hidden = true;
      backToDetailBtn.hidden = true;
    }

    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
    closeModalBtn.focus();
  }

  async function handleClubCardClick(slug) {
    openModal({ mode: "detail", clubSlug: slug });

    // Attempt to hydrate richer detail fields from GET /api/clubs/:slug
    try {
      const detail = await fetchJson(ENDPOINTS.clubDetail(slug));
      const payload = detail?.club || detail;
      if (payload && (payload.name || payload.summary || payload.venue)) {
        if (payload.summary) document.getElementById("modal-club-desc").textContent = payload.summary;
        if (payload.venue) document.getElementById("modal-club-venue").textContent = payload.venue;
        if (payload.schedule || payload.training_schedule) {
          document.getElementById("modal-club-schedule").textContent =
            payload.schedule || payload.training_schedule;
        }
        if (payload.members_count ?? payload.membersCount) {
          document.getElementById("modal-club-members").textContent = String(
            payload.members_count ?? payload.membersCount
          );
        }
        if (payload.lead || payload.captain) {
          document.getElementById("modal-club-lead").textContent = payload.lead || payload.captain;
        }
      }
    } catch (_err) {
      // Keep already rendered card/fallback details
    }
  }

  function closeModal() {
    modalEl.hidden = true;
    document.body.style.overflow = "";
  }

  async function handleJoinSubmit(event) {
    event.preventDefault();
    const formData = new FormData(joinFormEl);
    const body = {
      club_slug: formData.get("club_slug"),
      student_name: String(formData.get("student_name") || "").trim(),
      student_id: String(formData.get("student_id") || "").trim(),
      faculty: formData.get("faculty"),
      email: String(formData.get("email") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    };

    if (!body.student_name || !body.student_id || !body.email) {
      joinFeedbackEl.textContent = "Please fill in your name, student ID, and email.";
      joinFeedbackEl.className = "sh-form-feedback is-error";
      return;
    }

    const submitBtn = document.getElementById("submit-join-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    joinFeedbackEl.textContent = "";
    joinFeedbackEl.className = "sh-form-feedback";

    try {
      const res = await fetchJson(ENDPOINTS.joinClub, {
        method: "POST",
        body: JSON.stringify(body),
      });

      joinFeedbackEl.textContent =
        res?.message || `Application submitted for ${body.club_slug}. Check your email for trial details.`;
      joinFeedbackEl.className = "sh-form-feedback is-success";
      joinFormEl.reset();
      if (body.club_slug && joinClubSelect) {
        joinClubSelect.value = body.club_slug;
      }
    } catch (_err) {
      joinFeedbackEl.textContent =
        "Could not reach /api/clubs/join right now. Verify your backend route and database connection.";
      joinFeedbackEl.className = "sh-form-feedback is-error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  }

  // Event Listeners
  gridEl.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-club-slug]");
    if (!trigger) return;
    handleClubCardClick(trigger.dataset.clubSlug);
  });

  searchInput?.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderClubs();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.category = chip.dataset.category || "all";
      renderClubs();
    });
  });

  resetFiltersBtn?.addEventListener("click", () => {
    state.category = "all";
    state.search = "";
    if (searchInput) searchInput.value = "";
    filterChips.forEach((c) => c.classList.toggle("is-active", c.dataset.category === "all"));
    renderClubs();
  });

  refreshFixturesBtn?.addEventListener("click", loadUpcomingFixtures);

  openJoinModalBtn?.addEventListener("click", () => openModal({ mode: "join" }));
  ctaJoinClubBtn?.addEventListener("click", () => openModal({ mode: "join" }));
  switchToJoinBtn?.addEventListener("click", () =>
    openModal({ mode: "join", clubSlug: state.activeClubSlug })
  );
  backToDetailBtn?.addEventListener("click", () =>
    openModal({ mode: "detail", clubSlug: state.activeClubSlug })
  );

  closeModalBtn?.addEventListener("click", closeModal);
  modalEl?.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-modal")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalEl.hidden) {
      closeModal();
    }
  });

  joinFormEl?.addEventListener("submit", handleJoinSubmit);

  // Initial Load when dom is ready caused multiple crashes due to missing these :-(
  loadClubs();
  loadUpcomingFixtures();
})();