// Node.js 模块化代码示例

const utils = require("lib/utils.node.js");

// 使用工具函数
if (utils.handlePreflight()) {
    return;
}
utils.setCORS();

// 使用 DBHelper
async function handleRequest() {
    const db = new utils.DBHelper("api_stats");
    const visitCount = await db.increment("total_visits");

    res.json({
        status: "success",
        message: "模块化代码示例",
        visits: visitCount,
        timestamp: utils.now(),
        current_ip: req.ip,
        current_url: req.url,
        is_https: req.url.startsWith("https"),
        random_id: utils.randomString()
    });
}

handleRequest();
