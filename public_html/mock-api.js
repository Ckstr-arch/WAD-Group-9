/* mimics backend/api/tournaments.php and results.php.
   Data is saved in this browser's localStorage. */
(function () {
  const STORE_KEY = 'sportshub_mock_v1';
  const MOCK_USER_NAME = 'Student';
  window.MOCK_ADMIN = new URLSearchParams(window.location.search).has('admin');

  const pad = (n) => String(n).padStart(2, '0');
  function isoDay(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function seed() {
    return {
      nextResultId: 8,
      registrations: [],
      tournaments: [
        { id: 1, name: 'NSBM Interfaculty Basketball Championship', sport: 'Basketball', start_date: isoDay(14), end_date: isoDay(15), format: 'Round robin', max_teams: 8, registered_teams: 6, status: 'registration_open', description: 'Faculty teams compete for the campus basketball title.' },
        { id: 2, name: 'NSBM Green University Football Cup', sport: 'Football', start_date: isoDay(21), end_date: isoDay(23), format: 'Knockout', max_teams: 16, registered_teams: 10, status: 'registration_open', description: 'A university football competition celebrating teamwork and fair play.' },
        { id: 3, name: 'NSBM Interfaculty Cricket Sixes', sport: 'Cricket', start_date: isoDay(28), end_date: isoDay(29), format: 'Group stage and knockout', max_teams: 12, registered_teams: 8, status: 'upcoming', description: 'Six-a-side cricket featuring teams from all faculties.' },
        { id: 4, name: 'NSBM Campus Badminton Open', sport: 'Badminton', start_date: isoDay(10), end_date: isoDay(11), format: 'Singles and doubles knockout', max_teams: 24, registered_teams: 16, status: 'registration_open', description: 'Open badminton competition for registered NSBM students.' },
        { id: 5, name: 'NSBM Previous Semester Chess Rapid', sport: 'Chess', start_date: isoDay(-21), end_date: isoDay(-21), format: 'Swiss', max_teams: 32, registered_teams: 24, status: 'completed', description: 'Completed example of the previous semester rapid tournament.' },
        { id: 6, name: 'NSBM Table Tennis Knockout', sport: 'Table Tennis', start_date: isoDay(-1), end_date: isoDay(1), format: 'Knockout', max_teams: 16, registered_teams: 16, status: 'ongoing', description: 'Fast knockout rounds across two days at the Student Activity Centre.' },
        { id: 7, name: 'NSBM Volleyball Friendly Series', sport: 'Volleyball', start_date: isoDay(7), end_date: isoDay(8), format: 'Round robin', max_teams: 6, registered_teams: 6, status: 'registration_open', description: 'Friendly volleyball series between faculty teams.' },
      ],
      results: [
        { id: 1, tournament_id: 5, round_label: 'Round 1', team_a: 'Faculty of Computing', team_b: 'Faculty of Business', score_a: 3, score_b: 1, played_on: isoDay(-21) },
        { id: 2, tournament_id: 5, round_label: 'Round 2', team_a: 'Faculty of Engineering', team_b: 'Faculty of Computing', score_a: 2, score_b: 2, played_on: isoDay(-21) },
        { id: 3, tournament_id: 5, round_label: 'Round 3', team_a: 'Faculty of Business', team_b: 'Faculty of Engineering', score_a: 1, score_b: 3, played_on: isoDay(-21) },
        { id: 4, tournament_id: 6, round_label: 'Round of 16', team_a: 'NSBM Smashers', team_b: 'Net Ninjas', score_a: 3, score_b: 1, played_on: isoDay(-1) },
        { id: 5, tournament_id: 6, round_label: 'Round of 16', team_a: 'Spin Doctors', team_b: 'Paddle Kings', score_a: 2, score_b: 3, played_on: isoDay(-1) },
        { id: 6, tournament_id: 6, round_label: 'Quarter-final', team_a: 'NSBM Smashers', team_b: 'Paddle Kings', score_a: 3, score_b: 2, played_on: isoDay(0) },
        { id: 7, tournament_id: 6, round_label: 'Quarter-final', team_a: 'Net Ninjas', team_b: 'Spin Doctors', score_a: 1, score_b: 3, played_on: isoDay(0) },
      ],
    };
  }

  let memory = null;
  function load() {
    if (memory) return memory;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        memory = JSON.parse(raw);
        return memory;
      }
    } catch { /* ignore */ }
    memory = seed();
    return memory;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(memory)); } catch { /* ignore */ }
  }
  function fail(message) {
    throw new Error(message);
  }

  function tournamentsApi(method, query, body) {
    const db = load();

    if (method === 'GET') {
      let rows = db.tournaments.map((t) => ({
        ...t,
        spots_left: Math.max(t.max_teams - t.registered_teams, 0),
        is_registered: db.registrations.some((r) => r.tournament_id === t.id),
      }));
      if (query.get('status')) rows = rows.filter((t) => t.status === query.get('status'));
      if (query.get('sport')) rows = rows.filter((t) => t.sport === query.get('sport'));
      rows.sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id);
      return { success: true, data: rows };
    }

    if (method === 'POST') {
      const id = Number(body.tournament_id);
      if (!id) fail('tournament_id is required.');
      const team = String(body.team_name || '').trim() || MOCK_USER_NAME;
      if (team.length > 120) fail('Team name is too long (max 120 characters).');

      const t = db.tournaments.find((x) => x.id === id);
      if (!t) fail('Tournament not found.');
      if (t.status !== 'registration_open') fail('Registration is closed for this tournament.');
      if (t.registered_teams >= t.max_teams) fail('This tournament is full.');
      if (db.registrations.some((r) => r.tournament_id === id)) fail('You are already registered for this tournament.');

      db.registrations.push({ tournament_id: id, team_name: team });
      t.registered_teams += 1;
      save();
      return { success: true, message: 'Registered successfully.' };
    }

    if (method === 'DELETE') {
      const id = Number(query.get('tournament_id'));
      if (!id) fail('tournament_id is required.');
      const t = db.tournaments.find((x) => x.id === id);
      if (!t) fail('Tournament not found.');
      if (['ongoing', 'completed', 'cancelled'].includes(t.status)) fail('You can no longer withdraw from this tournament.');
      const idx = db.registrations.findIndex((r) => r.tournament_id === id);
      if (idx === -1) fail('You are not registered for this tournament.');

      db.registrations.splice(idx, 1);
      t.registered_teams = Math.max(t.registered_teams - 1, 0);
      save();
      return { success: true, message: 'Registration withdrawn.' };
    }

    return fail('Method not allowed.');
  }

  function buildStandings(results) {
    const table = {};
    const apply = (row, forGoals, against) => {
      row.played += 1;
      row.gf += forGoals;
      row.ga += against;
      if (forGoals > against) { row.won += 1; row.points += 3; }
      else if (forGoals === against) { row.drawn += 1; row.points += 1; }
      else { row.lost += 1; }
    };
    results.forEach((m) => {
      [m.team_a, m.team_b].forEach((team) => {
        if (!table[team]) table[team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      });
      apply(table[m.team_a], m.score_a, m.score_b);
      apply(table[m.team_b], m.score_b, m.score_a);
    });
    const list = Object.values(table);
    list.forEach((s) => { s.gd = s.gf - s.ga; });
    list.sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
    return list;
  }

  function resultsApi(method, query, body) {
    const db = load();

    if (method === 'GET') {
      const tid = Number(query.get('tournament_id')) || null;
      const sport = query.get('sport') || '';
      const rows = db.results
        .map((r) => {
          const t = db.tournaments.find((x) => x.id === r.tournament_id);
          return { ...r, tournament_name: t ? t.name : '', sport: t ? t.sport : '' };
        })
        .filter((r) => (!tid || r.tournament_id === tid) && (!sport || r.sport === sport));
      rows.sort((a, b) => b.played_on.localeCompare(a.played_on) || b.id - a.id);
      return { success: true, data: { results: rows, standings: tid ? buildStandings(rows) : [] } };
    }

    if (!window.MOCK_ADMIN) fail('Admin access required.');

    if (method === 'POST') {
      const tid = Number(body.tournament_id);
      const teamA = String(body.team_a || '').trim();
      const teamB = String(body.team_b || '').trim();
      const scoreA = Number(body.score_a);
      const scoreB = Number(body.score_b);
      const playedOn = String(body.played_on || '').trim();
      const round = String(body.round_label || '').trim();

      if (!tid) fail('Choose a tournament.');
      if (!teamA || !teamB) fail('Both team names are required.');
      if (teamA.length > 120 || teamB.length > 120) fail('Team names are too long (max 120 characters).');
      if (teamA.toLowerCase() === teamB.toLowerCase()) fail('A team cannot play against itself.');
      if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) fail('Scores must be whole numbers (0 or more).');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(playedOn) || Number.isNaN(new Date(`${playedOn}T00:00:00`).getTime())) fail('Enter a valid match date.');
      if (round.length > 60) fail('Round label is too long (max 60 characters).');
      if (!db.tournaments.some((t) => t.id === tid)) fail('Tournament not found.');

      const id = db.nextResultId++;
      db.results.push({ id, tournament_id: tid, round_label: round, team_a: teamA, team_b: teamB, score_a: scoreA, score_b: scoreB, played_on: playedOn });
      save();
      return { success: true, message: 'Result recorded.', id };
    }

    if (method === 'DELETE') {
      const id = Number(query.get('id'));
      if (!id) fail('id is required.');
      const idx = db.results.findIndex((r) => r.id === id);
      if (idx === -1) fail('Result not found.');
      db.results.splice(idx, 1);
      save();
      return { success: true, message: 'Result deleted.' };
    }

    return fail('Method not allowed.');
  }

  window.mockApi = function (endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const [path, qs = ''] = endpoint.split('?');
          const query = new URLSearchParams(qs);
          const method = String(options.method || 'GET').toUpperCase();
          const body = options.body ? JSON.parse(options.body) : {};
          let result;
          if (path === 'tournaments.php') result = tournamentsApi(method, query, body);
          else if (path === 'results.php') result = resultsApi(method, query, body);
          else throw new Error(`Mock API: unknown endpoint "${path}"`);
          resolve(JSON.parse(JSON.stringify(result)));
        } catch (err) {
          reject(err);
        }
      }, 150);
    });
  };

  /* Type resetMockData() in the browser console to restore the sample data. */
  window.resetMockData = function () {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    memory = null;
    window.location.reload();
  };
})();