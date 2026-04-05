<?php
require_once "lib/utils.php";

// 使用工具函数
handlePreflight();
setCORS();

// 访问统计 API
$api_db = new DBHelper("api_stats");
$visit_count = $api_db->increment("total_visits");

$json_data = json_encode([
    "status" => "success",
    "message" => "模块化代码示例",
    "visits" => $visit_count,
    "timestamp" => time(),
    "current_ip" => getClientIP(),
    "current_url" => getCurrentURL(),
    "is_https" => isHTTPS(),
    "random_id" => randomString()
]);

header("Content-Type: application/json; charset=utf-8");
echo $json_data;
