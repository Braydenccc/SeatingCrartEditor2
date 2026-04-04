res.setHeader("Content-Type", "text/html; charset=utf-8");
let error = "";
let success = "";

// 处理表单提交
if (req.method === "POST") {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim();
    const message = (req.body.message || "").trim();

    // 验证输入
    if (!name) {
        error = "请输入姓名";
    } else if (!email || !email.includes("@")) {
        error = "请输入有效的邮箱地址";
    } else if (!message) {
        error = "请输入留言内容";
    } else {
        // 保存到数据库
        const db = new Database("messages");
        const data = {
            name: name,
            email: email,
            message: message,
            timestamp: Date.now(),
            datetime: new Date().toISOString().slice(0, 19).replace("T", " ")
        };
        const id = "msg_" + Date.now() + "_" + Math.floor(Math.random() * 9000 + 1000);
        db.set(id, JSON.stringify(data));

        success = "感谢您的留言，我们会尽快回复！";
    }
}

// 获取所有留言
const allMessages = [];
const db = new Database("messages");
const keys = await db.listKeys();
for (const key of keys) {
    const msg = await db.get(key);
    if (msg) {
        try {
            const decoded = JSON.parse(msg);
            decoded.id = key;
            allMessages.push(decoded);
        } catch (e) {
            // 忽略解析错误
        }
    }
}

// 按时间倒序排序
allMessages.sort((a, b) => b.timestamp - a.timestamp);

// 输出 HTML
document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>留言板 - Node.js</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="container mt-5">
            <h1 class="mb-4">留言板</h1>

            ${error ? `<div class="alert alert-danger">${error}</div>` : ""}
            ${success ? `<div class="alert alert-success">${success}</div>` : ""}

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
                            <span>留言列表 (${allMessages.length})</span>
                            <small class="text-muted">共 ${allMessages.length} 条留言</small>
                        </div>
                        <div class="card-body">
                            ${allMessages.length === 0 ?
                                `<p class="text-muted text-center">暂无留言</p>` :
                                allMessages.map(msg => `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <h6 class="card-title">
                                            ${msg.name}
                                            <small class="text-muted">${msg.email}</small>
                                        </h6>
                                        <p class="card-text">${msg.message.replace(/\n/g, "<br>")}</p>
                                        <small class="text-muted">${msg.datetime}</small>
                                    </div>
                                </div>
                                `).join("")
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
`);
