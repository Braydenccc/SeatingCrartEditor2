---
name: retiehe-web-hosting
description: Web development for Retiehe hosting platform. Use for creating PHP/Node.js cloud functions, using KV database, implementing common resources (jQuery, Vue, Bootstrap via CDN), handling requests/responses, session management, file operations, and database operations.
license: MIT
metadata:
  author: retiehe
  version: "1.0"
---

# 热铁盒网页托管开发

本技能提供了在热铁盒平台进行网页开发的完整指南，包括云函数开发、数据库操作、资源引用等。

## 目录

1. [常见资源文件](#常见资源文件)
2. [PHP 云函数](#php-云函数)
3. [Node.js 云函数](#nodejs-云函数)
4. [数据库操作](#数据库操作)
5. [最佳实践](#最佳实践)

## 常见资源文件

对于常见的资源文件（如 jQuery、Bootstrap、Vue 等），建议使用公共 CDN 调用。

### CDN 自动转换

热铁盒支持自动将常见的公共 CDN（CDNJS、JSDelivr npm、unpkg）链接转换为国内高速 CDN。

**推荐使用 CDNJS:**

```html
<!-- jQuery -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

<!-- Bootstrap JS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/js/bootstrap.min.js"></script>
```

### 弃用方式

通过文件名直接调用的方式已弃用（如 `<script src="jquery.min.js"></script>`），请改用公共 CDN。

## PHP 云函数

### 基本使用

创建以 `.php` 结尾的文件，代码会在服务器后端执行。

**第一个云函数:**

```php
<?php
echo "Hello, World!";
```

### 获取请求信息

```php
// URL 查询参数
$name = $_GET["name"];

// POST 参数
$message = $_POST["message"];

// 请求头
$lang = $_SERVER["HTTP_ACCEPT_LANGUAGE"];

// Cookie
$sid = $_COOKIE["sessionId"];

// 用户代理
$ua = $_SERVER["HTTP_USER_AGENT"];

// 来源网址
$ref = $_SERVER["HTTP_REFERER"];

// 访客 IP
$ip = $_SERVER["REMOTE_ADDR"];

// 请求方法
$method = $_SERVER["REQUEST_METHOD"];
```

### 响应请求

```php
// 输出内容
echo "Hello, World!";

// 输出 JSON
$data = ["message" => "Hello"];
echo json_encode($data);

// 设置响应状态码
http_response_code(404);

// 设置响应头
header("Cache-Control: max-age=3600");

// 设置 Cookie
setcookie("username", "Alice", time() + (7 * 24 * 60 * 60));

// 重定向
header("Location: https://example.com/");
exit;
```

### Session 管理

```php
// 启动 Session (必须在任何输出之前)
session_start();

// 存储 Session 数据
$_SESSION["username"] = "Alice";

// 读取 Session 数据
if (isset($_SESSION["username"])) {
    echo "欢迎，" . $_SESSION["username"];
}

// 删除 Session 变量
unset($_SESSION["username"]);

// 销毁整个 Session
session_destroy();
```

### 读写文件

**重要：** 文件路径必须使用完整路径，不支持相对路径。

```php
// 读取文件
$content = file_get_contents("databases/data.txt");

// 读取 JSON 文件
$data = json_decode(file_get_contents("databases/data.json"), true);

// 写入文件
file_put_contents("databases/data.txt", "Hello, File!");

// 写入 JSON 文件
$data = ["key" => "value"];
file_put_contents("databases/data.json", json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

// 列出文件
$files = scandir(".");
echo implode("<br>", $files);

// 检查剩余空间 (总大小限制 4 MB)
$free_space = disk_free_space(".");
```

### 引入其他文件

```php
// 引入 PHP 文件 (只引入一次，确保不重复)
require_once "lib/utils.php";

// 引入后可调用该文件中的函数
$message = greet("Alice");
```

## Node.js 云函数

### 基本使用

创建以 `.node.js` 结尾的文件，代码会在服务器后端执行。

**第一个云函数:**

```javascript
document.write("Hello, World!");
```

### 获取请求信息

```javascript
// URL 查询参数
const name = req.query.name;
document.write(name);

// POST 参数
const message = req.body.message;

// 请求头
const acceptLanguage = req.headers["accept-language"];

// Cookie
const sessionId = req.cookies.sessionId;

// 用户代理
const userAgent = req.headers["user-agent"];
document.write(navigator.userAgent);  // 也可以用前端风格

// 来源网址
document.write(req.headers.referer);
document.write(document.referrer);    // 也可以用前端风格

// 访客 IP
const ip = req.ip;

// 当前网址
const url = req.url;
document.write(location.href);  // 也可以用前端风格

// 请求方法
const method = req.method;
```

### 响应请求

```javascript
// 输出内容
res.write("Hello, ");
res.write("World!");
document.write("!");  // 也可以用 document.write

// 输出内容并退出
res.end("Goodbye!");
res.send("Message");  // 功能相同

// 输出 JSON (自动设置响应头)
const data = { message: "Hello, JSON!" };
res.json(data);

// 设置响应状态码
res.status(404);
res.statusCode = 404;

// 设置响应头
res.setHeader("Cache-Control", "max-age=3600");
res.set("Cache-Control", "max-age=3600");

// 设置 Cookie
res.cookie("username", "Alice", { maxAge: 7 * 24 * 60 * 60 * 1000 });

// 重定向
res.redirect("https://example.com/");
res.redirect(301, "https://example.com/");  // 永久重定向
location.href = "https://example.com/";     // 也可以用前端风格

// 提前退出
process.exit();
```

### 读写文件

**重要：** 文件路径必须使用完整路径，不支持相对路径。

```javascript
// 读取文件
const content = fs.readFileSync("databases/data.txt");
document.write(content);

// 使用前端风格读取
const content = localStorage.getItem("databases/data.txt");

// 检查文件是否存在
if (fs.existsSync("databases/data.txt")) {
    const content = fs.readFileSync("databases/data.txt");
}

// 读取 JSON 文件
const content = fs.readFileSync("databases/data.json");
const data = JSON.parse(content);

// 写入文件
fs.writeFileSync("databases/data.txt", "Hello, File!");
localStorage.setItem("databases/data.txt", "Hello, File!");

// 写入 JSON 文件
const data = { key: "value" };
fs.writeFileSync("databases/data.json", JSON.stringify(data));

// 列出文件
const files = fs.readdirSync(".");
document.write(files);

// 检查剩余空间 (总大小限制 4 MB)
const freeSpace = os.diskFreeSpace();
```

### 引入其他文件

**导出模块 (utils.node.js):**

```javascript
function add(a, b) {
    return a + b;
}

function greet(name) {
    return `Hello, ${name}!`;
}

module.exports = { add, greet };
```

**引入模块:**

```javascript
const utils = require("lib/utils.node.js");

const message = utils.greet("Alice");
document.write(message);

const sum = utils.add(3, 5);
document.write(sum);
```

**引入 JSON 文件:**

```javascript
const config = require("config.json");
document.write(config.appName);
```

**Node.js 内置模块:**

支持的模块：`crypto`, `fs`, `os`, `path`, `process`, `querystring`

## 数据库操作

热铁盒提供 KV 数据库，每个网站可创建多个数据库。

### 基本操作

**PHP:**

```php
// 打开数据库
$db = new Database("database_name");

// 读取数据
$data = $db->get("key_name");
echo $data;

// 写入数据
$db->set("key_name", "value");

// 删除数据
$db->delete("key_name");

// 列出所有键
$keys = $db->list_keys();
echo implode("<br>", $keys);
```

**Node.js:**

```javascript
// 打开数据库
const db = new Database("database_name");

// 读取数据 (异步)
const data = await db.get("key_name");
document.write(data);

// 写入数据
db.set("key_name", "value");

// 删除数据
db.delete("key_name");

// 列出所有键 (异步)
const keys = await db.listKeys();
document.write(keys);
```

### 数组操作

**PHP:**

```php
$db = new Database("database_name");

// 添加值到数组
$db->push("key_name", "value1");
$db->push("key_name", "value2");

// 读取数组
$values = $db->get_array("key_name");
echo implode("<br>", $values);

// 删除数组中的某个值
$db->delete("key_name", "value1");

// 删除整个数组
$db->delete("key_name");
```

**Node.js:**

```javascript
const db = new Database("database_name");

// 添加值到数组
db.push("key_name", "value1");
db.push("key_name", "value2");

// 读取数组 (异步)
const values = await db.getArray("key_name");
document.write(values);

// 删除数组中的某个值
db.delete("key_name", "value1");

// 删除整个数组
db.delete("key_name");
```

### 完整示例

**PHP 访问统计:**

```php
<?php
$db = new Database("visits");

if (isset($_GET["name"])) {
    $name = $_GET["name"];
    $count = 0;
    $data = $db->get($name);
    if ($data !== null) {
        $count = intval($data);
    }
    $count++;
    $db->set($name, strval($count));
}
?>
<!DOCTYPE html>
<html>
    <head><title>访问统计</title></head>
    <body>
        <?php if (isset($_GET["name"])) {
            echo "<p>欢迎，" . htmlspecialchars($name) . "！您访问了本站 $count 次。</p>";
        } ?>
        <form>
            <label for="name">名字：</label>
            <input type="text" id="name" name="name">
            <input type="submit" />
        </form>
    </body>
</html>
```

**Node.js 访问统计:**

```javascript
async function main() {
    const db = new Database("visits");
    const visitor = req.query.name;
    let count = 0;

    if (visitor) {
        const data = await db.get(visitor);
        if (data) {
            count = parseInt(data);
        }
        count++;
        db.set(visitor, count.toString());
    }

    document.write(`
        <!DOCTYPE html>
        <html>
            <head><title>访问统计</title></head>
            <body>
                ${visitor ? `<p>欢迎，${visitor}！您访问了本站 ${count} 次。</p>` : ""}
                <form>
                    <label for="name">名字：</label>
                    <input type="text" id="name" name="name">
                    <input type="submit" />
                </form>
            </body>
        </html>
    `);
}
main();
```

### 第三方 SQL 数据库

仅 PHP 云函数支持连接第三方 SQL 数据库：

```php
<?php
$conn = mysqli_connect("host", "username", "password", "database_name");
$result = mysqli_query($conn, "SELECT * FROM table_name");
while ($row = mysqli_fetch_assoc($result)) {
    echo $row["column_name"] . "<br>";
}
mysqli_close($conn);
```

建议选择位于美国西部的数据库实例以获得最低延迟。

## 命名规则

- 数据库名称和键名只能包含：字母、数字、下划线 `_`、连字符 `-`
- 区分大小写

## 限制与注意事项

### PHP 云函数

- 不能运行需要安装的 PHP 程序（如 WordPress、Discuz!）
- 不能写入 CSS、JavaScript、PHP 等代码文件
- 一次运行最多只能调用 10 次引入操作

### Node.js 云函数

- 不支持安装 npm 依赖
- 不支持异步函数 (fs 模块只支持同步方法)
- 不能写入 CSS、JavaScript、PHP 等代码文件

### 共同限制

- 文本文件总大小限制：4 MB
- 超过此限制无法读写文件
- 建议使用数据库存储大量数据

### 路径说明

在热铁盒中，`/` 是文件名的一部分，不支持相对路径。

- ❌ 错误：`__DIR__ . "/data.txt"` 或 `../data.txt`
- ✅ 正确：`data.txt` 或 `databases/data.txt`

不要使用 `__DIR__` 常量获取当前文件夹路径。

## 数据库管理

在网站列表中：
1. 右键点击网站
2. 选择「数据库」
3. 可以浏览、修改、删除键值对

## 最佳实践

### 资源引用

1. 优先使用公共 CDN（CDNJS）引用常见库
2. 自动转换为国内高速 CDN，无需手动处理

### 数据存储

| 场景 | 推荐方案 |
|------|---------|
| 配置文件 | JSON 文件 (小于 4 MB) |
| 用户数据 | KV 数据库 |
| 临时数据 | Session |
| 大量数据 | KV 数据库 (无大小限制) |
| 第三方数据 | SQL 数据库 |

### 性能优化

- 数组操作不如单个值高效，不要滥用
- 使用索引优化数据库查询（第三方 SQL 数据库）
- 合理设置缓存头
- 避免在云函数中进行大量计算

### 安全建议

- 对用户输入进行验证和过滤
- 使用 `htmlspecialchars()` 防止 XSS
- 敏感数据使用 HTTPS
- 不要在代码中暴露密码或密钥
- 验证请求来源和 Cookie

### 代码组织

- PHP 云函数：使用 `require_once` 模块化代码
- Node.js 云函数：使用 `require()` 和 `module.exports`
- 将通用工具函数放在单独的文件中
- 合理的目录结构有助于维护

### 调试技巧

- 使用简单的 `echo` / `document.write` 输出调试信息
- 检查文件路径是否正确
- 验证数据库连接状态
- 使用数据库管理界面直接查看数据
- 注意 PHP 的 `session_start()` 必须在所有输出之前调用

## 常见场景示例

### RESTful API (PHP)

```php
<?php
header("Content-Type: application/json");
$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
    echo json_encode(["status" => "ok", "data" => "GET"]);
} elseif ($method === "POST") {
    echo json_encode(["status" => "ok", "data" => "POST"]);
}
```

### RESTful API (Node.js)

```javascript
if (req.method === "GET") {
    res.json({ status: "ok", data: "GET" });
} else if (req.method === "POST") {
    res.json({ status: "ok", data: "POST" });
}
```

### 表单处理 (PHP)

```php
<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = $_POST["name"];
    $db = new Database("submissions");
    $db->set(time(), $name);
    echo "提交成功！";
}
?>
<form method="POST">
    <input type="text" name="name" required>
    <button type="submit">提交</button>
</form>
```

### 表单处理 (Node.js)

```javascript
if (req.method === "POST") {
    const name = req.body.name;
    const db = new Database("submissions");
    db.set(Date.now().toString(), name);
    document.write("提交成功！");
}

document.write(`
    <form method="POST">
        <input type="text" name="name" required>
        <button type="submit">提交</button>
    </form>
`);
```

### 文件上传处理 (PHP - 简化版)

```php
<?php
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["file"])) {
    $file = $_FILES["file"];
    $target = "uploads/" . basename($file["name"]);
    move_uploaded_file($file["tmp_name"], $target);
    echo "上传成功！";
}
?>
<form method="POST" enctype="multipart/form-data">
    <input type="file" name="file" required>
    <button type="submit">上传</button>
</form>
```

## 相关资源

- [热铁盒常见资源文件](https://docs.retiehe.com/host/common-resource.html)
- [PHP 云函数文档](https://docs.retiehe.com/host/php-cloud-function.html)
- [Node.js 云函数文档](https://docs.retiehe.com/host/js-cloud-function.html)
- [数据库文档](https://docs.retiehe.com/host/database.html)
