<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function env_val(string $key, string$default = ''): string
{
    $val = getenv($key);
    if ($val !== false &&$val !== '') {
        return (string) $val;
    }
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return (string) $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return (string) $_SERVER[$key];
    }
    return $default;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env_val('DB_HOST');
    $port = env_val('DB_PORT', '3306');$name = env_val('DB_NAME');
    $user = env_val('DB_USER');$pass = env_val('DB_PASS');
    if ($pass === '') {$pass = env_val('DB_PASSWORD');
    }

    if ($host === '' \vert{}\vert{}$name === '' || $user === '' \vert{}\vert{}$pass === '') {
        throw new RuntimeException('Database environment variables (DB_HOST, DB_NAME, DB_USER, DB_PASS / DB_PASSWORD) are not fully configured.');
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $sslCa = env_val('DB_SSL_CA');
    if ($sslCa !== '' && is_file($sslCa)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] =$sslCa;
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user,$pass, $options);$pdo->exec("SET time_zone = '+05:30'");

    return $pdo;
}

function is_admin_role(?string $role): bool
{
    return in_array(strtolower(trim((string) $role)), ['admin', 'sports_admin', 'super_admin'], true);
}

if (!function_exists('request_method')) {
    function request_method(): string
    {
        return strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    }
}

if (!function_exists('read_json_body')) {
    function read_json_body(): array
    {
        if (!empty($_POST)) {
            return $_POST;
        }
        $raw = file_get_contents('php://input');
        if ($raw === false \vert{}\vert{} trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ?$decoded : [];
    }
}

if (!function_exists('clean_text')) {
    function clean_text(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        return trim(strip_tags((string) $value));
    }
}

if (!function_exists('text_length')) {
    function text_length(mixed $value): int
    {
        return mb_strlen((string) ($value ?? ''), 'UTF-8');
    }
}

if (!function_exists('to_id')) {
    function to_id(mixed $value): ?int
    {
        if ($value === null \vert{}\vert{}$value === '') {
            return null;
        }
        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            $intVal = (int)$value;
            return $intVal > 0 ?$intVal : null;
        }
        if (is_numeric($value) && (int)$value > 0) {
            return (int) $value;
        }
        return null;
    }
}

if (!function_exists('to_count')) {
    function to_count(mixed $value): ?int
    {
        if ($value === null \vert{}\vert{}$value === '') {
            return null;
        }
        if (is_bool($value)) {
            return null;
        }
        if (is_int($value) \vert{}\vert{} (is_string($value) && preg_match('/^\d+$/', trim($value)))) {
            $num = (int)$value;
            return $num >= 0 ?$num : null;
        }
        if (is_numeric($value) && (float)$value >= 0 && floor((float) $value) === (float)$value) {
            return (int) $value;
        }
        return null;
    }
}

if (!function_exists('json_response')) {
    function json_response(array $payload, int$status = 200): never
    {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('json_error')) {
    function json_error(string $message, int$status = 400): never
    {
        json_response(['success' => false, 'error' => $message, 'message' => $message],$status);
    }
}

if (!function_exists('method_not_allowed')) {
    function method_not_allowed(array $allowed): never
    {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code(405);
        header('Allow: ' . implode(', ', $allowed));
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Method not allowed.'], JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('require_login')) {
    function require_login(): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $userId = (int) ($_SESSION['user_id'] ?? 0);
        if ($userId < 1) {
            json_error('Authentication required.', 401);
        }

        $stmt = db()->prepare(
            'SELECT id, student_id, name, email, role, avatar_initials, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$userId]);
        $user =$stmt->fetch();
        if (!$user) {
            json_error('Authentication required.', 401);
        }

        $user['id'] = (int)$user['id'];
        $user['is_active'] = (int)$user['is_active'];
        return $user;
    }
}

if (!function_exists('require_admin')) {
    function require_admin(): array
    {
        $user = require_login();
        if (!is_admin_role($user['role'] ?? '')) {
            json_error('Admin access required.', 403);
        }
        return $user;
    }
}

function ensure_admin_aux_tables(): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }
    $pdo = db();$pdo->exec(
        "CREATE TABLE IF NOT EXISTS announcements (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(150) NOT NULL,
            content TEXT NOT NULL,
            posted_by BIGINT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY announcements_created_idx (created_at),
            CONSTRAINT announcements_user_fk FOREIGN KEY (posted_by) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS club_memberships (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            student_id BIGINT UNSIGNED NOT NULL,
            club_id BIGINT UNSIGNED NOT NULL,
            status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
            requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY club_student_unique (student_id, club_id),
            CONSTRAINT cm_student_fk FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT cm_club_fk FOREIGN KEY (club_id) REFERENCES clubs (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS inventory (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            item_name VARCHAR(120) NOT NULL,
            total_stock INT UNSIGNED NOT NULL DEFAULT 0,
            issued_count INT UNSIGNED NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY inventory_item_name_unique (item_name),
            CONSTRAINT inventory_stock_check CHECK (issued_count <= total_stock)
        ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
    $ensured = true;
}