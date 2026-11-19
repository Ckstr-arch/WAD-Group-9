<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$method = request_method();

function make_initials(string $name): string
{
    $parts = preg_split('/[\s.]+/', trim($name)) ?: [];
    $initials = '';
    foreach ($parts as $part) {
        if ($part !== '') {
            $initials .= mb_strtoupper(mb_substr($part, 0, 1, 'UTF-8'), 'UTF-8');
        }
        if (mb_strlen($initials, 'UTF-8') >= 2) {
            break;
        }
    }
    return $initials !== '' ? $initials : 'ST';
}

function ensure_student_profile_columns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }

    $colsStmt = $pdo->query('SHOW COLUMNS FROM users');
    $existing = [];
    foreach ($colsStmt->fetchAll() as $col) {
        if (!empty($col['Field'])) {
            $existing[strtolower((string) $col['Field'])] = true;
        }
    }

    if (!isset($existing['faculty'])) {
        $pdo->exec('ALTER TABLE users ADD COLUMN faculty VARCHAR(120) NULL AFTER email');
    }
    if (!isset($existing['batch_number'])) {
        $pdo->exec('ALTER TABLE users ADD COLUMN batch_number VARCHAR(60) NULL AFTER faculty');
    }

    $checked = true;
}

function table_has_column(PDO $pdo, string $table, string $column): bool
{
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table) || !preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
        return false;
    }
    $stmt = $pdo->prepare('SHOW COLUMNS FROM `' . $table . '` LIKE ?');
    $stmt->execute([$column]);
    return (bool) $stmt->fetch();
}

