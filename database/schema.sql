CREATE TABLE IF NOT EXISTS users {
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
};

CREATE TABLE IF NOT EXISTS clubs {
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
    CONSTRAINT clubs_manager_fk FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE
};

CREATE TABLE IF NOT EXISTS schedules {
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
};

CREATE TABLE IF NOT EXISTS tournaments {
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
};

CREATE TABLE IF NOT EXISTS facilities {
    name VARCHAR(64) NOT NULL,
    PRIMARY KEY (name)
};

INSERT INTO facilities (name) VALUES
    ('Indoor Court'),
    ('Main Ground'),
    ('Swimming Pool'),
    ('Gymnasium'),
    ('Phase 2 Ground')
ON DUPLICATE KEY UPDATE name = facilities.name;