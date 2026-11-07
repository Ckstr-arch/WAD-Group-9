--This is used only for local development and testing purposes. It will not be used in production.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET @seedDate = CURRENT_DATE();
SET @studentPasswordHash = '$2y$12$.CcDVyXFaS1Y5p3FXo.KFOLtbvLHDHJioMJ6vd6MSyAeOTiPPvSfi';
SET @adminPasswordHash = '$2y$12$diX69Na5Wwrj3Y27hMnbheza9Q9qE7F/.WBS3370cwKYHawVdk8FW';
START TRANSACTION;

INSERT INTO users (student_id, name, email, password_hash, role, avatar_initials, is_active) VALUES
    ('NSBM001', 'Chanupa Bandarage', 'student@nsbm.ac.lk', @studentPasswordHash, 'student', 'CB', 1),
    ('NSBM002', 'Nethmi Perera', 'clubmanager@nsbm.ac.lk', @studentPasswordHash, 'club_manager', 'NP', 1),
    ('STAFF001', 'Kasun Jayawardena', 'admin@nsbm.ac.lk', @adminPasswordHash, 'sports_admin', 'KJ', 1),
    ('STAFF002', 'Dilani Fernando', 'superadmin@nsbm.ac.lk', @adminPasswordHash, 'super_admin', 'DF', 1)
ON DUPLICATE KEY UPDATE id = users.id;

SET @studentId = (SELECT id FROM users WHERE email = 'student@nsbm.ac.lk');
SET @managerId = (SELECT id FROM users WHERE email = 'clubmanager@nsbm.ac.lk');
SET @adminId = (SELECT id FROM users WHERE email = 'admin@nsbm.ac.lk');

INSERT INTO facilities (name) VALUES
    ('Main Ground'),
    ('Indoor Court'),
    ('Gymnasium'),
    ('Student Activity Centre'),
    ('Swimming Pool'), 
    ('Phase 2 Ground')
ON DUPLICATE KEY UPDATE name = facilities.name;

INSERT INTO clubs (name, sport, president, description, member_count, status, logo_url, manager_id) VALUES
    ('Basketball Club', 'Basketball', 'Nethmi Perera', 'Build teamwork through regular court practice and interfaculty basketball.', 46, 'active', NULL, @managerId),
    ('Football Club', 'Football', 'Tharindu Silva', 'Join weekly football training and represent NSBM at university fixtures.', 52, 'active', NULL, @managerId),
    ('Cricket Club', 'Cricket', 'Dinuka Jayasinghe', 'Develop batting, bowling and fielding skills with the university cricket community.', 64, 'active', NULL, NULL),
    ('Rugby Club', 'Rugby', 'Kavindu Ranasinghe', 'Train safely as a team and prepare for the university rugby season.', 31, 'active', NULL, NULL),
    ('Volleyball Club', 'Volleyball', 'Ishara Gunasekara', 'Enjoy social volleyball, structured practice and interfaculty competition.', 38, 'active', NULL, NULL),
    ('Badminton Club', 'Badminton', 'Senuri Wijesinghe', 'Improve singles and doubles play with beginners and experienced players.', 29, 'active', NULL, NULL),
    ('Tennis Club', 'Tennis', 'Hasini Wickramasinghe', 'Practise tennis technique and enjoy friendly matches on campus.', 24, 'active', NULL, NULL),
    ('Swimming Club', 'Swimming', 'Malith Dissanayake', 'Build fitness and swimming technique in supervised university sessions.', 42, 'active', NULL, NULL),
    ('Athletics Club', 'Athletics', 'Pavithra Madushani', 'Train for track and field events with the campus athletics team.', 61, 'active', NULL, NULL),
    ('Table Tennis Club', 'Table Tennis', 'Ravindu Amarasinghe', 'Join friendly table tennis sessions and competitive university events.', 26, 'active', NULL, NULL),
    ('Chess Club', 'Chess', 'Dulani Karunaratne', 'Study tactics, meet fellow players and compete in rapid chess events.', 33, 'active', NULL, NULL),
    ('Karate Club', 'Karate', 'Chamod Lakshan', 'Develop discipline, coordination and karate technique in guided sessions.', 21, 'active', NULL, NULL),
    ('Taekwondo Club', 'Taekwondo', 'Hiruni Seneviratne', 'Practise taekwondo fundamentals and prepare for university competitions.', 18, 'active', NULL, NULL),
    ('Netball Club', 'Netball', 'Anjali Rathnayake', 'Build passing, movement and teamwork with the university netball squad.', 35, 'active', NULL, NULL),
    ('Hockey Club', 'Hockey', 'Sahan Ekanayake', 'Learn hockey skills and train with the university team on the main ground.', 23, 'active', NULL, NULL)
