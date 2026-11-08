<?php

const INVENTORY_SELECT = 'SELECT id, item_name, item_name AS name, total_stock, total_stock AS total,
                                 issued_count, (total_stock - issued_count) AS available, updated_at
                          FROM inventory';

function find_item(int $id): ?array
{
    $stmt = db()->prepare(INVENTORY_SELECT . ' WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$method = request_method();
$user   = require_login();

if ($method === 'GET') {
    $stmt = db()->query(INVENTORY_SELECT . ' ORDER BY item_name ASC');
    json_response(['success' => true, 'data' => $stmt->fetchAll()]);
}

if ($method === 'PUT') {
    require_admin();
    $body = read_json_body();
    $id   = to_id($body['id'] ?? $_GET['id'] ?? null);
    if ($id === null) {
        json_error('A valid item id is required.', 400);
    }
    if (!array_key_exists('total_stock', $body) && !array_key_exists('issued_count', $body)) {
        json_error('Provide total_stock and/or issued_count.', 400);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT total_stock, issued_count FROM inventory WHERE id = ? FOR UPDATE');
        $stmt->execute([$id]);
        $current = $stmt->fetch();
        if (!$current) {
            $pdo->rollBack();
            json_error('Inventory item not found.', 404);
        }

        $total  = array_key_exists('total_stock', $body)  ? to_count($body['total_stock'])  : (int) $current['total_stock'];
        $issued = array_key_exists('issued_count', $body) ? to_count($body['issued_count']) : (int) $current['issued_count'];

        if ($total === null || $issued === null) {
            $pdo->rollBack();
            json_error('Stock values must be whole numbers of 0 or more.', 400);
        }
        if ($issued > $total) {
            $pdo->rollBack();
            json_error('issued_count cannot exceed total_stock.', 400);
        }

        $stmt = $pdo->prepare('UPDATE inventory SET total_stock = ?, issued_count = ? WHERE id = ?');
        $stmt->execute([$total, $issued, $id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    json_response(['success' => true, 'data' => find_item($id)]);
}

if ($method === 'POST') {
    require_admin();
    $body  = read_json_body();
    $name  = clean_text($body['item_name'] ?? '');
    $total = to_count($body['total_stock'] ?? 0);

    if ($name === '') {
        json_error('item_name is required.', 400);
    }
    if (text_length($name) > 120) {
        json_error('item_name must be 120 characters or fewer.', 400);
    }
    if ($total === null) {
        json_error('total_stock must be a whole number of 0 or more.', 400);
    }
    $stmt = db()->prepare('SELECT id FROM inventory WHERE item_name = ?');
    $stmt->execute([$name]);
    if ($stmt->fetch()) {
        json_error('An item with that name already exists.', 409);
    }

    $stmt = db()->prepare('INSERT INTO inventory (item_name, total_stock, issued_count) VALUES (?, ?, 0)');
    $stmt->execute([$name, $total]);
    json_response(['success' => true, 'data' => find_item((int) db()->lastInsertId())], 201);
}

method_not_allowed(['GET', 'POST', 'PUT']);
