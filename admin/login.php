<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = get_db_connection()->prepare('SELECT * FROM users WHERE email = ? AND role = "admin"');
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password_hash'])) {
        $_SESSION['user_id'] = $admin['id'];
        $_SESSION['role'] = 'admin';
        header('Location: dashboard.php');
        exit;
    }

    set_flash('error', 'Invalid admin credentials.');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>
    <link rel="stylesheet" href="../public/assets/css/style.css">
</head>
<body>
    <main>
        <h2>Admin Login</h2>
        <?php if ($error = get_flash('error')): ?>
            <p style="color:red;"><?= sanitize($error) ?></p>
        <?php endif; ?>
        <form method="post">
            <label>Email<br><input type="email" name="email" required></label><br><br>
            <label>Password<br><input type="password" name="password" required></label><br><br>
            <button type="submit">Login</button>
        </form>
    </main>
</body>
</html>
