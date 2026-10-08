<?php
declare(strict_types=1);

require_once dirname(__DIR__, 3) . '/bootstrap.php';

motofix_require_method('GET');

try {
    motofix_db()->query('SELECT 1');
    motofix_json_response([
        'status' => 'ok',
        'api' => 'v1',
        'database' => 'connected',
        'time' => gmdate(DATE_ATOM),
    ]);
} catch (Throwable $error) {
    error_log('MotoFix health check failed: ' . $error->getMessage());
    motofix_json_response(['error' => 'database_unavailable'], 503);
}