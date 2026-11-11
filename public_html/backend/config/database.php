<?php
declare(strict_types=1);

ini_set('display_errors', '0');
set_exception_handler(static function (Throwable $error): void {
    json_error('The server could not complete the request. Please try again later.', 500);
});

if (is_file(__DIR__ . '/env.local.php')) {
    require_once __DIR__ . '/env.local.php';
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
validate_request_origin($secure);
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
function validate_request_origin(bool $secure): void {
    if (!in_array(request_method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) return;

    $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($source !== '') {
        $origin = parse_url($source);
        $target = parse_url(($secure ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? ''));
        $originScheme = strtolower($origin['scheme'] ?? '');
        $targetScheme = $secure ? 'https' : 'http';
        if (!$origin || !$target || $originScheme !== $targetScheme
            || strtolower($origin['host'] ?? '') !== strtolower($target['host'] ?? '')
            || ($origin['port'] ?? ($originScheme === 'https' ? 443 : 80)) !== ($target['port'] ?? ($secure ? 443 : 80))) {
            json_error('Cross-origin requests are not allowed.', 403);
        }
    } elseif (in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['cross-site', 'same-site'], true)) {
        json_error('Cross-origin requests are not allowed.', 403);
    }

    if (in_array(request_method(), ['POST', 'PUT', 'PATCH'], true)) {
        $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($contentType !== 'application/json') json_error('Content-Type must be application/json.', 415);
    }
}
function read_json_body(): array {
    $raw = trim(file_get_contents('php://input') ?: '');
    try {
        $value = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        json_error('A valid JSON object is required.', 400);
    }
    if (($raw[0] ?? '') !== '{' || !is_array($value)) json_error('A valid JSON object is required.', 400);
    return $value;
}
function clean_text(mixed $value): string {
    if ($value !== null && !is_scalar($value)) json_error('Text fields must contain scalar values.', 400);
    return trim(strip_tags((string) ($value ?? '')));
}
function text_length(string $value): int { return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value); }
function to_id(mixed $value): ?int {
    if ((!is_int($value) && !is_string($value)) || !preg_match('/^[1-9][0-9]*$/D', (string) $value)) return null;
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    return $id === false ? null : $id;
}
function to_count(mixed $value): ?int {
    if ((!is_int($value) && !is_string($value)) || !preg_match('/^(0|[1-9][0-9]*)$/D', (string) $value)) return null;
    $count = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 4294967295]]);
    return $count === false ? null : $count;
}

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
