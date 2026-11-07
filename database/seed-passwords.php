<?php
declare(strict_type=1);

if (PHP_SAPI != 'cli') {
    http_response_code(404);
    exit;
}

$hashes = [
    'studentPasswordHash' => password_hash('password123', PASSWORD_DEFAULT),
    'adminPasswordHash' => password_hash('admin123', PASSWORD_DEFAULT),
];
