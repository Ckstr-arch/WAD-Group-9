<?php
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['full_name'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($name && $email && strlen($password) >= 8) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = get_db_connection()->prepare(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, "user")'
        );
        try {
            $stmt->execute([$name, $email, $hash]);
            set_flash('success', 'Registration successful. Please log in.');
            header('Location: login.php');
            exit;
        } catch (PDOException $e) {
            set_flash('error', 'That email is already registered.');
        }
    } else {
        set_flash('error', 'Please fill all fields (password min 8 characters).');
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Register</title>
    <link rel="stylesheet" href="../public/assets/css/style.css">
</head>
<body>
    <main>
        <h2>Create an Account</h2>
        <?php if ($error = get_flash('error')): ?>
            <p style="color:red;"><?= sanitize($error) ?></p>
        <?php endif; ?>
        <form method="post">
            <label>Full Name<br><input type="text" name="full_name" required></label><br><br>
            <label>Email<br><input type="email" name="email" required></label><br><br>
            <label>Password<br><input type="password" name="password" required minlength="8"></label><br><br>
            <button type="submit">Register</button>
        </form>
        <p>Already have an account? <a href="login.php">Login</a></p>
    </main>
</body>
</html>
