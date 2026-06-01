/**
 * 版本API路由
 * 处理版本信息相关的请求
 */

const { readAppVersion, readRepo } = require("../config/app-info");

/**
 * 处理 GET /api/version 请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function handleVersionRequest(req, res) {
  try {
    const version = readAppVersion();
    const repo = readRepo();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        version,
        repo,
      }),
    );
  } catch (error) {
    console.error("❌ 读取版本信息失败:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "读取版本信息失败: " + error.message,
      }),
    );
  }
}

module.exports = {
  handleVersionRequest,
};