ON DUPLICATE KEY UPDATE id = clubs.id;

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Basketball', 'Basketball evening training', DATE_ADD(@seedDate, INTERVAL 1 DAY), '16:00', '18:00', 'Indoor Court', 'NSBM development squad', 'scheduled', 'Dribbling, shooting and defensive drills.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Basketball evening training');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Football', 'Football team practice', DATE_ADD(@seedDate, INTERVAL 2 DAY), '15:30', '17:30', 'Main Ground', 'NSBM football squad', 'scheduled', 'Fitness, passing patterns and small-sided games.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Football team practice');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Cricket', 'Cricket nets and fielding', DATE_ADD(@seedDate, INTERVAL 3 DAY), '08:00', '10:00', 'Phase 2 Ground', 'NSBM cricket squad', 'scheduled', 'Batting nets followed by catching and ground fielding.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Cricket nets and fielding');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Badminton', 'Badminton doubles practice', DATE_ADD(@seedDate, INTERVAL 2 DAY), '17:00', '19:00', 'Indoor Court', 'Mixed doubles squad', 'scheduled', 'Footwork, rotation and match practice.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Badminton doubles practice');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Swimming', 'Swimming technique session', DATE_ADD(@seedDate, INTERVAL 4 DAY), '07:00', '08:30', 'Swimming Pool', 'NSBM swimming squad', 'scheduled', 'Supervised technique and endurance sets.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Swimming technique session');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Tennis', 'Tennis singles training', DATE_ADD(@seedDate, INTERVAL 5 DAY), '15:00', '17:00', 'Indoor Court', 'NSBM tennis squad', 'scheduled', 'Serve placement and singles point construction.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Tennis singles training');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Volleyball', 'Interfaculty volleyball friendly', DATE_ADD(@seedDate, INTERVAL 6 DAY), '14:00', '16:00', 'Main Ground', 'Computing vs Business', 'scheduled', 'Friendly preparation match before the interfaculty season.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Interfaculty volleyball friendly');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Athletics', 'Track conditioning session', DATE_ADD(@seedDate, INTERVAL 7 DAY), '06:30', '08:00', 'Main Ground', 'Track and field squad', 'scheduled', 'Warm-up, sprint technique and endurance intervals.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Track conditioning session');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Netball', 'Netball passing and movement', DATE_ADD(@seedDate, INTERVAL 8 DAY), '16:00', '18:00', 'Indoor Court', 'NSBM netball squad', 'scheduled', 'Court movement, passing combinations and shooting.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Netball passing and movement');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Chess', 'Campus rapid chess practice', DATE_ADD(@seedDate, INTERVAL 9 DAY), '12:30', '14:30', 'Student Activity Centre', 'Open campus practice', 'scheduled', 'Rapid games followed by analysis.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Campus rapid chess practice');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Rugby', 'Rugby pre-season fitness', DATE_ADD(@seedDate, INTERVAL -3 DAY), '16:00', '18:00', 'Phase 2 Ground', 'NSBM rugby squad', 'completed', 'Completed conditioning and handling session.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Rugby pre-season fitness');

INSERT INTO schedules (sport, event_name, event_date, start_time, end_time, location, teams, status, description)
SELECT 'Karate', 'Karate fundamentals workshop', DATE_ADD(@seedDate, INTERVAL -1 DAY), '17:00', '19:00', 'Gymnasium', 'NSBM karate club', 'completed', 'Completed introductory kata and technique workshop.'
WHERE NOT EXISTS (SELECT id FROM schedules WHERE event_name = 'Karate fundamentals workshop');

INSERT INTO tournaments (name, sport, start_date, end_date, format, max_teams, registered_teams, status, description)
SELECT 'NSBM Interfaculty Basketball Championship', 'Basketball', DATE_ADD(@seedDate, INTERVAL 14 DAY), DATE_ADD(@seedDate, INTERVAL 15 DAY), 'Round robin', 8, 6, 'registration_open', 'Faculty teams compete for the campus basketball title.'
WHERE NOT EXISTS (SELECT id FROM tournaments WHERE name = 'NSBM Interfaculty Basketball Championship');