function delete_user_and_dependencies(PDO $pdo, int $userId): bool
{
    $pdo->beginTransaction();
    try {
        $childTargets = [
            ['club_memberships', 'student_id'],
            ['club_memberships', 'user_id'],
            ['club_requests', 'student_id'],
            ['club_requests', 'user_id'],
            ['bookings', 'student_id'],
            ['bookings', 'user_id'],
            ['bookings', 'booked_by'],
            ['announcements', 'posted_by'],
            ['announcements', 'user_id'],
            ['clubs', 'created_by'],
            ['clubs', 'user_id'],
        ];

        foreach ($childTargets as [$table, $col]) {
            if (table_has_column($pdo, $table, $col)) {
                $stmt = $pdo->prepare('DELETE FROM `' . $table . '` WHERE `' . $col . '` = ?');
                $stmt->execute([$userId]);
            }
        }

        $del = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $del->execute([$userId]);
        $deleted = $del->rowCount() > 0;

        $pdo->commit();
        return $deleted;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

try {
    $pdo = db();
    ensure_student_profile_columns($pdo);

    if ($method === 'GET') {
        $search = strtolower(clean_text($_GET['search'] ?? ''));
        $status = strtolower(clean_text($_GET['status'] ?? ''));

        $sql = 'SELECT id, student_id, name, email, faculty, batch_number, role, avatar_initials, is_active, created_at
                FROM users
                WHERE 1=1';
        $params = [];

        if ($search !== '') {
            $sql .= ' AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(student_id) LIKE ? OR LOWER(COALESCE(faculty, \'\')) LIKE ? OR LOWER(COALESCE(batch_number, \'\')) LIKE ?)';
            $like = '%' . $search . '%';
            array_push($params, $like, $like, $like, $like, $like);
        }

        if ($status === 'active') {
            $sql .= ' AND is_active = 1';
        } elseif ($status === 'inactive') {
            $sql .= ' AND is_active = 0';
        }

        $sql .= ' ORDER BY id DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        foreach ($rows as &$r) {
            $r['id'] = (int) $r['id'];
            $r['is_active'] = (int) $r['is_active'];
        }
        unset($r);

        json_response(['success' => true, 'data' => $rows]);
    }

    if ($method === 'POST') {
        require_admin();
        $body = read_json_body();

        $name        = clean_text($body['name'] ?? '');
        $studentId   = clean_text($body['student_id'] ?? '');
        $faculty     = clean_text($body['faculty'] ?? '');
        $batchNumber = clean_text($body['batch_number'] ?? '');
        $email       = strtolower(clean_text($body['email'] ?? ''));
        $password    = (string) ($body['password'] ?? '');
        $role        = strtolower(clean_text($body['role'] ?? 'student'));
        $isActive    = isset($body['is_active']) ? (int) (bool) $body['is_active'] : 1;

        if ($name === '' || $studentId === '' || $email === '' || $password === '') {
            json_error('Name with initials, student number, email, and password are required.', 400);
        }
        if (mb_strlen($studentId, 'UTF-8') > 16) {
            json_error('Student number must be 16 characters or fewer.', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Please enter a valid email address.', 400);
        }
        if (strlen($password) < 6) {
            json_error('Password must be at least 6 characters long.', 400);
        }
        if (!in_array($role, ['student', 'club_manager', 'sports_admin'], true)) {
            $role = 'student';
        }

        $dupStmt = $pdo->prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ? LIMIT 1');
        $dupStmt->execute([$email, strtolower($studentId)]);
        if ($dupStmt->fetch()) {
            json_error('A user with that email or student number already exists.', 409);
        }

        $initials = make_initials($name);
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $ins = $pdo->prepare(
            'INSERT INTO users (student_id, name, email, password_hash, faculty, batch_number, role, avatar_initials, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $studentId,
            $name,
            $email,
            $hash,
            $faculty !== '' ? $faculty : null,
            $batchNumber !== '' ? $batchNumber : null,
            $role,
            $initials,
            $isActive,
        ]);

        $newId = (int) $pdo->lastInsertId();

        json_response([
            'success' => true,
            'message' => 'Student registered successfully.',
            'data'    => [
                'id'              => $newId,
                'student_id'      => $studentId,
                'name'            => $name,
                'email'           => $email,
                'faculty'         => $faculty,
                'batch_number'    => $batchNumber,
                'role'            => $role,
                'avatar_initials' => $initials,
                'is_active'       => $isActive,
            ],
        ], 201);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        require_admin();
        $body = read_json_body();
        $id = to_id($body['id'] ?? null);
        if (!$id) {
            json_error('Valid student record ID is required.', 400);
        }

        $fields = [];
        $params = [];

        if (array_key_exists('name', $body) && clean_text($body['name']) !== '') {
            $cleanName = clean_text($body['name']);
            $fields[] = 'name = ?';
            $params[] = $cleanName;
            $fields[] = 'avatar_initials = ?';
            $params[] = make_initials($cleanName);
        }
        if (array_key_exists('student_id', $body) && clean_text($body['student_id']) !== '') {
            $fields[] = 'student_id = ?';
            $params[] = clean_text($body['student_id']);
        }
        if (array_key_exists('faculty', $body)) {
            $fac = clean_text($body['faculty']);
            $fields[] = 'faculty = ?';
            $params[] = $fac !== '' ? $fac : null;
        }
        if (array_key_exists('batch_number', $body)) {
            $batch = clean_text($body['batch_number']);
            $fields[] = 'batch_number = ?';
            $params[] = $batch !== '' ? $batch : null;
        }
        if (array_key_exists('is_active', $body)) {
            $fields[] = 'is_active = ?';
            $params[] = (int) (bool) $body['is_active'];
        }
        if (!empty($body['password'])) {
            $newPass = (string) $body['password'];
            if (strlen($newPass) < 6) {
                json_error('New password must be at least 6 characters long.', 400);
            }
            $fields[] = 'password_hash = ?';
            $params[] = password_hash($newPass, PASSWORD_DEFAULT);
        }

        if (!$fields) {
            json_error('No updatable fields provided.', 400);
        }

        $params[] = $id;
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        json_response(['success' => true, 'message' => 'Student record updated.']);
    }

    if ($method === 'DELETE') {
        $admin = require_admin();
        $body = read_json_body();
        $id = to_id($body['id'] ?? ($_GET['id'] ?? null));

        if (!$id) {
            json_error('Student ID is required for deletion.', 400);
        }
        if ((int) $admin['id'] === $id) {
            json_error('You cannot delete your own active account.', 400);
        }

        $targetStmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ? LIMIT 1');
        $targetStmt->execute([$id]);
        $target = $targetStmt->fetch();
        if (!$target) {
            json_error('Student record not found.', 404);
        }
        if (is_admin_role((string) ($target['role'] ?? ''))) {
            json_error('Admin accounts cannot be deleted.', 403);
        }

        $deleted = delete_user_and_dependencies($pdo, $id);
        if (!$deleted) {
            json_error('Student record not found.', 404);
        }

        json_response(['success' => true, 'message' => 'Student deleted.']);
    }

    method_not_allowed(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
} catch (Throwable $e) {
    error_log('students.php error: ' . $e->getMessage());
    json_response([
        'success' => false,
        'error'   => 'Unable to process student request: ' . $e->getMessage(),
        'message' => 'Unable to process student request: ' . $e->getMessage(),
    ], 500);
}