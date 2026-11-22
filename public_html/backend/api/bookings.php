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

const FACILITY_SLUG_MAP = [
    'cricket'           => 'Cricket',
    'basketball-court'  => 'Basketball Court',
    'table-tennis'      => 'Table Tennis',
    'swimming-pool'     => 'Swimming Pool',
    'badminton-hall'    => 'Badminton Court',
    'athletics-track'   => 'Athletics Track',
    'netball-court'     => 'Netball',
    'football-court'    => 'Football',
    'rugby'             => 'Rugby',
    'calisthenics'      => 'Calisthenics',
    'archery'           => 'Archery',
    'hockey'            => 'Hockey',
    'taekwondo'         => 'Taekwondo',
    'karate'            => 'Karate',
    'powerlifting'      => 'Powerlifting',
    'chess'             => 'Chess',
];

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

function resolve_facility_name(string $rawFacility): string
{
    $clean = trim($rawFacility);
    if ($clean === '') {
        return '';
    }
    $slugKey = strtolower($clean);
    if (isset(FACILITY_SLUG_MAP[$slugKey])) {
        return FACILITY_SLUG_MAP[$slugKey];
    }
    return $clean;
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
    $rawFacility = clean_text($body['facility_name'] ?? $body['facility'] ?? $body['facility_id'] ?? '');
    $facility    = resolve_facility_name($rawFacility);
    $sport       = clean_text($body['sport'] ?? 'General');
    $date        = clean_text($body['booking_date'] ?? $body['date'] ?? '');
    $start       = clean_text($body['start_time'] ?? $body['start'] ?? '');
    $end         = clean_text($body['end_time'] ?? $body['end'] ?? '');
    $notes       = clean_text($body['notes'] ?? '');

    if ($facility === '' || $date === '' || $start === '' || $end === '') {
        json_error('facility, booking_date, start_time, and end_time are required.', 400);
    }

    $pdo = db();

    $userId = to_id($user['id'] ?? null);
    if ($userId === null) {
        json_error('Your session user ID is missing. Please sign out and sign in again.', 401);
    }
    $uStmt = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
    $uStmt->execute([$userId]);
    if (!$uStmt->fetch()) {
        json_error('Logged-in account was not found in database. Please sign out and sign in again.', 401);
    }

    $fStmt = $pdo->prepare('SELECT name FROM facilities WHERE LOWER(name) = LOWER(?) LIMIT 1');
    $fStmt->execute([$facility]);
    $matchedRow = $fStmt->fetch();
    if ($matchedRow) {
        $facility = (string) $matchedRow['name'];
    } else {
        $countStmt = $pdo->query('SELECT COUNT(*) FROM facilities');
        $facilityTableCount = (int) $countStmt->fetchColumn();
        if ($facilityTableCount > 0 && !in_array($facility, FACILITY_SLUG_MAP, true)) {
            json_error('Unknown facility selected.', 400);
        }
        if ($facilityTableCount === 0) {
            try {
                $insFac = $pdo->prepare('INSERT IGNORE INTO facilities (name) VALUES (?)');
                $insFac->execute([$facility]);
            } catch (Throwable $ignored) {
                // ignore if `facilities` schema differs
            }
        }
    }

    $startNorm = strlen($start) === 5 ? $start . ':00' : $start;
    $endNorm   = strlen($end) === 5 ? $end . ':00' : $end;
    if ($endNorm <= $startNorm) {
        json_error('end_time must be later than start_time.', 400);
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO bookings (facility, booked_by, sport, booking_date, start_time, end_time, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
        );
        $stmt->execute([$facility, $userId, $sport, $date, $startNorm, $endNorm, $notes]);
        json_response(['success' => true, 'data' => find_booking((int) $pdo->lastInsertId())], 201);
    } catch (PDOException $e) {
        if ((int) $e->getCode() === 23000 || str_contains($e->getMessage(), '1452')) {
            json_error('Could not save booking due to a database reference mismatch (check user account or facility record).', 400);
        }
        throw $e;
    }
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