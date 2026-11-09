<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
if (request_method() !== 'GET') method_not_allowed(['GET']);
require_login();
$stmt = db()->query('SELECT id, name, sport, start_date, end_date, format, max_teams, registered_teams, status, description FROM tournaments ORDER BY start_date ASC, id ASC');
json_response(['success' => true, 'data' => $stmt->fetchAll()]);
