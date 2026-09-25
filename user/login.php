<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = get_db_connection()->prepare('SELECT * FROM users WHERE email = ? AND role = "user"');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = 'user';
        header('Location: dashboard.php');
        exit;
    }

    set_flash('error', 'Invalid email or password.');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>User Login</title>
    <link rel="stylesheet" href="../public/assets/css/style.css">
</head>
<body>
    <main>
        <h2>Login</h2>
        <?php if ($error = get_flash('error')): ?>
            <p style="color:red;"><?= sanitize($error) ?></p>
        <?php endif; ?>
        <form method="post">
            <label>Email<br><input type="email" name="email" required></label><br><br>
            <label>Password<br><input type="password" name="password" required></label><br><br>
            <button type="submit">Login</button>
        </form>
        <p>No account? <a href="register.php">Register</a></p>
    </main>
</body>
</html>
