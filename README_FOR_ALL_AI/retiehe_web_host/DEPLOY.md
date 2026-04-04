# 如何部署和使用

## 方法一：自动部署（推荐）

自动部署功能支持一键将本地前端代码项目部署至热铁盒网页托管。您既可以从本地发起部署，也可以在您将代码推送至 GitHub、GitLab 或 Gitee 时，自动完成网站的部署。

### 环境准备

自动部署脚本基于 Node.js v22 开发。如果您没有安装过 Node.js，或当前版本较旧，可前往 Node.js 官网下载并安装最新的 LTS 版本。

### 获取 API 密钥

在开始配置之前，您需要一个 API 密钥。请按照以下步骤获取：

1. 前往热铁盒网页托管管理页面，点击右上角菜单中的「API 密钥」选项
2. 点击「新密钥」按钮，生成一个 API 密钥
3. 将生成的 API 密钥复制到剪贴板（密钥只会显示一次，请务必妥善保存）

> ⚠️ **注意**：API 密钥相当于您的密码，切勿泄露给他人。

### 初始化配置

首先，在终端中使用 cd 命令进入项目的根目录，然后执行以下命令：

**Windows PowerShell:**
```powershell
$f=New-TemporaryFile; iwr 'https://host.retiehe.com/cli' -OutFile $f; node $f --init; rm $f -Force
```

**Windows 命令提示符:**
```cmd
powershell -c "$f=New-TemporaryFile; iwr https://host.retiehe.com/cli -OutFile $f; node $f --init; rm $f -Force"
```

**macOS/Linux:**
```bash
f=$(mktemp); trap 'rm -f $f' EXIT; curl -fSL https://host.retiehe.com/cli -o $f && node $f --init
```

接下来，根据终端中的提示完成操作即可，此工具会引导您完成自动部署的配置流程。

### 配置向导流程

1. 选择语言（简体中文/繁體中文/English）
2. 确认项目目录
3. 输入 API 密钥
4. 选择要部署的网站或创建新网站
5. 选择域名类型（热铁盒免费域名/自定义域名）
6. 选择是否使用 AI 自动检测构建配置
7. 选择是否在推送到 Git 时自动部署（支持 GitHub/GitLab/Gitee）

### 一键部署

完成配置后，在项目的根目录下执行以下命令即可一键部署网站：

```bash
npm run deploy
```

### 环境变量

API 密钥会存储在环境变量中。自动配置工具会在您的项目中的 `.env` 文件中添加一个名为 `RTH_API_KEY` 的环境变量。

> ⚠️ **重要**：请不要将 `.env` 文件提交到 Git，以免泄露您的 API 密钥。

如果您想在推送到 Git 时自动部署，您需要在您使用的 Git 平台上设置一个名为 `RTH_API_KEY` 的环境变量：

**GitHub:**
1. 打开仓库设置页面，依次点击「Secrets and variables」>「Actions」
2. 点击「New repository secret」
3. 在「Name」字段中输入 `RTH_API_KEY`，在「Secret」字段中粘贴您的 API 密钥
4. 点击「Add secret」

**GitLab:**
1. 打开项目设置页面，依次点击「CI/CD」>「变量」
2. 点击「添加变量」
3. 在「键」字段中输入 `RTH_API_KEY`，在「值」字段中粘贴您的 API 密钥
4. 点击「添加变量」

**Gitee:**
1. 打开项目页面，点击「流水线」标签页并选择「开通 Gitee Go」按钮
2. 若提示创建默认流水线，请选择「不创建」
3. 在「流水线」>「通用变量」页面点击「添加变量」
4. 在「变量名称」字段中输入 `RTH_API_KEY`，类型选择「文本」
5. 在「默认值」字段粘贴您的 API 密钥，然后点击「确认」

### 监听模式

如果您想在本地开发云函数，想在保存时自动部署，我们提供了监听模式。在已完成初始化配置的项目根目录下执行以下命令即可启动：

```bash
npm run deploy -- --watch
```

启动后，程序会监听项目中的云函数文件（`.php` 和 `.node.js` 文件）的更变。当您在代码编辑器中保存文件时，对应的文件会被自动部署到热铁盒网页托管，让您可以即时查看效果，类似于 Vite 开发模式的体验。

## 方法二：直接上传

1. 在热铁盒控制面板创建新网站
2. 进入文件管理器
3. 点击「上传」或「新建文件夹」
4. 上传 `retiehe-web-hosting` 文件夹内的所有文件和文件夹
5. 访问 `https://your-domain.retiehe.com/assets/index.html` 查看示例

