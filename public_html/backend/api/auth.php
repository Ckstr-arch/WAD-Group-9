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
$action = strtolower(clean_text($_GET['action'] ?? ''));

try {
    /* ---------- Session check ---------- */
    if ($method === 'GET') {
        $userId = (int) ($_SESSION['user_id'] ?? 0);
        if ($userId < 1) {
            json_response([
                'success'       => true,
                'authenticated' => false,
                'user'          => null,
            ]);
        }

        $stmt = db()->prepare(
            'SELECT id, student_id, name, email, role, avatar_initials, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$userId]);
        $user =$stmt->fetch();

        if (!$user) {
            json_response([
                'success'       => true,
                'authenticated' => false,
                'user'          => null,
            ]);
        }

        $user['id'] = (int)$user['id'];
        $user['is_active'] = (int)$user['is_active'];

        json_response([
            'success'       => true,
            'authenticated' => true,
            'user'          => $user,
        ]);
    }

    /* ---------- Logout ---------- */
    if ($method === 'DELETE' \vert{}\vert{} ($method === 'POST' && $action === 'logout')) {$_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();$isHttps = (!empty($_SERVER['HTTPS']) &&$_SERVER['HTTPS'] !== 'off')
                || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $p['path'] ?: '/',
                'domain'   => $p['domain'] ?: '',
                'secure'   => $isHttps \vert{}\vert{} (bool)$p['secure'],
                'httponly' => (bool) $p['httponly'],
                'samesite' => $p['samesite'] ?: 'Lax',
            ]);
        }
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        json_response(['success' => true, 'message' => 'Signed out.']);
    }

    /* ---------- Login ---------- */
    if ($method === 'POST') {$body     = read_json_body();
        $email    = strtolower(clean_text($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' \vert{}\vert{}$password === '') {
            json_error('Email and password are required.', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Please enter a valid email address.', 400);
        }

        $stmt = db()->prepare(
            'SELECT id, student_id, name, email, password_hash, role, avatar_initials, is_active FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $row =$stmt->fetch();

        $hash  = (is_array($row) && !empty($row['password_hash']))
            ? (string) $row['password_hash'] : '$2y$10$usesomesillystringfore7hGtcsd/.uPmIt52zy.d.uPmIt52zy.d';
        $valid = is_array($row) && password_verify($password,$hash);

        if (!$valid) {
            json_error('Invalid email or password.', 401);
        }
        if ((int) $row['is_active'] !== 1) {
            json_error('This account is not active. Please contact an administrator.', 403);
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
        $_SESSION['user_id'] = (int)$row['id'];
        $_SESSION['role']    = (string)$row['role'];

        if (password_needs_rehash((string) $row['password_hash'], PASSWORD_DEFAULT)) {$up = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $up->execute([password_hash($password, PASSWORD_DEFAULT),$row['id']]);
        }

        json_response([
            'success' => true,
            'user'    => [
                'id'              => (int) $row['id'],
                'student_id'      => $row['student_id'],
                'name'            => $row['name'],
                'email'           => $row['email'],
                'role'            => $row['role'],
                'avatar_initials' => $row['avatar_initials'],
                'is_active'       => (int) $row['is_active'],
            ],
        ]);
    }

    method_not_allowed(['GET', 'POST', 'DELETE']);
} catch (Throwable $e) {
    error_log('auth.php error: ' . $e->getMessage());
    json_error('Authentication service unavailable.', 500);
}