INSERT INTO tournaments (name, sport, start_date, end_date, format, max_teams, registered_teams, status, description)
SELECT 'NSBM Green University Football Cup', 'Football', DATE_ADD(@seedDate, INTERVAL 21 DAY), DATE_ADD(@seedDate, INTERVAL 23 DAY), 'Knockout', 16, 10, 'registration_open', 'A university football competition celebrating teamwork and fair play.'
WHERE NOT EXISTS (SELECT id FROM tournaments WHERE name = 'NSBM Green University Football Cup');

INSERT INTO tournaments (name, sport, start_date, end_date, format, max_teams, registered_teams, status, description)
SELECT 'NSBM Interfaculty Cricket Sixes', 'Cricket', DATE_ADD(@seedDate, INTERVAL 28 DAY), DATE_ADD(@seedDate, INTERVAL 29 DAY), 'Group stage and knockout', 12, 8, 'upcoming', 'Six-a-side cricket featuring teams from all faculties.'
WHERE NOT EXISTS (SELECT id FROM tournaments WHERE name = 'NSBM Interfaculty Cricket Sixes');

INSERT INTO tournaments (name, sport, start_date, end_date, format, max_teams, registered_teams, status, description)
SELECT 'NSBM Campus Badminton Open', 'Badminton', DATE_ADD(@seedDate, INTERVAL 10 DAY), DATE_ADD(@seedDate, INTERVAL 11 DAY), 'Singles and doubles knockout', 24, 16, 'registration_open', 'Open badminton competition for registered NSBM students.'
WHERE NOT EXISTS (SELECT id FROM tournaments WHERE name = 'NSBM Campus Badminton Open');

INSERT INTO tournaments (name, sport, start_date, end_date, format, max_teams, registered_teams, status, description)
SELECT 'NSBM Previous Semester Chess Rapid', 'Chess', DATE_ADD(@seedDate, INTERVAL -21 DAY), DATE_ADD(@seedDate, INTERVAL -21 DAY), 'Swiss', 32, 24, 'completed', 'Completed development example of the previous semester rapid tournament.'
WHERE NOT EXISTS (SELECT id FROM tournaments WHERE name = 'NSBM Previous Semester Chess Rapid');

INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
SELECT 'Main Ground', @studentId, 'Football', DATE_ADD(@seedDate, INTERVAL 4 DAY), '15:00', '17:00', 'pending', 'NSBM development reservation: Computing football practice.'
WHERE NOT EXISTS (SELECT id FROM bookings WHERE notes = 'NSBM development reservation: Computing football practice.');

INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
SELECT 'Indoor Court', @managerId, 'Basketball', DATE_ADD(@seedDate, INTERVAL 3 DAY), '16:00', '18:00', 'confirmed', 'NSBM development reservation: Basketball team practice.'
WHERE NOT EXISTS (SELECT id FROM bookings WHERE notes = 'NSBM development reservation: Basketball team practice.');

INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
SELECT 'Swimming Pool', @studentId, 'Swimming', DATE_ADD(@seedDate, INTERVAL 5 DAY), '07:00', '08:00', 'pending', 'NSBM development reservation: Student swimming practice.'
WHERE NOT EXISTS (SELECT id FROM bookings WHERE notes = 'NSBM development reservation: Student swimming practice.');

INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
SELECT 'Indoor Court', @managerId, 'Badminton', DATE_ADD(@seedDate, INTERVAL 6 DAY), '17:00', '19:00', 'confirmed', 'NSBM development reservation: Interfaculty doubles preparation.'
WHERE NOT EXISTS (SELECT id FROM bookings WHERE notes = 'NSBM development reservation: Interfaculty doubles preparation.');

INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
SELECT 'Gymnasium', @studentId, 'Fitness', DATE_ADD(@seedDate, INTERVAL -2 DAY), '16:00', '17:00', 'completed', 'NSBM development reservation: Completed fitness session.'
WHERE NOT EXISTS (SELECT id FROM bookings WHERE notes = 'NSBM development reservation: Completed fitness session.');

INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
SELECT 'Indoor Court', @adminId, 'Tennis', DATE_ADD(@seedDate, INTERVAL 7 DAY), '15:00', '17:00', 'cancelled', 'NSBM development reservation: Cancelled tennis practice.'
WHERE NOT EXISTS (SELECT id FROM bookings WHERE notes = 'NSBM development reservation: Cancelled tennis practice.');

COMMIT;