<?php
/**
 * api/auth.php
 *   POST   { email, password }      -> login
 *   GET                             -> session check (current user)
 *   POST   ?action=logout | DELETE  -> logout
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

if (!function_exists('request_method')) {
    function request_method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }
}

if (!function_exists('current_user')) {
    function current_user(): ?array
    {
        $userId = (int) ($_SESSION['user_id'] ?? 0);
        if ($userId < 1) {
            return null;
        }

        $stmt = db()->prepare(
            'SELECT id, student_id, name, email, role, avatar_initials, is_active FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        return $user ?: null;
    }
}

$method = request_method();
$action = strtolower((string) ($_GET['action'] ?? ''));

/* ---------- Session check ---------- */
if ($method === 'GET') {
    $user = current_user();
    if ($user === null || !(int) $user['is_active']) json_error('Not authenticated.', 401);
    json_response(['success' => true, 'user' => $user]);
}

/* ---------- Logout ---------- */
if ($method === 'DELETE' || ($method === 'POST' && $action === 'logout')) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires'  => time() - 42000,
            'path'     => $p['path'],
            'domain'   => $p['domain'],
            'secure'   => $p['secure'],
            'httponly' => $p['httponly'],
            'samesite' => $p['samesite'] ?: 'Lax',
        ]);
    }
    session_destroy();
    json_response(['success' => true, 'message' => 'Signed out.']);
}

/* ---------- Login ---------- */
if ($method === 'POST') {
    $body     = read_json_body();
    $email    = strtolower(clean_text($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!is_string($password)) json_error('Password must be a string.', 400);

    if ($email === '' || $password === '') {
        json_error('Email and password are required.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Please enter a valid email address.', 400);
    }

    $pdo = db();
    $limiterKey = hash('sha256', $email . "\0" . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $pdo->beginTransaction();
    try {
        // Lock one account/IP counter so parallel requests cannot bypass the limit.
        $stmt = $pdo->prepare('INSERT INTO login_attempts (limiter_key, failures, window_started_at) VALUES (?, 0, NOW()) ON DUPLICATE KEY UPDATE limiter_key = login_attempts.limiter_key');
        $stmt->execute([$limiterKey]);
        $stmt = $pdo->prepare('SELECT failures, blocked_until, TIMESTAMPDIFF(SECOND, window_started_at, NOW()) AS elapsed, TIMESTAMPDIFF(SECOND, NOW(), blocked_until) AS retry_after FROM login_attempts WHERE limiter_key = ? FOR UPDATE');
        $stmt->execute([$limiterKey]);
        $attempt = $stmt->fetch();
        $retryAfter = (int) ($attempt['retry_after'] ?? 0);
        if ($retryAfter > 0) {
            $pdo->rollBack();
            header('Retry-After: ' . $retryAfter);
            json_error('Too many login attempts. Please try again later.', 429);
        }
        if ((int) $attempt['elapsed'] >= 900 || $attempt['blocked_until'] !== null) {
            $stmt = $pdo->prepare('UPDATE login_attempts SET failures = 0, window_started_at = NOW(), blocked_until = NULL WHERE limiter_key = ?');
            $stmt->execute([$limiterKey]);
            $attempt['failures'] = 0;
        }

        $stmt = $pdo->prepare(
            'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $row = $stmt->fetch();

        // Verify a hash for unknown accounts too.
        $hash = $row['password_hash'] ?? password_hash('timing-equaliser', PASSWORD_DEFAULT);
        $valid = password_verify($password, $hash) && $row !== false;
        if (!$valid) {
            $failures = (int) $attempt['failures'] + 1;
            $stmt = $pdo->prepare('UPDATE login_attempts SET failures = ?, blocked_until = CASE WHEN ? >= 5 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE) ELSE NULL END WHERE limiter_key = ?');
            $stmt->execute([$failures, $failures, $limiterKey]);
            $pdo->commit();
            json_error('Invalid email or password.', 401);
        }

        $stmt = $pdo->prepare('UPDATE login_attempts SET failures = 0, window_started_at = NOW(), blocked_until = NULL WHERE limiter_key = ?');
        $stmt->execute([$limiterKey]);
        if (!(int) $row['is_active']) {
            $pdo->commit();
            json_error('This account is not active. Please contact an administrator.', 403);
        }
        if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
            $up = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $up->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }

    session_regenerate_id(true);               // prevent session fixation
    $_SESSION['user_id'] = (int) $row['id'];

    json_response([
        'success' => true,
        'user'    => [
            'id'     => (int) $row['id'],
            'name'   => $row['name'],
            'email'  => $row['email'],
            'role'   => $row['role'],
            'is_active' => (int) $row['is_active'],
        ],
    ]);
}

method_not_allowed(['GET', 'POST', 'DELETE']);
