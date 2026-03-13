<?php
// 热铁盒云函数 API - 用户验证模块 (auth.php)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 确保在热铁盒环境中类存在
if (!class_exists('Database')) {
    echo json_encode(['success' => false, 'message' => 'Environment error: Database not supported.']);
    exit(1);
}

// 解析 JSON 载荷
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// 支持部分服务器直接把 payload 转化到了 $_POST
if (!$input && !empty($_POST)) {
    // 可能是 application/x-www-form-urlencoded
    $input = $_POST;
} elseif (!$input && isset($HTTP_RAW_POST_DATA)) {
    $input = json_decode($HTTP_RAW_POST_DATA, true);
}

// 支持处理被服务器 301 重定向为 GET 的情况，或者仅仅是为了调试
if ((!$input || !isset($input['action'])) && !empty($_GET) && isset($_GET['action'])) {
    $input = $_GET;
}

if (!$input || !isset($input['action'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid Request',
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'contentType' => isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'none',
            'rawLength' => strlen($rawInput),
            'hasPost' => !empty($_POST)
        ]
    ]);
    exit(1);
}

$action = $input['action'];
$username = isset($input['username']) ? trim($input['username']) : null;
$password = isset($input['password']) ? trim($input['password']) : null;

if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => '用户名和密码不能为空']);
    exit(1);
}

// 连接 "users" 数据库
$db = new Database("users");

try {
    if ($action === 'register') {
        // 检查用户是否已存在
        $existingHash = $db->get($username);
        if ($existingHash !== null) {
            echo json_encode(['success' => false, 'message' => '该用户名已被注册']);
            exit(0);
        }

        // 使用 PASSWORD_DEFAULT (目前是 bcrypt) 加密密码
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $db->set($username, $hash);
        
        // 生成随机 token 并持久化到 KV 数据库
        $token = bin2hex(random_bytes(32));
        $db->set($username . '_token', $token);
        echo json_encode([
            'success' => true,
            'message' => '注册成功',
            'data' => [
                'username' => $username,
                'token' => $token
            ]
        ]);
        
    } elseif ($action === 'login') {
        // 登录
        $existingHash = $db->get($username);
        if ($existingHash === null) {
            echo json_encode(['success' => false, 'message' => '用户名或密码不正确']);
            exit(0);
        }

        // 校验密码
        if (password_verify($password, $existingHash)) {
            // 生成随机 token 并持久化到 KV 数据库
            $token = bin2hex(random_bytes(32));
            $db->set($username . '_token', $token);
            echo json_encode([
                'success' => true,
                'message' => '登录成功',
                'data' => [
                    'username' => $username,
                    'token' => $token
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => '用户名或密码不正确']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Unknown action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error']);
}
?>
