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

if (in_array('--write', $argv, true)){
    $path = __DIR__ . '/seed.sql';
    $sql = file_get_contents($path);
    if ($sql === false) {
        fwrite(STDERR, "Unable to read seed.sql.\n");
        exit(1);
    }
    foreach ($hashes as $variable => $hash){
        $pattern = '/SET @' . $variable . " = '[^']*';/";
        $sql = preg_replace_callback($pattern, static fn(): string => "SET @{$variable} = '{$hash}';", $sql, 1, $count);
        if ($sql === null || $count !== 1) {
            fwrite(STDERR, "Could not find development password assignment.\n");
            exit(1);
        }
    }
    if (file_put_contents($path, $sql) === false) {
        fwrite(STDERR, "Unable to write seed.sql.\n");
        exit(1);
    }
    fwrite(STDOUT, "Regenerated development password_hash() values in seed.sql.\n");
    exit;
}

fwrite(STDOUT, "-- DEVELOPMENT ONLY. Paste these generated assignments into seed.sql.\n");
foreach ($hashes as $variable => $hash) {
    fwrite(STDOUT, "SET @{$variable} = '{$hash}';\n");
}