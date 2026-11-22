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
    'cricket'                 => 'Main Ground',
    'basketball-court'        => 'Indoor Court',
    'basketball'              => 'Indoor Court',
    'table-tennis'            => 'Student Activity Centre',
    'swimming-pool'           => 'Swimming Pool',
    'swimming'                => 'Swimming Pool',
    'badminton-hall'          => 'Indoor Court',
    'badminton'               => 'Indoor Court',
    'athletics-track'         => 'Main Ground',
    'athletics'               => 'Main Ground',
    'netball-court'           => 'Indoor Court',
    'netball'                 => 'Indoor Court',
    'football-court'          => 'Main Ground',
    'football'                => 'Main Ground',
    'rugby'                   => 'Phase 2 Ground',
    'calisthenics'            => 'Gymnasium',
    'archery'                 => 'Phase 2 Ground',
    'hockey'                  => 'Main Ground',
    'taekwondo'               => 'Gymnasium',
    'karate'                  => 'Gymnasium',
    'powerlifting'            => 'Gymnasium',
    'chess'                   => 'Student Activity Centre',
    'main-ground'             => 'Main Ground',
    'indoor-court'            => 'Indoor Court',
    'gymnasium'               => 'Gymnasium',
    'phase-2-ground'          => 'Phase 2 Ground',
    'student-activity-centre' => 'Student Activity Centre',
];

const DEFAULT_FACILITIES = [
    'Indoor Court',
    'Main Ground',
    'Swimming Pool',
    'Gymnasium',
    'Phase 2 Ground',
    'Student Activity Centre',
];

const BOOKING_SELECT = "SELECT b.id, b.facility, b.facility AS facility_name, b.booked_by, b.booked_by AS student_id,
                               u.name AS booked_by_name, u.name AS student_name, b.sport,
                               b.booking_date, b.start_time, b.end_time,
                               CONCAT(b.booking_date, ' ', TIME_FORMAT(b.start_time, '%H:%i'), ' - ', TIME_FORMAT(b.end_time, '%H:%i')) AS date_time,
                               b.status, b.notes, b.created_at
                        FROM bookings b
                        JOIN users u ON u.id = b.booked_by";

function find_booking(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(BOOKING_SELECT . ' WHERE b.id = ? LIMIT 1');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function resolve_facility_name(PDO $pdo, string $rawFacility): string
{
    $clean = trim($rawFacility);
    if ($clean === '') {
        return '';
    }

    $normalizedKey = strtolower(preg_replace('/[\s_]+/', '-', $clean) ?? $clean);
    $candidate = FACILITY_SLUG_MAP[$normalizedKey] ?? FACILITY_SLUG_MAP[strtolower($clean)] ?? $clean;

    $fStmt = $pdo->prepare('SELECT name FROM facilities WHERE LOWER(name) = LOWER(?) LIMIT 1');
    $fStmt->execute([$candidate]);
    $row = $fStmt->fetch();
    if ($row) {
        return (string) $row['name'];
    }

    if ($candidate !== $clean) {
        $fStmt->execute([$clean]);
        $row = $fStmt->fetch();
        if ($row) {
            return (string) $row['name'];
        }
    }

    foreach (DEFAULT_FACILITIES as $defaultFac) {
        try {
            $ins = $pdo->prepare('INSERT IGNORE INTO facilities (name) VALUES (?)');
            $ins->execute([$defaultFac]);
        } catch (Throwable $ignored) {
            // ignore if already present
        }
    }

    $fStmt->execute([$candidate]);
    $row = $fStmt->fetch();
    if ($row) {
        return (string) $row['name'];
    }

    return $candidate;
}

$method  = request_method();
$user    = require_login();
$body    = in_array($method, ['POST', 'PUT'], true) ? read_json_body() : [];
$isAdmin = is_admin_role($user['role'] ?? '');
$pdo     = db();

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

    $stmt = $pdo->prepare($sql);
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
    if (find_booking($pdo, $id) === null) {
        json_error('Booking not found.', 404);
    }

    $stmt = $pdo->prepare('UPDATE bookings SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    json_response(['success' => true, 'data' => find_booking($pdo, $id)]);
}

/* ---------- POST: create ---------- */
if ($method === 'POST') {
    $rawFacility = clean_text($body['facility_name'] ?? $body['facility'] ?? $body['facility_id'] ?? '');
    $facility    = resolve_facility_name($pdo, $rawFacility);
    $sport       = clean_text($body['sport'] ?? '');
    if ($sport === '') {
        $sport = $rawFacility !== '' ? ucwords(str_replace('-', ' ', $rawFacility)) : 'General';
    }
    $date  = clean_text($body['booking_date'] ?? $body['date'] ?? '');
    $start = clean_text($body['start_time'] ?? $body['start'] ?? '');
    $end   = clean_text($body['end_time'] ?? $body['end'] ?? '');
    $notes = clean_text($body['notes'] ?? '');

    if ($facility === '' || $date === '' || $start === '' || $end === '') {
        json_error('facility, booking_date, start_time, and end_time are required.', 400);
    }

    $userId = to_id($user['id'] ?? null);
    if ($userId === null) {
        json_error('Your session user ID is missing. Please sign out and sign in again.', 401);
    }

    $uStmt = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
    $uStmt->execute([$userId]);
    if (!$uStmt->fetch()) {
        json_error('Logged-in account was not found in database. Please sign out and sign in again.', 401);
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
        $newId = (int) $pdo->lastInsertId();
        json_response(['success' => true, 'data' => find_booking($pdo, $newId)], 201);
    } catch (PDOException $e) {
        if ((int) $e->getCode() === 23000 || str_contains($e->getMessage(), '1452')) {
            json_error('Could not save booking due to a foreign key mismatch on user or facility.', 400);
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
    $booking = find_booking($pdo, $id);
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
    $stmt = $pdo->prepare('DELETE FROM bookings WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['success' => true, 'message' => 'Booking cancelled.']);
}

method_not_allowed(['GET', 'POST', 'PUT', 'DELETE']);