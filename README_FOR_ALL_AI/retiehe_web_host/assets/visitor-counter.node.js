async function main() {
    const db = new Database("visits");
    const visitor = req.query.name || "";
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
        <head>
            <meta charset="UTF-8">
            <title>访问统计 - Node.js</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5">
                <div class="card">
                    <div class="card-header">
                        <h5>访问统计 (Node.js + KV 数据库)</h5>
                    </div>
                    <div class="card-body">
                        ${visitor ? `
                        <div class="alert alert-success">
                            欢迎返回，${visitor}！
                            <br>您已访问本站 <strong>${count}</strong> 次。
                        </div>` : `
                        <div class="alert alert-info">请输入您的名字以记录访问次数</div>
                        `}

                        <form method="GET" class="mt-3">
                            <div class="input-group">
                                <input type="text" name="name" class="form-control"
                                       placeholder="输入您的名字"
                                       value="${visitor}" required>
                                <button type="submit" class="btn btn-primary">记录访问</button>
                            </div>
                        </form>

                        <div class="mt-4">
                            <h6>所有访客统计：</h6>
    `);

    const keys = await db.listKeys();
    if (keys.length > 0) {
        document.write(`<ul>`);
        for (const key of keys) {
            const visits = await db.get(key);
            document.write(`<li>${key}: ${visits} 次</li>`);
        }
        document.write(`</ul>`);
    } else {
        document.write(`<p class="text-muted">暂无访客记录</p>`);
    }

    document.write(`
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
}
main();
