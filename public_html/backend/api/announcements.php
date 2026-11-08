<?php
/**
 * api/announcements.php
 *   GET  [?limit=20]          campus feed, newest first (any signed-in user)
 *   POST { title, content }   admin publishes an announcement ("body"/"message" accepted as aliases)
 * 
 * 11/8/2026 2.57 fixed variable mismatch in POST response query
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../helpers.php';

if (!function_exists('db')) {
    function db(): PDO {
        static $pdo = null;
        if ($pdo instanceof PDO) {
            return $pdo;
        }

        $dsn = getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;dbname=campus;charset=utf8mb4';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    }
}

if (!function_exists('require_login')) {
    function require_login(): array {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $userId = $_SESSION['user_id'] ?? null;
        if ($userId === null || $userId === '') {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Authentication required.'], JSON_UNESCAPED_SLASHES);
            exit;
        }

        return ['id' => (int) $userId, 'role' => $_SESSION['role'] ?? 'user'];
    }
}

if (!function_exists('require_admin')) {
    function require_admin(): array {
        $user = require_login();
        if (($user['role'] ?? 'user') !== 'admin') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Admin access required.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        return $user;
    }
}

if (!function_exists('read_json_body')) {
    function read_json_body(): array {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}

if (!function_exists('clean_text')) {
    function clean_text($value): string {
        if ($value === null) {
            return '';
        }
        return trim(strip_tags((string) $value));
    }
}

if (!function_exists('text_length')) {
    function text_length($value): int {
        return mb_strlen((string) $value, 'UTF-8');
    }
}

if (!function_exists('to_id')) {
    function to_id($value): ?int {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_numeric($value)) {
            return (int) $value;
        }
        return null;
    }
}

if (!function_exists('json_response')) {
    function json_response(array $payload, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('json_error')) {
    function json_error(string $message, int $status = 400): void {
        json_response(['success' => false, 'error' => $message], $status);
    }
}

if (!function_exists('method_not_allowed')) {
    function method_not_allowed(array $allowed): void {
        http_response_code(405);
        header('Allow: ' . implode(', ', $allowed));
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Method not allowed.'], JSON_UNESCAPED_SLASHES);
        exit;
    }
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$user   = require_login();

if ($method === 'GET') {
    $limit = to_id($_GET['limit'] ?? null) ?? 20;
    $limit = min($limit, 100);

    $stmt = db()->prepare(
        'SELECT a.id, a.title, a.content, a.posted_by, u.name AS posted_by_name, a.created_at
         FROM announcements a
         JOIN users u ON u.id = a.posted_by
         ORDER BY a.created_at DESC, a.id DESC
         LIMIT ?'
    );
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    json_response(['success' => true, 'data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $admin = require_admin();
    $body  = read_json_body();

    $title   = clean_text($body['title'] ?? '');
    $content = clean_text($body['content'] ?? $body['body'] ?? $body['message'] ?? '');

    if ($title === '' || $content === '') {
        json_error('Title and content are required.', 400);
    }
    if (text_length($title) > 150) {
        json_error('Title must be 150 characters or fewer.', 400);
    }
    if (text_length($content) > 5000) {
        json_error('Content must be 5000 characters or fewer.', 400);
    }

    $stmt = db()->prepare('INSERT INTO announcements (title, content, posted_by) VALUES (?, ?, ?)');
    $stmt->execute([$title, $content, $admin['id']]);
    $id = (int) db()->lastInsertId();

    $stmt = db()->prepare(
        'SELECT a.id, a.title, a.content, a.posted_by, u.name AS posted_by_name, a.created_at
         FROM announcements a JOIN users u ON u.id = a.posted_by WHERE a.id = ?'
    );
    $stmt->execute([$id]);
    json_response(['success' => true, 'data' => $stmt->fetch()], 201);
}

method_not_allowed(['GET', 'POST']);
