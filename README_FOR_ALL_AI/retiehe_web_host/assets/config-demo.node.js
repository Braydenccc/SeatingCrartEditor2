// 配置文件示例 - Node.js

async function main() {
    // 从数据库读取配置
    const db = new Database("settings");

    const theme = await db.get("theme") || "light";
    const language = await db.get("language") || "zh-CN";
    const timezone = await db.get("timezone") || "Asia/Shanghai";

    // 读取 JSON 配置文件
    const config = require("config.json");

    // 输出 HTML
    document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>文件读写配置 - Node.js</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="container mt-5">
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
                                <li>主题：${theme}</li>
                                <li>语言：${language}</li>
                                <li>时区：${timezone}</li>
                            </ul>

                            ${req.method === "POST" ? `<div class="alert alert-success">配置已保存！请刷新页面查看效果。</div>` : ""}

                            <form method="POST" class="mt-3">
                                <div class="mb-2">
                                    <select name="theme" class="form-select">
                                        <option value="light" ${theme === "light" ? "selected" : ""}>浅色主题</option>
                                        <option value="dark" ${theme === "dark" ? "selected" : ""}>深色主题</option>
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
                                <li>名称：${config.appName}</li>
                                <li>版本：${config.version}</li>
                                <li>作者：${config.author}</li>
                            </ul>

                            <h6>支持特性</h6>
                            <ul>
                                ${Object.values(config.features).map(f => `<li>${f}</li>`).join("")}
                            </ul>

                            <h6>限制</h6>
                            <ul>
                                ${Object.entries(config.limits).map(([k, v]) => `<li>${k}: ${v}</li>`).join("")}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);

    // 处理 POST 请求
    if (req.method === "POST") {
        db.set("theme", req.body.theme);
    }
}

main();
