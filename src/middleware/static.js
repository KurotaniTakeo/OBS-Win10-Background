/**
 * 静态文件服务模块
 * 提供静态文件的HTTP服务功能
 */

const fs = require("fs");
const path = require("path");

const { ROOT_DIR, PUBLIC_DIR } = require("../utils/app-path");
const DOCS_DIR = path.join(ROOT_DIR, "docs");

// MIME 类型映射
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/**
 * 处理静态文件请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {boolean} 是否成功处理请求
 */
function handleStaticFile(req, res) {
  // 如果访问根路径，返回 public/index.html
  let filePath = req.url === "/" ? "/index.html" : req.url;

  // 移除查询参数
  filePath = filePath.split("?")[0];

  // 确定文件所在的目录
  let fullPath;
  let allowedDir;

  // 处理docs文件请求
  if (filePath.startsWith("/docs/")) {
    fullPath = path.join(DOCS_DIR, filePath.substring(6)); // 移除 /docs/ 前缀
    allowedDir = DOCS_DIR;
  } else {
    // 处理public文件请求
    fullPath = path.join(PUBLIC_DIR, filePath);
    allowedDir = PUBLIC_DIR;
  }

  // 安全检查：确保请求的文件在允许的目录内
  if (!fullPath.startsWith(allowedDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return true;
  }

  // 检查文件是否存在
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    try {
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      const content = fs.readFileSync(fullPath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);

      console.log(`📄 访问文件: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ 读取文件失败: ${filePath}`, error);
      res.writeHead(500);
      res.end("Internal Server Error");
      return true;
    }
  }

  // 文件不存在
  return false;
}

module.exports = {
  handleStaticFile,
};
