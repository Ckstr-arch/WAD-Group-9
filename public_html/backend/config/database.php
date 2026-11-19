<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function env_val(string $key, string $default = ''): string
{
    $val = getenv($key);
    if ($val !== false && $val !== '') {
        return (string) $val;
    }
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return (string) $_ENV[$key];
    }
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return (string) $_SERVER[$key];
    }
    return $default;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env_val('DB_HOST');
    $port = env_val('DB_PORT', '3306');
    $name = env_val('DB_NAME');
    $user = env_val('DB_USER');
    $pass = env_val('DB_PASS');
    if ($pass === '') {
        $pass = env_val('DB_PASSWORD');
    }

    if ($host === '' || $name === '' || $user === '' || $pass === '') {
        throw new RuntimeException('Database environment variables (DB_HOST, DB_NAME, DB_USER, DB_PASS / DB_PASSWORD) are not fully configured.');
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $sslCa = env_val('DB_SSL_CA');
    if ($sslCa !== '' && is_file($sslCa)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCa;
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, $options);
    $pdo->exec("SET time_zone = '+05:30'");

    return $pdo;
}