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
