/**
 * OBS 配置服务器
 * 提供配置文件读写和静态文件服务
 */

const http = require("http");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const { spawn } = require("child_process");
const { ensureConfigDir, getConfigDir } = require("./config/manager");
const { handleVersionRequest } = require("./routes/version");
const {
  handleGetConfig,
  handleSaveConfig,
  handleResetConfig,
  handleGetProfiles,
  handleSwitchProfile,
  handleCreateProfile,
  handleRenameProfile,
  handleDuplicateProfile,
  handleDeleteProfile,
} = require("./routes/config");
const { handleStaticFile } = require("./middleware/static");

// 项目根目录
const ROOT_DIR = path.resolve(__dirname, "..");

// 服务器配置
const DEFAULT_PORT = 3000;
const MAX_PORT_TRIES = 10;
const BASE_PORT = Number(process.env.PORT) || DEFAULT_PORT;
let currentPort = BASE_PORT;

/**
 * 设置CORS头
 * @param {Object} res - 响应对象
 */
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * 重启服务器
 */
function scheduleServerRestart(server) {
  setTimeout(() => {
    server.close(() => {
      const nodePath = process.execPath;
      const scriptPath = __filename;
      const child = spawn(nodePath, [scriptPath], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      process.exit(0);
    });
  }, 800);
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置 CORS 头
  setCorsHeaders(res);

  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 确保配置目录存在
  ensureConfigDir();

  // 解析URL
  const parsedUrl = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`,
  );
  const pathname = parsedUrl.pathname;

  // API路由处理
  // 版本信息
  if (pathname === "/api/version" && req.method === "GET") {
    handleVersionRequest(req, res);
    return;
  }

  // 配置管理
  if (pathname === "/api/config" && req.method === "GET") {
    handleGetConfig(req, res);
    return;
  }

  if (pathname === "/api/config" && req.method === "POST") {
    handleSaveConfig(req, res);
    return;
  }

  if (pathname === "/api/config/reset" && req.method === "POST") {
    handleResetConfig(req, res);
    return;
  }

  // 配置管理 - 多配置支持
  if (pathname === "/api/profiles" && req.method === "GET") {
    handleGetProfiles(req, res);
    return;
  }

  if (pathname === "/api/profiles/switch" && req.method === "POST") {
    handleSwitchProfile(req, res);
    return;
  }

  if (pathname === "/api/profiles/create" && req.method === "POST") {
    handleCreateProfile(req, res);
    return;
  }

  if (pathname === "/api/profiles/rename" && req.method === "POST") {
    handleRenameProfile(req, res);
    return;
  }

  if (pathname === "/api/profiles/duplicate" && req.method === "POST") {
    handleDuplicateProfile(req, res);
    return;
  }

  if (pathname === "/api/profiles/delete" && req.method === "POST") {
    handleDeleteProfile(req, res);
    return;
  }

  // /config 路由 → 配置页面
  if (pathname === "/config" || pathname === "/config/") {
    const configHtml = path.join(ROOT_DIR, "public", "config.html");
    if (fs.existsSync(configHtml)) {
      try {
        const content = fs.readFileSync(configHtml, "utf8");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
        console.log("📄 访问配置页面");
      } catch (error) {
        console.error("❌ 读取配置页面失败:", error);
        res.writeHead(500);
        res.end("Internal Server Error");
      }
      return;
    }
  }


  // 静态文件服务
  const handled = handleStaticFile(req, res);
  if (handled) {
    return;
  }

  // 404 Not Found
  res.writeHead(404);
  res.end("Not Found");
});

/**
 * 启动服务器
 * @param {number} port - 端口号
 * @param {number} attempt - 尝试次数
 */
function startServer(port, attempt = 0) {
  server.listen(port, () => {
    const url = `http://localhost:${port}`;

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🚀 OBS 配置服务器已启动`);
    console.log(`${"=".repeat(50)}`);
    console.log(`📡 服务地址: ${url}`);
    console.log(`📁 配置目录: ${getConfigDir()}`);
    console.log(`\n💡 使用方法：`);
    console.log(`   1. 配置页面: ${url}/config`);
    console.log(`   2. OBS 浏览器源: ${url}`);
    console.log(`   3. 修改配置后点击保存\n`);
    console.log(`⚙️  配置会自动保存到 config.json 文件`);
    console.log(`🛑 停止服务器: Ctrl+C\n`);
    console.log(`${"=".repeat(50)}\n`);

    const startCommand =
      process.platform === "win32"
        ? "start"
        : process.platform === "darwin"
          ? "open"
          : "xdg-open";

    exec(`${startCommand} ${url}/config`, (error) => {
      if (error) {
        console.log(`⚠️  无法自动打开浏览器，请手动访问: ${url}/config`);
      } else {
        console.log(`✅ 浏览器已打开\n`);
      }
    });
  });

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      if (attempt + 1 >= MAX_PORT_TRIES) {
        console.error(
          `❌ 端口 ${port} 被占用，且已尝试 ${MAX_PORT_TRIES} 个端口仍不可用。请关闭占用端口的进程后重试。`,
        );
        process.exit(1);
      }

      const nextPort = port + 1;
      console.warn(`⚠️ 端口 ${port} 被占用，尝试切换到 ${nextPort}...`);
      currentPort = nextPort;
      startServer(nextPort, attempt + 1);
      return;
    }

    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  });
}

// 启动服务器
startServer(currentPort);
