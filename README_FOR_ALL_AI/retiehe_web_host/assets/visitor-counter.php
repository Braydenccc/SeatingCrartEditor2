<?php
$db = new Database("visits");
$visitor = $_GET["name"] ?? "";
$count = 0;

if ($visitor) {
    $data = $db->get($visitor);
    if ($data !== null) {
        $count = intval($data);
    }
    $count++;
    $db->set($visitor, strval($count));
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>访问统计 - PHP</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <div class="card">
            <div class="card-header">
                <h5>访问统计 (PHP + KV 数据库)</h5>
            </div>
            <div class="card-body">
                <?php if ($visitor): ?>
                    <div class="alert alert-success">
                        欢迎返回，<?php echo htmlspecialchars($visitor); ?>！
                        <br>您已访问本站 <strong><?php echo $count; ?></strong> 次。
                    </div>
                <?php else: ?>
                    <div class="alert alert-info">请输入您的名字以记录访问次数</div>
                <?php endif; ?>

                <form method="GET" class="mt-3">
                    <div class="input-group">
                        <input type="text" name="name" class="form-control"
                               placeholder="输入您的名字"
                               value="<?php echo htmlspecialchars($visitor); ?>" required>
                        <button type="submit" class="btn btn-primary">记录访问</button>
                    </div>
                </form>

                <div class="mt-4">
                    <h6>所有访客统计：</h6>
                    <?php
                    $keys = $db->list_keys();
                    if (count($keys) > 0):
                    ?>
                    <ul>
                        <?php foreach ($keys as $key): ?>
                        <li>
                            <?php echo htmlspecialchars($key); ?>:
                            <?php echo $db->get($key); ?> 次
                        </li>
                        <?php endforeach; ?>
                    </ul>
                    <?php else: ?>
                        <p class="text-muted">暂无访客记录</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
