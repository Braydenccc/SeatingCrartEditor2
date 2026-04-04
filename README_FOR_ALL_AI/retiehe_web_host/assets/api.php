<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
    // GET 请求：返回统计信息
    $db = new Database("api_stats");
    $visits = $db->get("total_visits") ?? "0";
    $visits = intval($visits);
    $visits++;
    $db->set("total_visits", $visits);

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "method" => "GET",
        "data" => [
            "message" => "API 正常运行",
            "total_visits" => $visits,
            "timestamp" => time(),
            "datetime" => date("Y-m-d H:i:s")
        ]
    ]);
    exit;
}

if ($method === "POST") {
    // POST 请求：处理提交的数据
    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";

    if (strpos($contentType, "application/json") !== false) {
        // JSON 数据
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "method" => "POST",
            "data" => [
                "received" => $data,
                "message" => "数据已接收",
                "timestamp" => time()
            ]
        ]);
    } else {
        // 表单数据
        $data = $_POST;

        // 保存到数据库
        $db = new Database("submissions");
        $id = "sub_" . time();
        $db->set($id, json_encode($data));

        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "method" => "POST",
            "data" => [
                "received" => $data,
                "id" => $id,
                "message" => "数据已保存到数据库",
                "timestamp" => time()
            ]
        ]);
    }
    exit;
}

// 不支持的方法
http_response_code(405);
echo json_encode([
    "status" => "error",
    "error" => "Method Not Allowed",
    "message" => "仅支持 GET 和 POST 请求"
]);
