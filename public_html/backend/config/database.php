<?php
declare(strict_types=1);

if (is_file(__DIR__ . '/env.local.php')) {
    require_once __DIR__ . '/env.local.php';
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function db(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = defined('DB_DSN') ? DB_DSN : (getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;dbname=campus;charset=utf8mb4');
    $user = defined('DB_USER') ? DB_USER : (getenv('DB_USER') ?: 'root');
    $pass = defined('DB_PASS') ? DB_PASS : (getenv('DB_PASS') ?: '');
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function request_method(): string { return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'); }
function read_json_body(): array {
    $value = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($value) ? $value : [];
}
function clean_text(mixed $value): string { return trim(strip_tags((string) ($value ?? ''))); }
function text_length(string $value): int { return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value); }
function to_id(mixed $value): ?int { return is_numeric($value) && (int) $value > 0 ? (int) $value : null; }
function to_count(mixed $value): ?int { return is_numeric($value) && (int) $value >= 0 && (string) (int) $value === (string) $value ? (int) $value : null; }

function json_response(array $payload, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}
function json_error(string $message, int $status = 400): never { json_response(['success' => false, 'error' => $message], $status); }
function method_not_allowed(array $allowed): never {
    header('Allow: ' . implode(', ', $allowed));
    json_error('Method not allowed.', 405);
}
function current_user(): ?array {
    $id = to_id($_SESSION['user_id'] ?? null);
    if ($id === null) return null;
    $stmt = db()->prepare('SELECT id, student_id, name, email, role, avatar_initials, is_active FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    return $user ?: null;
}
function require_login(): array {
    $user = current_user();
    if (!$user || !(int) $user['is_active']) json_error('Authentication required.', 401);
    return $user;
}
function require_admin(): array {
    $user = require_login();
    if (!in_array($user['role'], ['sports_admin', 'super_admin'], true)) json_error('Administrator access required.', 403);
    return $user;
}
