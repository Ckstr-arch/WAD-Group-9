<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function is_logged_in(): bool
{
    return !empty($_SESSION['user_id']);
}

function is_admin(): bool
{
    return is_logged_in() && ($_SESSION['role'] ?? '') === 'admin';
}

function require_login(string $redirect = '/user/login.php'): void
{
    if (!is_logged_in()) {
        header('Location: ' . $redirect);
        exit;
    }
}

function require_admin(string $redirect = '/admin/login.php'): void
{
    if (!is_admin()) {
        header('Location: ' . $redirect);
        exit;
    }
}
