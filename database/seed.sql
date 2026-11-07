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