/**
 * OBS 配置服务器
 * 提供配置文件读写和静态文件服务
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const DEFAULT_PORT = 3000;
const MAX_PORT_TRIES = 10;
const BASE_PORT = Number(process.env.PORT) || DEFAULT_PORT;
let currentPort = BASE_PORT;
const CONFIG_DIR = path.join(__dirname, "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DEFAULT_CONFIG_FILE = path.join(CONFIG_DIR, "config.default.json");
const LEGACY_CONFIG_FILE = path.join(path.dirname(__dirname), "config.json");
const LEGACY_DEFAULT_CONFIG_FILE = path.join(
  path.dirname(__dirname),
  "config.default.json",
);

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (fs.existsSync(LEGACY_CONFIG_FILE) && !fs.existsSync(CONFIG_FILE)) {
    try {
      fs.renameSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已迁移 config.json 到 config 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已复制 config.json 到 config 目录");
    }
  }

  if (
    fs.existsSync(LEGACY_DEFAULT_CONFIG_FILE) &&
    !fs.existsSync(DEFAULT_CONFIG_FILE)
  ) {
    try {
      fs.renameSync(LEGACY_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已迁移 config.default.json 到 config 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已复制 config.default.json 到 config 目录");
    }
  }
}

function readDefaultConfig() {
  ensureConfigDir();

  if (fs.existsSync(DEFAULT_CONFIG_FILE)) {
    const raw = fs.readFileSync(DEFAULT_CONFIG_FILE, "utf8");
    return JSON.parse(raw);
  }

  return {
    isFirstLaunch: true,
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont",
    fontSize: 18,
    themeColor: "#0078d4",
    sidebarBgColor: "rgb(20, 20, 30)",
    showTitleBar: true,
    enableTitleBarFont: true,
    logoIcon: "",
    navIconsBlack: "",
    bottomIcon: "",
    windowTitle: "OBS Windows 10 Background",
    windowTitleFont:
      "Segoe UI, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
    windowTitleFontSize: 18,
    titleBarButtons: "&#xE921;,&#xE923;,&#xE8BB;",
  };
}

// MIME 类型映射
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  ensureConfigDir();

  const parsedUrl = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`,
  );
  const pathname = parsedUrl.pathname;

  // 保存配置
  if (pathname === "/api/config" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const config = JSON.parse(body);
        // 格式化 JSON 并写入文件
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4), "utf8");
        console.log("✅ 配置已保存到 config.json");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "配置保存成功" }));
      } catch (error) {
        console.error("❌ 配置保存失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "配置保存失败: " + error.message,
          }),
        );
      }
    });
    return;
  }

  // 读取配置
  if (pathname === "/api/config" && req.method === "GET") {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const config = fs.readFileSync(CONFIG_FILE, "utf8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(config);
      } else {
        // 如果文件不存在，使用 config.default.json 生成
        const defaultConfig = readDefaultConfig();
        // 创建默认配置文件
        fs.writeFileSync(
          CONFIG_FILE,
          JSON.stringify(defaultConfig, null, 4),
          "utf8",
        );
        console.log("📝 已创建默认配置文件");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(defaultConfig));
      }
    } catch (error) {
      console.error("❌ 配置读取失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "配置读取失败: " + error.message,
        }),
      );
    }
    return;
  }

  // 恢复默认配置
  if (pathname === "/api/config/reset" && req.method === "POST") {
    try {
      const defaultConfig = readDefaultConfig();
      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(defaultConfig, null, 4),
        "utf8",
      );
      console.log("🔄 配置已恢复为默认值");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "配置已恢复为默认值",
          config: defaultConfig,
        }),
      );
    } catch (error) {
      console.error("❌ 恢复配置失败:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "恢复配置失败: " + error.message,
        }),
      );
    }
    return;
  }

  // 静态文件服务
  // 如果访问根路径，返回 public/index.html
  let filePath = req.url === "/" ? "/index.html" : req.url;

  // 移除查询参数
  filePath = filePath.split("?")[0];

  // 构建完整文件路径
  const PUBLIC_DIR = path.join(path.dirname(__dirname), "public");
  const fullPath = path.join(PUBLIC_DIR, filePath);

  // 安全检查：确保请求的文件在 public 目录内
  const PUBLIC_DIR_CHECK = path.join(path.dirname(__dirname), "public");
  if (!fullPath.startsWith(PUBLIC_DIR_CHECK)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
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
    } catch (error) {
      console.error(`❌ 读取文件失败: ${filePath}`, error);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
    return;
  }

  // 其他请求返回 404
  res.writeHead(404);
  res.end("Not Found");
});

const startCommand =
  process.platform === "win32"
    ? "start"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";

function startServer(port, attempt = 0) {
  server.listen(port, () => {
    const url = `http://localhost:${port}`;

    console.log(`\n${"=".repeat(50)}`);
    console.log(`🚀 OBS 配置服务器已启动`);
    console.log(`${"=".repeat(50)}`);
    console.log(`📡 服务地址: ${url}`);
    console.log(`📁 配置文件: ${CONFIG_FILE}`);
    console.log(`\n💡 使用方法：`);
    console.log(`   1. 浏览器访问: ${url}`);
    console.log(`   2. OBS 浏览器源: ${url}`);
    console.log(`   3. 按 Ctrl+K 打开设置面板`);
    console.log(`   4. 修改配置后点击保存\n`);
    console.log(`⚙️  配置会自动保存到 config.json 文件`);
    console.log(`🛑 停止服务器: Ctrl+C\n`);
    console.log(`${"=".repeat(50)}\n`);

    exec(`${startCommand} ${url}`, (error) => {
      if (error) {
        console.log(`⚠️  无法自动打开浏览器，请手动访问: ${url}`);
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

startServer(currentPort);
