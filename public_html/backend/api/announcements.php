<?php
/**
 * api/announcements.php
 *   GET  [?limit=20]          campus feed, newest first (any signed-in user)
 *   POST { title, content }   admin publishes an announcement ("body"/"message" accepted as aliases)
 * 
 * 11/8/2026 2.57 fixed variable mismatch in POST response query
 */
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$user   = require_login();

if ($method === 'GET') {
    $limit = to_id($_GET['limit'] ?? null) ?? 20;
    $limit = min($limit, 100);

    $stmt = db()->prepare(
        'SELECT a.id, a.title, a.content, a.posted_by, u.name AS posted_by_name, a.created_at
         FROM announcements a
         JOIN users u ON u.id = a.posted_by
         ORDER BY a.created_at DESC, a.id DESC
         LIMIT ?'
    );
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    json_response(['success' => true, 'data' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $admin = require_admin();
    $body  = read_json_body();

    $title   = clean_text($body['title'] ?? '');
    $content = clean_text($body['content'] ?? $body['body'] ?? $body['message'] ?? '');

    if ($title === '' || $content === '') {
        json_error('Title and content are required.', 400);
    }
    if (text_length($title) > 150) {
        json_error('Title must be 150 characters or fewer.', 400);
    }
    if (text_length($content) > 5000) {
        json_error('Content must be 5000 characters or fewer.', 400);
    }

    $stmt = db()->prepare('INSERT INTO announcements (title, content, posted_by) VALUES (?, ?, ?)');
    $stmt->execute([$title, $content, $admin['id']]);
    $id = (int) db()->lastInsertId();

    $stmt = db()->prepare(
        'SELECT a.id, a.title, a.content, a.posted_by, u.name AS posted_by_name, a.created_at
         FROM announcements a JOIN users u ON u.id = a.posted_by WHERE a.id = ?'
    );
    $stmt->execute([$id]);
    json_response(['success' => true, 'data' => $stmt->fetch()], 201);
}

method_not_allowed(['GET', 'POST']);
