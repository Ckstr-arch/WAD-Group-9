<?php
/**
 * api/clubs.php
 *   GET                         list clubs (+ member_count, and my_status for the caller)
 *   GET  ?view=my               the caller's own memberships/requests
 *   GET  ?view=requests         admin: join requests (default pending; ?status=approved|rejected|all)
 *   POST { name, description }  admin: create a club
 *   POST { club_id }            student: request to join a club
 *   PUT  { id, status }         admin: approve / reject a join request (id = club_memberships.id)
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';

const MEMBERSHIP_STATUSES = ['pending', 'approved', 'rejected'];

const REQUEST_SELECT = 'SELECT m.id, m.student_id, u.name AS student_name, u.email AS student_email,
                               m.club_id, c.name AS club_name, m.status, m.requested_at
                        FROM club_memberships m
                        JOIN users u ON u.id = m.student_id
                        JOIN clubs c ON c.id = m.club_id';

function find_request(int $id): ?array
{
    $stmt = db()->prepare(REQUEST_SELECT . ' WHERE m.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = request_method();
$user   = require_login();
$body   = in_array($method, ['POST', 'PUT'], true) ? read_json_body() : [];

/* ---------- GET ---------- */
if ($method === 'GET') {
    $view = strtolower(clean_text($_GET['view'] ?? ''));

    if ($view === 'requests') {
        require_admin();
        $status = strtolower(clean_text($_GET['status'] ?? 'pending'));
        $sql    = REQUEST_SELECT;
        $params = [];
        if ($status !== 'all') {
            if (!in_array($status, MEMBERSHIP_STATUSES, true)) {
                json_error('Invalid status filter.', 400);
            }
            $sql     .= ' WHERE m.status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY m.requested_at DESC, m.id DESC';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        json_response(['success' => true, 'data' => $stmt->fetchAll()]);
    }

    if ($view === 'my') {
        $stmt = db()->prepare(REQUEST_SELECT . ' WHERE m.student_id = ? ORDER BY m.requested_at DESC');
        $stmt->execute([$user['id']]);
        json_response(['success' => true, 'data' => $stmt->fetchAll()]);
    }

    if ($view !== '') {
        json_error('Unknown view.', 400);
    }

    $stmt = db()->prepare(
        "SELECT c.id, c.name, c.description, c.created_at,
                (SELECT COUNT(*) FROM club_memberships m
                  WHERE m.club_id = c.id AND m.status = 'approved') AS member_count,
                (SELECT m2.status FROM club_memberships m2
                  WHERE m2.club_id = c.id AND m2.student_id = ?) AS my_status
         FROM clubs c
         ORDER BY c.name ASC"
    );
    $stmt->execute([$user['id']]);
    json_response(['success' => true, 'data' => $stmt->fetchAll()]);
}

/* ---------- PUT: approve / reject a join request ---------- */
if ($method === 'PUT') {
    require_admin();
    $id     = to_id($body['id'] ?? $_GET['id'] ?? null);
    $status = strtolower(clean_text($body['status'] ?? ''));

    if ($id === null) {
        json_error('A valid request id is required.', 400);
    }
    if (!in_array($status, MEMBERSHIP_STATUSES, true)) {
        json_error('Status must be one of: ' . implode(', ', MEMBERSHIP_STATUSES) . '.', 400);
    }
    if (find_request($id) === null) {
        json_error('Join request not found.', 404);
    }
    $stmt = db()->prepare('UPDATE club_memberships SET status = ? WHERE id = ?');
    $stmt->execute([$status, $id]);
    json_response(['success' => true, 'data' => find_request($id)]);
}

/* ---------- POST ---------- */
if ($method === 'POST') {

    // Student: request to join
    if (array_key_exists('club_id', $body)) {
        $clubId = to_id($body['club_id']);
        if ($clubId === null) {
            json_error('A valid club_id is required.', 400);
        }
        $stmt = db()->prepare('SELECT id FROM clubs WHERE id = ?');
        $stmt->execute([$clubId]);
        if (!$stmt->fetch()) {
            json_error('Club not found.', 404);
        }

        $stmt = db()->prepare('SELECT id, status FROM club_memberships WHERE student_id = ? AND club_id = ?');
        $stmt->execute([$user['id'], $clubId]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['status'] !== 'rejected') {
                json_error($existing['status'] === 'approved'
                    ? 'You are already a member of this club.'
                    : 'You already have a pending request for this club.', 409);
            }
            // Previously rejected: allow re-applying
            $up = db()->prepare("UPDATE club_memberships SET status = 'pending', requested_at = NOW() WHERE id = ?");
            $up->execute([$existing['id']]);
            json_response(['success' => true, 'data' => find_request((int) $existing['id'])], 200);
        }

        $stmt = db()->prepare(
            "INSERT INTO club_memberships (student_id, club_id, status) VALUES (?, ?, 'pending')"
        );
        $stmt->execute([$user['id'], $clubId]);
        json_response(['success' => true, 'data' => find_request((int) db()->lastInsertId())], 201);
    }

    // Admin: create a club
    require_admin();
    $name = clean_text($body['name'] ?? '');
    $sport = clean_text($body['sport'] ?? 'General');
    $president = clean_text($body['president'] ?? $user['name']);
    $desc = clean_text($body['description'] ?? '');

    if ($name === '' || $desc === '') {
        json_error('Club name and description are required.', 400);
    }
    if (text_length($name) > 120) {
        json_error('Club name must be 120 characters or fewer.', 400);
    }
    $stmt = db()->prepare('SELECT id FROM clubs WHERE name = ?');
    $stmt->execute([$name]);
    if ($stmt->fetch()) {
        json_error('A club with that name already exists.', 409);
    }

    $stmt = db()->prepare('INSERT INTO clubs (name, sport, president, description) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $sport, $president, $desc]);
    $id = (int) db()->lastInsertId();
    json_response([
        'success' => true,
        'data'    => ['id' => $id, 'name' => $name, 'description' => $desc, 'member_count' => 0],
    ], 201);
}

method_not_allowed(['GET', 'POST', 'PUT']);
