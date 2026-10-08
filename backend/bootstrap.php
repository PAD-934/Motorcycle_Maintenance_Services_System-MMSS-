<?php
declare(strict_types=1);

date_default_timezone_set('UTC');

function motofix_json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function motofix_require_method(string $expected): void
{
    $actual = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($actual !== strtoupper($expected)) {
        header('Allow: ' . strtoupper($expected));
        motofix_json_response(['error' => 'method_not_allowed'], 405);
    }
}

function motofix_db(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $configPath = __DIR__ . '/config.php';
    if (!is_file($configPath)) {
        motofix_json_response([
            'error' => 'backend_not_configured',
            'message' => 'Copy backend/config.example.php to backend/config.php and configure MySQL.',
        ], 503);
    }

    $config = require $configPath;
    $database = $config['database'] ?? [];
    $host = $database['host'] ?? '127.0.0.1';
    $port = (int) ($database['port'] ?? 3306);
    $name = $database['database'] ?? 'motofix';
    $charset = $database['charset'] ?? 'utf8mb4';
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

    try {
        $connection = new PDO(
            $dsn,
            (string) ($database['username'] ?? ''),
            (string) ($database['password'] ?? ''),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );
    } catch (PDOException $error) {
        error_log('MotoFix database connection failed: ' . $error->getMessage());
        motofix_json_response(['error' => 'database_unavailable'], 503);
    }

    return $connection;
}