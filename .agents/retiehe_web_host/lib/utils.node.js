// Node.js 工具函数库

/**
 * 安全的 JSON 响应
 */
function jsonSuccess(message, data = {}) {
    return {
        status: "success",
        message: message,
        data: data
    };
}

/**
 * 错误响应
 */
function jsonError(message) {
    return {
        status: "error",
        error: message
    };
}

/**
 * 生成随机字符串
 */
function randomString(length = 16) {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 数据库辅助类
 */
class DBHelper {
    constructor(dbName) {
        this.db = new Database(dbName);
    }

    async get(key) {
        return await this.db.get(key);
    }

    set(key, value) {
        return this.db.set(key, value);
    }

    delete(key) {
        return this.db.delete(key);
    }

    async exists(key) {
        return (await this.get(key)) !== null;
    }

    async listAll() {
        const keys = await this.db.listKeys();
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }

    async count() {
        const keys = await this.db.listKeys();
        return keys.length;
    }

    push(key, value) {
        return this.db.push(key, value);
    }

    async getArray(key) {
        return await this.db.getArray(key);
    }

    async increment(key, step = 1) {
        const current = (await this.get(key)) || "0";
        const value = parseInt(current) + step;
        this.set(key, value.toString());
        return value;
    }

    async decrement(key, step = 1) {
        return await this.increment(key, -step);
    }
}

/**
 * 格式化日期
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * 验证邮箱
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 获取当前时间戳（毫秒）
 */
function now() {
    return Date.now();
}

/**
 * 生成唯一 ID
 */
function generateId() {
    return now() + "_" + randomString(8);
}

/**
 * 设置 CORS 头
 */
function setCORS(origin = "*") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/**
 * 处理 OPTIONS 预检请求
 */
function handlePreflight() {
    if (req.method === "OPTIONS") {
        setCORS();
        res.status(204).end();
        return true;
    }
    return false;
}

/**
 * 清理 HTML（简单版）
 */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 导出所有工具
 */
module.exports = {
    jsonSuccess,
    jsonError,
    randomString,
    DBHelper,
    formatDate,
    isValidEmail,
    now,
    generateId,
    setCORS,
    handlePreflight,
    escapeHtml
};
