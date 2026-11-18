<?php
$host = getenv('DB_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: '3306';
$name = getenv('DB_NAME') ?: 'sportshub';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

// Enable SSL for cloud databases if required by your provider
if (getenv('DB_SSL_CA')) {
    $options[PDO::MYSQL_ATTR_SSL_CA] = getenv('DB_SSL_CA');
}

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Optional: Set timezone to match local app requirements (e.g., Sri Lanka UTC+5:30)
    $pdo->exec("SET time_zone = '+05:30'");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}