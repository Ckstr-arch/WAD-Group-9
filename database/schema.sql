SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id VARCHAR(16) NOT NULL, --Yet to verify
    name VARCHAR(200) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'club_manager', 'sports_admin', 'super_admin') NOT NULL DEFAULT 'student',
    avatar_initials VARCHAR(8) NOT NULL DEFAULT '',
    is_active TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY users_student_id_unique (student_id),
    UNIQUE KEY users_email_unique (email),
    KEY users_role_active_idx (role, is_active),
    CONSTRAINT users_active_check CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clubs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    sport VARCHAR(80) NOT NULL,
    president VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    member_count INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    logo_url VARCHAR(2048) NULL,
    manager_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY clubs_name_unique (name),
    KEY clubs_sport_idx (sport),
    KEY clubs_status_idx (status),
    KEY clubs_manager_idx (manager_id),
    CONSTRAINT clubs_manager_fk FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sport VARCHAR(80) NOT NULL,
    event_name VARCHAR(160) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(160) NOT NULL,
    teams VARCHAR(255) NOT NULL DEFAULT '',
    status ENUM('scheduled', 'live', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY schedules_event_date_idx (event_date, start_time),
    KEY schedules_status_idx (status),
    KEY schedules_sport_idx (sport),
    CONSTRAINT schedules_time_check CHECK (start_time >= '00:00:00' AND end_time <= '23:59:59' AND end_time > start_time)
)  ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tournaments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    sport VARCHAR(80) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    format VARCHAR(80) NOT NULL,
    max_teams INT UNSIGNED NOT NULL,
    registered_teams INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('registration_open', 'upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'registration_open',
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY tournaments_start_date_idx (start_date),
    KEY tournaments_status_idx (status),
    KEY tournaments_sport_idx (sport),
    CONSTRAINT tournaments_date_check CHECK (end_date >= start_date),
    CONSTRAINT tournaments_teams_check CHECK (max_teams > 0 AND registered_teams <= max_teams)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS facilities (
    name VARCHAR(64) NOT NULL,
    PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO facilities (name) VALUES
    ('Indoor Court'),
    ('Main Ground'),
    ('Swimming Pool'),
    ('Gymnasium'),
    ('Phase 2 Ground')
ON DUPLICATE KEY UPDATE name = facilities.name;

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    facility VARCHAR(64) NOT NULL,
    booked_by BIGINT UNSIGNED NOT NULL,
    sport VARCHAR(80) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    notes TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY bookings_booking_date_idx (booking_date),
    KEY bookings_facility_interval_idx (facility, booking_date, status, start_time, end_time),
    KEY bookings_status_idx (status),
    KEY bookings_booked_by_idx (booked_by),
    CONSTRAINT bookings_user_fk FOREIGN KEY (booked_by) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT bookings_facility_fk FOREIGN KEY (facility) REFERENCES facilities (name) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT bookings_time_check CHECK (start_time >= '00:00:00' AND end_time <= '23:59:59' AND end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    limiter_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    failures INT UNSIGNED NOT NULL DEFAULT 0,
    window_started_at DATETIME NOT NULL,
    blocked_until DATETIME NULL,
    PRIMARY KEY (limiter_key),
    KEY login_attempts_window_idx (window_started_at)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Uses InnoDB for reliable data storage, utf8mb4 to support all Unicode characters, and a case-insensitive collation for text comparisons.