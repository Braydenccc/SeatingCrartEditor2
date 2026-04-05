<?php
// PHP 工具函数库

/**
 * 安全的 JSON 响应
 */
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($data);
    exit;
}

/**
 * 发送成功响应
 */
function successResponse($message, $data = []) {
    jsonResponse([
        "status" => "success",
        "message" => $message,
        "data" => $data
    ]);
}

/**
 * 发送错误响应
 */
function errorResponse($message, $code = 400) {
    jsonResponse([
        "status" => "error",
        "error" => $message
    ], $code);
}

/**
 * 生成随机字符串
 */
function randomString($length = 16) {
    $chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $result = "";
    for ($i = 0; $i < $length; $i++) {
        $result .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $result;
}

/**
 * 验证邮箱格式
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * 数据库辅助类
 */
class DBHelper {
    private $db;

    public function __construct($dbName) {
        $this->db = new Database($dbName);
    }

    public function get($key) {
        return $this->db->get($key);
    }

    public function set($key, $value) {
        return $this->db->set($key, $value);
    }

    public function delete($key) {
        return $this->db->delete($key);
    }

    public function exists($key) {
        return $this->get($key) !== null;
    }

    public function listAll() {
        $keys = $this->db->list_keys();
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $this->get($key);
        }
        return $result;
    }

    public function count() {
        return count($this->db->list_keys());
    }

    public function push($key, $value) {
        return $this->db->push($key, $value);
    }

    public function getArray($key) {
        return $this->db->get_array($key);
    }

    public function increment($key, $step = 1) {
        $current = $this->get($key) ?? "0";
        $value = intval($current) + $step;
        $this->set($key, strval($value));
        return $value;
    }

    public function decrement($key, $step = 1) {
        return $this->increment($key, -$step);
    }
}

/**
 * 清理 HTML 标签，防止 XSS
 */
function cleanHtml($html) {
    return htmlspecialchars($html, ENT_QUOTES, "UTF-8");
}

/**
 * 获取客户端 IP
 */
function getClientIP() {
    return $_SERVER["REMOTE_ADDR"] ?? "未知";
}

/**
 * 判断是否为 HTTPS
 */
function isHTTPS() {
    return isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on";
}

/**
 * 获取当前 URL
 */
function getCurrentURL() {
    $protocol = isHTTPS() ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"] ?? "";
    $uri = $_SERVER["REQUEST_URI"] ?? "/";
    return "$protocol://$host$uri";
}

/**
 * 设置 CORS 头
 */
function setCORS($origin = "*") {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}

/**
 * 处理 OPTIONS 预检请求
 */
function handlePreflight() {
    if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
        setCORS();
        exit;
    }
}
