<?php

if (request_method() !== 'GET') {
    method_not_allowed(['GET']);
}
require_admin();

$sql    = "SELECT id, name, email, role, status, created_at FROM users WHERE role = 'student'";
$params = [];

$search = clean_text($_GET['search'] ?? '');
if ($search !== '') {
    $like = '%' . addcslashes($search, '%_\\') . '%';
    $sql .= ' AND (name LIKE ? OR email LIKE ?)';
    array_push($params, $like, $like);
}

$status = clean_text($_GET['status'] ?? '');
if ($status !== '') {
    if (!in_array($status, ['approved', 'suspended'], true)) {
        json_error('Invalid status filter.', 400);
    }
    $sql .= ' AND status = ?';
    $params[] = $status;
}

$sql .= ' ORDER BY name ASC';
$stmt = db()->prepare($sql);
$stmt->execute($params);

json_response(['success' => true, 'data' => $stmt->fetchAll()]);
