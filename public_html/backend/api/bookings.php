<?php
/**
 * api/bookings.php
 *   GET    [?status=pending|confirmed|cancelled|completed]   admin: all bookings, student: own bookings
 *   POST   { facility, sport, booking_date, start_time, end_time, notes? }  create a booking -> pending
 *   PUT    { id, status }                                                   admin updates status (POST with "id" also works)
 *   DELETE ?id=                                                             cancel a booking (owner while pending, or admin)
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const BOOKING_SELECT = 'SELECT b.id, b.facility, b.facility AS facility_name, b.booked_by, b.booked_by AS student_id,
                               u.name AS booked_by_name, u.name AS student_name, b.sport,
                               b.booking_date, b.start_time, b.end_time,
                               CONCAT(b.booking_date, " ", TIME_FORMAT(b.start_time, "%H:%i"), " - ", TIME_FORMAT(b.end_time, "%H:%i")) AS date_time,
                               b.status, b.notes, b.created_at
                        FROM bookings b
                        JOIN users u ON u.id = b.booked_by';

function find_booking(int $id): ?array
{
    $stmt = db()->prepare(BOOKING_SELECT . ' WHERE b.id = ? LIMIT 1');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = request_method();
$user   = require_login();
$body   = in_array($method, ['POST', 'PUT'], true) ? read_json_body() : [];
$isAdmin = is_admin_role($user['role'] ?? '');

/* ---------- GET: list ---------- */
if ($method === 'GET') {
    $sql    = BOOKING_SELECT;
    $where  = [];
    $params = [];

    if (!$isAdmin) {
        $where[]  = 'b.booked_by = ?';
        $params[] = $user['id'];
    }
    $status = strtolower(clean_text($_GET['status'] ?? ''));
    if ($status !== '') {
        if ($status === 'approved') {
            $status = 'confirmed';
        }
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

/* ---------- PUT (or POST with id): approve / confirm / reject / cancel ---------- */
$isUpdate = $method === 'PUT'
    || ($method === 'POST' && (isset($body['id']) || ($_GET['action'] ?? '') === 'update'));

if ($isUpdate) {
    require_admin();
    $id     = to_id($body['id'] ?? $_GET['id'] ?? null);
    $status = strtolower(clean_text($body['status'] ?? ''));
    if ($status === 'approved') {
        $status = 'confirmed';
    } elseif ($status === 'rejected') {
        $status = 'cancelled';
    }

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
    $facility = clean_text($body['facility'] ?? $body['facility_name'] ?? '');
    $sport    = clean_text($body['sport'] ?? 'General');
    $date     = clean_text($body['booking_date'] ?? '');
    $start    = clean_text($body['start_time'] ?? '');
    $end      = clean_text($body['end_time'] ?? '');
    $notes    = clean_text($body['notes'] ?? '');

    if ($facility === '' || $date === '' || $start === '' || $end === '') {
        json_error('facility, booking_date, start_time, and end_time are required.', 400);
    }

    $fStmt = db()->prepare('SELECT name FROM facilities WHERE name = ? LIMIT 1');
    $fStmt->execute([$facility]);
    if (!$fStmt->fetch()) {
        json_error('Unknown facility selected.', 400);
    }

    $startNorm = strlen($start) === 5 ? $start . ':00' : $start;
    $endNorm   = strlen($end) === 5 ? $end . ':00' : $end;
    if ($endNorm <= $startNorm) {
        json_error('end_time must be later than start_time.', 400);
    }

    $stmt = db()->prepare(
        "INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
    );
    $stmt->execute([$facility, $user['id'], $sport, $date, $startNorm, $endNorm, $notes]);
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
    if (!$isAdmin) {
        if ((int) $booking['booked_by'] !== (int) $user['id']) {
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