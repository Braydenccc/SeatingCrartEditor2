# 热铁盒网页托管开发 Agent Skills

完整的热铁盒网页托管平台开发指南和示例代码集合。

## 快速开始

1. 将整个 `retiehe-web-hosting` 文件夹上传到你的热铁盒网站
2. 访问 `assets/index.html` 查看所有示例
3. 参考示例代码开发你的应用

## 文件结构

```
retiehe-web-hosting/
├── SKILL.md                      # 主技能文档（完整开发指南）
├── README.md                     # 本文件
├── references/
│   └── REFERENCE.md              # 完整 API 参考
├── assets/                       # 示例代码（可直接部署）
│   ├── index.html                # 示例导航首页
│   ├── visitor-counter.php       # PHP 访问统计示例
│   ├── visitor-counter.node.js   # Node.js 访问统计示例
│   ├── api.php                   # PHP RESTful API
│   ├── api.node.js               # Node.js RESTful API
│   ├── form.php                  # PHP 留言板
│   ├── form.node.js              # Node.js 留言板
│   ├── login.php                 # PHP Session 登录
│   ├── config-demo.php           # PHP 文件读写
│   ├── config-demo.node.js       # Node.js 文件读写
│   ├── modular.php               # PHP 模块化代码
│   ├── modular.node.js           # Node.js 模块化代码
│   └── config.json               # 配置文件示例
└── lib/                          # 工具函数库
    ├── utils.php                 # PHP 工具函数
    └── utils.node.js             # Node.js 工具函数
```

## 功能特性

### PHP 云函数
- ✅ 完整的请求处理（GET、POST、Cookie、Session）
- ✅ KV 数据库操作
- ✅ 文件读写（JSON 文件支持）
- ✅ Session 用户状态管理
- ✅ 模块化代码（require_once）

### Node.js 云函数
- ✅ 前端风格 API（req/res 对象）
- ✅ Express-inspired 接口
- ✅ KV 数据库操作
- ✅ 文件系统操作（fs 模块）
- ✅ CommonJS 模块系统

### 通用特性
- ✅ CDN 资源自动转换
- ✅ 响应头和状态码控制
- ✅ Cookie 管理
- ✅ JSON 数据处理
- ✅ 错误处理机制

## 示例说明

### 1. 访问统计 (visitor-counter)
- 演示如何使用数据库存储和读取数据
- 支持多个访客分别统计
- PHP 和 Node.js 版本

**访问 URL:**
- PHP: `/assets/visitor-counter.php?name=你的名字`
- Node.js: `/assets/visitor-counter.node.js?name=你的名字`

### 2. RESTful API (api)
- 支持 GET 和 POST 请求
- JSON 格式响应
- CORS 支持

**API 测试:**
```bash
# GET 请求
curl /assets/api.php

# POST 请求（表单）
curl -X POST -d "message=Hello" /assets/api.php

# POST 请求（JSON）
curl -X POST -H "Content-Type: application/json" -d '{"data": "test"}' /assets/api.php
```

### 3. 留言板 (form)
- 表单提交和处理
- 数据验证
- 留言列表展示
- 使用数据库存储

**访问 URL:**
- PHP: `/assets/form.php`
- Node.js: `/assets/form.node.js`

### 4. 用户登录 (login)
- PHP Session 管理
- 登录/退出功能
- Session 数据持久化

**访问 URL:**
- PHP: `/assets/login.php`

### 5. 配置管理 (config-demo)
- JSON 配置文件读取
- 数据库配置存储
- 配置更新演示

**访问 URL:**
- PHP: `/assets/config-demo.php`
- Node.js: `/assets/config-demo.node.js`

### 6. 模块化代码 (modular)
- 工具函数库的使用
- 代码模块化演示
- DBHelper 封装示例

**访问 URL:**
- PHP: `/assets/modular.php`
- Node.js: `/assets/modular.node.js`

## 工具函数库

### PHP 工具函数 (`lib/utils.php`)

```php
// 引入工具库
require_once "lib/utils.php";

// 数据库封装
$db = new DBHelper("database_name");
$value = $db->get("key");
$db->set("key", "value");
$count = $db->count();

// JSON 响应
jsonResponse(["data" => "result"], 200);
successResponse("操作成功");
errorResponse("错误信息");

// 实用函数
randomString(16);
isValidEmail("test@example.com");
getClientIP();
getCurrentURL();
```

### Node.js 工具函数 (`lib/utils.node.js`)

