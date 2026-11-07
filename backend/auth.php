<?php
/**
 * api/auth.php
 *   POST   { email, password }      -> login
 *   GET                             -> session check (current user)
 *   POST   ?action=logout | DELETE  -> logout
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

$method = request_method();
$action = strtolower((string) ($_GET['action'] ?? ''));

/* ---------- Session check ---------- */
if ($method === 'GET') {
    $user = current_user();
    if ($user === null) {
        json_error('Not authenticated.', 401);
    }
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
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        json_error('Email and password are required.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Please enter a valid email address.', 400);
    }

    $stmt = db()->prepare(
        'SELECT id, name, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    // Always run one password_verify so response time doesn't reveal whether the email exists
    $hash  = $row['password_hash'] ?? password_hash('timing-equaliser', PASSWORD_DEFAULT);
    $valid = password_verify($password, $hash) && $row !== false;

    if (!$valid) {
        json_error('Invalid email or password.', 401);
    }
    if ($row['status'] !== 'approved') {
        json_error('This account is not active. Please contact an administrator.', 403);
    }

    session_regenerate_id(true);               // prevent session fixation
    $_SESSION['user_id'] = (int) $row['id'];

    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        $up = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $up->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
    }

    json_response([
        'success' => true,
        'user'    => [
            'id'     => (int) $row['id'],
            'name'   => $row['name'],
            'email'  => $row['email'],
            'role'   => $row['role'],
            'status' => $row['status'],
        ],
    ]);
}

method_not_allowed(['GET', 'POST', 'DELETE']);
