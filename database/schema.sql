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