```javascript
// 引入工具库
const utils = require("lib/utils.node.js");

// 数据库封装
const db = new utils.DBHelper("database_name");
const value = await db.get("key");
db.set("key", "value");
const count = await db.count();

// 实用函数
utils.randomString(16);
utils.isValidEmail("test@example.com");
utils.formatDate(timestamp);
utils.now();
utils.generateId();
```

## 数据库操作

### 创建数据库
```php
$db = new Database("database_name");
```

```javascript
const db = new Database("database_name");
```

### 基本操作

| 操作 | PHP | Node.js |
|------|-----|---------|
| 读取 | `$db->get("key")` | `await db.get("key")` |
| 写入 | `$db->set("key", "value")` | `db.set("key", "value")` |
| 删除 | `$db->delete("key")` | `db.delete("key")` |
| 列出键 | `$db->list_keys()` | `await db.listKeys()` |

### 数组操作

| 操作 | PHP | Node.js |
|------|-----|---------|
| 添加 | `$db->push("key", "value")` | `db.push("key", "value")` |
| 读取 | `$db->get_array("key")` | `await db.getArray("key")` |
| 删除值 | `$db->delete("key", "value")` | `db.delete("key", "value")` |

## 开发最佳实践

### 1. 资源引用
- 优先使用公共 CDN（CDNJS、JSDelivr、unpkg）
- 热铁盒会自动转换为国内高速 CDN
- 示例：`<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>`

### 2. 数据存储选择

| 数据类型 | 推荐方案 | 原因 |
|---------|---------|------|
| 配置文件 | JSON 文件 | 简单易读 |
| 用户数据 | KV 数据库 | 无大小限制，高性能 |
| 会话数据 | Session | 服务器端存储，安全 |
| 临时数据 | Memory/Session | 快速访问 |

### 3. 安全建议
- 对用户输入进行验证
- 使用 `htmlspecialchars()` 防止 XSS
- 敏感操作使用 HTTPS
- 不要在代码中硬编码密码
- 检查文件路径，防止目录遍历

### 4. 代码组织
- 使用工具函数库减少重复代码
- 模块化设计，文件职责清晰
- 合理的目录结构
- 添加必要的注释

### 5. 路径注意
- 不支持相对路径（如 `../`）
- 不要使用 `__DIR__` 常量
- 始终使用完整路径（如 `databases/data.txt`）

## 限制说明

### 文件限制
- 文本文件总大小限制：4 MB
- 超过则无法读写文件
- 解决方法：使用数据库存储大量数据

### PHP 限制
- 一次运行最多 10 次引入操作
- 不能运行需要安装的 PHP 程序（如 WordPress）
- 不能写入代码文件（PHP/JS/CSS）

### Node.js 限制
- 不支持 npm 依赖
- 同步 fs 操作（不支持异步）
- 不能写入代码文件

### 数据库限制
- 键值最长 65535 字符
- 数据库和键名只能包含：字母、数字、`_`、`-`

## 常见问题

### Q: 如何调试代码？
A: 使用 `echo`（PHP）或 `document.write`/`res.write`（Node.js）输出调试信息。检查浏览器开发者工具的响应内容和控制台。

### Q: 数据库性能如何？
A: KV 数据库为优化性能，建议：
- 避免频繁操作数组（使用单个值存储）
- 合理设计键名
- 使用前缀分组（如 `user:1`, `user:2`）

### Q: 如何处理并发请求？
A: 热铁盒的数据库支持并发，但需要注意：
- 原子操作（如 increment）是线程安全的
- 复杂的读-改-写操作可能需要额外注意

### Q: 如何连接外部数据库？
A: 仅 PHP 云函数支持连接第三方 SQL 数据库：
```php
$conn = mysqli_connect("host", "username", "password", "database_name");
```
建议选择美国西部的数据库实例以获得最低延迟。

### Q: 文件路径怎么写？
A: 始终使用完整路径：
- ✅ 正确：`databases/data.txt`
- ❌ 错误：`../data.txt` 或 `__DIR__ . "/data.txt"`

## 相关资源

- [热铁盒官方文档](https://docs.retiehe.com/host)
- [Agent Skills 规范](https://agentskills.io/specification)
- [常见资源文件说明](https://docs.retiehe.com/host/common-resource.html)
- [PHP 云函数文档](https://docs.retiehe.com/host/php-cloud-function.html)
- [Node.js 云函数文档](https://docs.retiehe.com/host/js-cloud-function.html)
- [数据库文档](https://docs.retiehe.com/host/database.html)

## 许可证

MIT License

## 贡献

欢迎提交问题和改进建议！
