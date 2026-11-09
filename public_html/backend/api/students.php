<?php
/**
 * api/students.php
 *   GET [?search=text] [?status=approved|suspended]   (admin only)
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

if (request_method() !== 'GET') {
    method_not_allowed(['GET']);
}
require_admin();

$sql    = "SELECT id, student_id, name, email, role, is_active, created_at FROM users WHERE role = 'student'";
$params = [];

$search = clean_text($_GET['search'] ?? '');
if ($search !== '') {
    $like = '%' . addcslashes($search, '%_\\') . '%';
    $sql .= ' AND (name LIKE ? OR email LIKE ?)';
    array_push($params, $like, $like);
}

$status = clean_text($_GET['status'] ?? '');
if ($status !== '') {
    if (!in_array($status, ['active', 'inactive'], true)) {
        json_error('Invalid status filter.', 400);
    }
    $sql .= ' AND is_active = ?';
    $params[] = $status === 'active' ? 1 : 0;
}

$sql .= ' ORDER BY name ASC';
$stmt = db()->prepare($sql);
$stmt->execute($params);

json_response(['success' => true, 'data' => $stmt->fetchAll()]);