## 方法二：逐个上传

如果你需要逐个文件上传，请按以下顺序操作：

### 1. 创建目录结构
在网站根目录创建：
- `assets/` 文件夹
- `lib/` 文件夹
- `references/` 文件夹

### 2. 上传核心文件
上传到根目录：
- `SKILL.md`
- `README.md`

### 3. 上传示例文件（到 `assets/`）
- `index.html`
- `visitor-counter.php`
- `visitor-counter.node.js`
- `api.php`
- `api.node.js`
- `form.php`
- `form.node.js`
- `login.php`
- `config-demo.php`
- `config-demo.node.js`
- `modular.php`
- `modular.node.js`
- `config.json`

### 4. 上传工具库（到 `lib/`）
- `utils.php`
- `utils.node.js`

### 5. 上传参考文档（到 `references/`）
- `REFERENCE.md`

## 快速开始

上传完成后，访问示例首页：

```
https://your-site.retiehe.com/assets/index.html
```

从这个页面可以访问所有示例：
- 访问统计（PHP/Node.js）
- RESTful API（PHP/Node.js）
- 留言板（PHP/Node.js）
- 用户登录（PHP Session）
- 配置管理（PHP/Node.js）
- 模块化代码（PHP/Node.js）

## 开发你的应用

### 参考文档

1. **SKILL.md** - 完整开发指南，包含所有功能说明和代码示例
2. **references/REFERENCE.md** - 详细 API 参考文档
3. **README.md** - 项目说明和使用指南

### 复制示例代码

1. 查看 `assets/` 文件夹中的示例
2. 找到与你的需求相近的示例
3. 复制代码并修改
4. 上传到你的网站

### 使用工具函数

在你的云函数中引入工具库：

**PHP:**
```php
<?php
require_once "lib/utils.php";

$db = new DBHelper("my_db");
$value = $db->get("key");
```

**Node.js:**
```javascript
const utils = require("lib/utils.node.js");

const db = new utils.DBHelper("my_db");
const value = await db.get("key");
```

## 验证安装

上传后，可以运行以下命令验证：

### PHP 验证
访问：`https://your-site.retiehe.com/modular.php`

应该看到 JSON 响应：
```json
{
  "status": "success",
  "message": "模块化代码示例",
  "visits": 1,
  ...
}
```

### Node.js 验证
访问：`https://your-site.retiehe.com/modular.node.js`

应该看到相同的 JSON 响应。

## 数据库查看

所有示例的数据库都可以在热铁盒控制面板查看：

1. 在网站列表中，右键点击你的网站
2. 选择「数据库」
3. 可以查看和编辑所有键值对

**示例数据库：**
- `visits` - 访问统计
- `api_stats` - API 统计
- `messages` - 留言板数据
- `settings` - 配置数据

## 常见问题

### Q: 上传后访问提示 404？
A: 检查文件路径是否正确。确保：
- 文件在正确的文件夹中
- 文件名拼写正确
- PHP 文件以 `.php` 结尾
- Node.js 文件以 `.node.js` 结尾

### Q: 代码报错 "Undefined type Database"？
A: 这是正常的 LSP 警告。`Database` 类是热铁盒平台提供的，在热铁盒平台上运行不会有问题。

### Q: 如何调试代码？
A: 使用简单的方法输出调试信息：
- PHP: `echo "Debug: " . $value;`
- Node.js: `res.write("Debug: " + value);` 或 `document.write("Debug: " + value);`

### Q: 数据库数据保存在哪里？
A: 数据库存储在热铁盒服务器上，在控制面板的「数据库」功能中可以查看和编辑。不需要在你的网站上创建数据库文件。

### Q: 如何备份代码？
A: 热铁盒控制面板支持导出网站。在网站列表中右键选择「导出」即可下载完整备份。

## 下一步

1. 阅读 `SKILL.md` 了解完整功能
2. 查看 `references/REFERENCE.md` 获取 API 详情
3. 运行示例代码熟悉平台特性
4. 修改示例创建自己的应用
5. 使用工具函数简化开发

## 技术支持

- [热铁盒官方文档](https://docs.retiehe.com/host)
- [热铁盒帮助中心](https://support.retiehe.com/)
- [Agent Skills 规范](https://agentskills.io/specification)

祝你开发顺利！
