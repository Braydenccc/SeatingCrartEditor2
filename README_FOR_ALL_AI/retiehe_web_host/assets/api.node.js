res.setHeader("Content-Type", "application/json; charset=utf-8");
res.setHeader("Access-Control-Allow-Origin", "*");

const method = req.method;

if (method === "GET") {
    // GET 请求：返回统计信息
    const db = new Database("api_stats");
    let visits = await db.get("total_visits") || "0";
    visits = parseInt(visits);
    visits++;
    db.set("total_visits", visits.toString());

    res.json({
        status: "success",
        method: "GET",
        data: {
            message: "API 正常运行",
            total_visits: visits,
            timestamp: Date.now(),
            datetime: new Date().toISOString()
        }
    });
    return;
}

if (method === "POST") {
    // POST 请求：处理提交的数据
    const contentType = req.headers["content-type"];

    if (contentType && contentType.includes("application/json")) {
        // JSON 数据
        res.json({
            status: "success",
            method: "POST",
            data: {
                received: req.body,
                message: "数据已接收",
                timestamp: Date.now()
            }
        });
    } else {
        // 表单数据
        const data = req.body;

        // 保存到数据库
        const db = new Database("submissions");
        const id = "sub_" + Date.now();
        db.set(id, JSON.stringify(data));

        res.json({
            status: "success",
            method: "POST",
            data: {
                received: data,
                id: id,
                message: "数据已保存到数据库",
                timestamp: Date.now()
            }
        });
    }
    return;
}

// 不支持的方法
res.status(405).json({
    status: "error",
    error: "Method Not Allowed",
    message: "仅支持 GET 和 POST 请求"
});
