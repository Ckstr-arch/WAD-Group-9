<?php
/**
 * api/bookings.php
 *   GET    [?status=pending|confirmed|cancelled|completed] admin: all, student: own
 *   POST   { facility, sport, booking_date, start_time, end_time, notes }
 *   PUT    { id, status }                        admin confirms / cancels
 *   DELETE ?id=                                  cancel a booking (owner while pending, or admin)
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const BOOKING_SELECT = 'SELECT b.id, b.booked_by AS student_id, u.name AS student_name, b.facility,
                           b.sport, b.booking_date, b.start_time, b.end_time, b.status, b.notes, b.created_at
                        FROM bookings b
                        JOIN users u ON u.id = b.booked_by';

function find_booking(int $id): ?array
{
    $stmt = db()->prepare(BOOKING_SELECT . ' WHERE b.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = request_method();
$user   = require_login();
$body   = in_array($method, ['POST', 'PUT'], true) ? read_json_body() : [];

/* ---------- GET: list ---------- */
if ($method === 'GET') {
    $sql    = BOOKING_SELECT;
    $where  = [];
    $params = [];

    if (!in_array($user['role'], ['sports_admin', 'super_admin'], true)) {
        $where[]  = 'b.booked_by = ?';
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

/* ---------- PUT (or POST with id): approve / reject ---------- */
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

/* ---------- POST: create ---------- */
if ($method === 'POST') {
    $facility = clean_text($body['facility'] ?? '');
    $sport = clean_text($body['sport'] ?? '');
    $date = clean_text($body['booking_date'] ?? '');
    $start = clean_text($body['start_time'] ?? '');
    $end = clean_text($body['end_time'] ?? '');
    $notes = clean_text($body['notes'] ?? '');

    if ($facility === '' || $sport === '' || $date === '' || $start === '' || $end === '') {
        json_error('Facility, sport, date, start time and end time are required.', 400);
    }
    if (text_length($facility) > 150) {
        json_error('facility must be 150 characters or fewer.', 400);
    }
    $when = DateTimeImmutable::createFromFormat('Y-m-d H:i', "$date $start");
    $finish = DateTimeImmutable::createFromFormat('Y-m-d H:i', "$date $end");
    if (!$when || !$finish || $finish <= $when || $when < new DateTimeImmutable('now')) json_error('The booking date and time are invalid.', 400);
    $stmt = db()->prepare('SELECT name FROM facilities WHERE name = ?');
    $stmt->execute([$facility]);
    if (!$stmt->fetch()) json_error('Facility not found.', 404);
    $stmt = db()->prepare("SELECT id FROM bookings WHERE facility = ? AND booking_date = ? AND status IN ('pending', 'confirmed') AND start_time < ? AND end_time > ? LIMIT 1");
    $stmt->execute([$facility, $date, $finish->format('H:i:s'), $when->format('H:i:s')]);
    if ($stmt->fetch()) json_error('That facility is already booked for the selected time.', 409);

    $stmt = db()->prepare(
        "INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
    );
    $stmt->execute([$facility, $user['id'], $sport, $date, $when->format('H:i:s'), $finish->format('H:i:s'), $notes]);
    json_response(['success' => true, 'data' => find_booking((int) db()->lastInsertId())], 201);
}

/* ---------- DELETE: cancel ---------- */
if ($method === 'DELETE') {
    $id = to_id($_GET['id'] ?? null);
    if ($id === null) {
        json_error('A valid booking id is required.', 400);
    }
    $booking = find_booking($id);
    if ($booking === null) {
        json_error('Booking not found.', 404);
    }
    if (!in_array($user['role'], ['sports_admin', 'super_admin'], true)) {
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
