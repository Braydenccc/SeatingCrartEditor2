<?php
session_start();

$error = "";
$success = "";
$currentUser = null;

// 检查是否已登录
if (isset($_SESSION["user_id"])) {
    $currentUser = [
        "id" => $_SESSION["user_id"],
        "username" => $_SESSION["username"] ?? "",
        "login_time" => $_SESSION["login_time"] ?? 0
    ];
}

// 处理登录
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["action"])) {
    if ($_POST["action"] === "login") {
        $username = trim($_POST["username"] ?? "");
        $password = trim($_POST["password"] ?? "");

        // 简单验证（实际应用中应该使用数据库验证）
        if (empty($username) || empty($password)) {
            $error = "请输入用户名和密码";
        } elseif (strlen($password) < 6) {
            $error = "密码长度不能少于 6 位";
        } else {
            // 登录成功，保存到 Session
            $_SESSION["user_id"] = randomString();
            $_SESSION["username"] = $username;
            $_SESSION["login_time"] = time();

            $success = "登录成功！欢迎，" . htmlspecialchars($username);
            header("Refresh: 2");
            exit;
        }
    } elseif ($_POST["action"] === "logout") {
        // 退出登录
        session_unset();
        session_destroy();
        $success = "已退出登录";
    }
}

// 辅助函数
function randomString($length = 16) {
    $chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $result = "";
    for ($i = 0; $i < $length; $i++) {
        $result .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $result;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>用户登录 - PHP Session</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">用户登录系统</h5>
                    </div>
                    <div class="card-body">

                        <?php if ($error): ?>
                            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
                        <?php endif; ?>

                        <?php if ($success): ?>
                            <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
                        <?php endif; ?>

                        <?php if ($currentUser): ?>
                            <!-- 已登录状态 -->
                            <div class="alert alert-info">
                                <h6>欢迎回来，<?php echo htmlspecialchars($currentUser["username"]); ?>！</h6>
                                <p class="mb-0">
                                    用户 ID：<?php echo htmlspecialchars($currentUser["id"]); ?><br>
                                    登录时间：<?php echo date("Y-m-d H:i:s", $currentUser["login_time"]); ?><br>
                                   Session ID：<?php echo session_id(); ?>
                                </p>
                            </div>
                            <form method="POST">
                                <input type="hidden" name="action" value="logout">
                                <button type="submit" class="btn btn-danger w-100">退出登录</button>
                            </form>
                        <?php else: ?>
                            <!-- 未登录状态 -->
                            <form method="POST">
                                <input type="hidden" name="action" value="login">
                                <div class="mb-3">
                                    <label for="username" class="form-label">用户名</label>
                                    <input type="text" class="form-control" id="username" name="username" required>
                                </div>
                                <div class="mb-3">
                                    <label for="password" class="form-label">密码</label>
                                    <input type="password" class="form-control" id="password" name="password" required minlength="6">
                                    <small class="text-muted">密码至少 6 位（演示用，任意密码可登录）</small>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">登录</button>
                            </form>
                        <?php endif; ?>

                        <div class="mt-4 text-center">
                            <small class="text-muted">
                                PHP Session 演示<br>
                                Session 数据存储在服务器端，通过 Cookie 识别用户
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
