<?php
header("Content-Type: text/html; charset=utf-8");

$error = "";
$success = "";

// 处理表单提交
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = trim($_POST["name"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $message = trim($_POST["message"] ?? "");

    // 验证输入
    if (empty($name)) {
        $error = "请输入姓名";
    } elseif (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "请输入有效的邮箱地址";
    } elseif (empty($message)) {
        $error = "请输入留言内容";
    } else {
        // 保存到数据库
        $db = new Database("messages");
        $data = [
            "name" => $name,
            "email" => $email,
            "message" => $message,
            "timestamp" => time(),
            "datetime" => date("Y-m-d H:i:s")
        ];
        $id = "msg_" . time() . "_" . rand(1000, 9999);
        $db->set($id, json_encode($data));

        $success = "感谢您的留言，我们会尽快回复！";
    }
}

// 获取所有留言
$allMessages = [];
$db = new Database("messages");
$keys = $db->list_keys();
foreach ($keys as $key) {
    $msg = $db->get($key);
    if ($msg) {
        $decoded = json_decode($msg, true);
        if ($decoded) {
            $decoded["id"] = $key;
            $allMessages[] = $decoded;
        }
    }
}

// 按时间倒序排序
usort($allMessages, function($a, $b) {
    return $b["timestamp"] - $a["timestamp"];
});
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>留言板 - PHP</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1 class="mb-4">留言板</h1>

        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="alert alert-success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>

        <div class="row">
            <!-- 留言表单 -->
            <div class="col-md-5">
                <div class="card">
                    <div class="card-header">发表留言</div>
                    <div class="card-body">
                        <form method="POST">
                            <div class="mb-3">
                                <label for="name" class="form-label">姓名</label>
                                <input type="text" class="form-control" id="name" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">邮箱</label>
                                <input type="email" class="form-control" id="email" name="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="message" class="form-label">留言内容</label>
                                <textarea class="form-control" id="message" name="message" rows="4" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">提交</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 留言列表 -->
            <div class="col-md-7">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span>留言列表 (<?php echo count($allMessages); ?>)</span>
                        <small class="text-muted">共 <?php echo count($allMessages); ?> 条留言</small>
                    </div>
                    <div class="card-body">
                        <?php if (empty($allMessages)): ?>
                            <p class="text-muted text-center">暂无留言</p>
                        <?php else: ?>
                            <?php foreach ($allMessages as $msg): ?>
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h6 class="card-title">
                                        <?php echo htmlspecialchars($msg["name"]); ?>
                                        <small class="text-muted"><?php echo htmlspecialchars($msg["email"]); ?></small>
                                    </h6>
                                    <p class="card-text"><?php echo nl2br(htmlspecialchars($msg["message"])); ?></p>
                                    <small class="text-muted">
                                        <?php echo htmlspecialchars($msg["datetime"]); ?>
                                    </small>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
