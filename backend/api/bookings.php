<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

const BOOKING_STATUSES = ['pending', 'approved', 'rejected'];

const BOOKING_SELECT = 'SELECT b.id, b.student_id, u.name AS student_name, b.facility_name,
                               b.date_time, b.status, b.created_at
                        FROM bookings b
                        JOIN users u ON u.id = b.student_id';

function find_booking(int $id): ?array
{
    $stmt = db()->prepare(BOOKING_SELECT . ' WHERE b.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = request_method();
$user   = require_login();
$body   = in_array($method, ['POST', 'PUT'], true) ? read_json_body() : [];


if ($method === 'GET') {
    $sql    = BOOKING_SELECT;
    $where  = [];
    $params = [];

    if ($user['role'] !== 'admin') {
        $where[]  = 'b.student_id = ?';
        $params[] = $user['id'];
    }
    $status = clean_text($_GET['status'] ?? '');
    if ($status !== '') {
        if (!in_array($status, BOOKING_STATUSES, true)) {
            json_error('Invalid status filter.', 400);
        }
        $where[]  = 'b.status = ?';
        $params[] = $status;
    }
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY b.created_at DESC, b.id DESC';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    json_response(['success' => true, 'data' => $stmt->fetchAll()]);
}


$isUpdate = $method === 'PUT'
    || ($method === 'POST' && (isset($body['id']) || ($_GET['action'] ?? '') === 'update'));

if ($isUpdate) {
    require_admin();
    $id     = to_id($body['id'] ?? $_GET['id'] ?? null);
    $status = strtolower(clean_text($body['status'] ?? ''));

    if ($id === null) {
        json_error('A valid booking id is required.', 400);
    }
    if (!in_array($status, BOOKING_STATUSES, true)) {
        json_error('Status must be one of: ' . implode(', ', BOOKING_STATUSES) . '.', 400);
    }
    if (find_booking($id) === null) {
        json_error('Booking not found.', 404);
    }

    $stmt = db()->prepare('UPDATE bookings SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    json_response(['success' => true, 'data' => find_booking($id)]);
}


if ($method === 'POST') {
    $facility = clean_text($body['facility_name'] ?? '');
    $rawDate  = clean_text($body['date_time'] ?? '');

    if ($facility === '' || $rawDate === '') {
        json_error('facility_name and date_time are required.', 400);
    }
    if (text_length($facility) > 150) {
        json_error('facility_name must be 150 characters or fewer.', 400);
    }
    try {
        $when = new DateTimeImmutable($rawDate);
    } catch (Exception) {
        json_error('date_time is not a valid date.', 400);
    }
    if ($when < new DateTimeImmutable('now')) {
        json_error('date_time must be in the future.', 400);
    }

    $stmt = db()->prepare(
        "INSERT INTO bookings (student_id, facility_name, date_time, status) VALUES (?, ?, ?, 'pending')"
    );
    $stmt->execute([$user['id'], $facility, $when->format('Y-m-d H:i:s')]);
    json_response(['success' => true, 'data' => find_booking((int) db()->lastInsertId())], 201);
}


if ($method === 'DELETE') {
    $id = to_id($_GET['id'] ?? null);
    if ($id === null) {
        json_error('A valid booking id is required.', 400);
    }
    $booking = find_booking($id);
    if ($booking === null) {
        json_error('Booking not found.', 404);
    }
    if ($user['role'] !== 'admin') {
        if ((int) $booking['student_id'] !== $user['id']) {
            json_error('You can only cancel your own bookings.', 403);
        }
        if ($booking['status'] !== 'pending') {
            json_error('Only pending bookings can be cancelled.', 409);
        }
    }
    $stmt = db()->prepare('DELETE FROM bookings WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['success' => true, 'message' => 'Booking cancelled.']);
}

method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);
