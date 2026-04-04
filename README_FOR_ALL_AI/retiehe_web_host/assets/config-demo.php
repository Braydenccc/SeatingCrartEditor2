配置文件示例 - PHP
<?php
// 从 JSON 配置文件读取配置
$db = new Database("settings");

// 读取配置
$theme = $db->get("theme") ?? "light";
$language = $db->get("language") ?? "zh-CN";
$timezone = $db->get("timezone") ?? "Asia/Shanghai";

// 或者使用 config.json 文件
$config = json_decode(file_get_contents("config.json"), true);

// 格式化输出配置
header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>文件读写配置 - PHP</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1 class="mb-4">配置管理示例</h1>

        <div class="row">
            <!-- 从数据库读取的配置 -->
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5>数据库配置</h5>
                    </div>
                    <div class="card-body">
                        <ul>
                            <li>主题：<?php echo htmlspecialchars($theme); ?></li>
                            <li>语言：<?php echo htmlspecialchars($language); ?></li>
                            <li>时区：<?php echo htmlspecialchars($timezone); ?></li>
                        </ul>

                        <form method="POST" class="mt-3">
                            <div class="mb-2">
                                <select name="theme" class="form-select">
                                    <option value="light" <?php echo $theme === "light" ? "selected" : ""; ?>>浅色主题</option>
                                    <option value="dark" <?php echo $theme === "dark" ? "selected" : ""; ?>>深色主题</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">保存到数据库</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 从 JSON 文件读取的配置 -->
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5>JSON 配置文件</h5>
                    </div>
                    <div class="card-body">
                        <h6>应用信息</h6>
                        <ul>
                            <li>名称：<?php echo htmlspecialchars($config["appName"]); ?></li>
                            <li>版本：<?php echo htmlspecialchars($config["version"]); ?></li>
                            <li>作者：<?php echo htmlspecialchars($config["author"]); ?></li>
                        </ul>

                        <h6>支持特性</h6>
                        <ul>
                            <?php foreach ($config["features"] as $key => $value): ?>
                            <li><?php echo htmlspecialchars($value); ?></li>
                            <?php endforeach; ?>
                        </ul>

                        <h6>限制</h6>
                        <ul>
                            <?php foreach ($config["limits"] as $key => $value): ?>
                            <li><?php echo htmlspecialchars("$key: $value"); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <?php if ($_SERVER["REQUEST_METHOD"] === "POST"): ?>
            <?php
            // 保存配置到数据库
            $db->set("theme", $_POST["theme"]);
            ?>
            <div class="alert alert-success">配置已保存！请刷新页面查看效果。</div>
        <?php endif; ?>
    </div>
</body>
</html>
