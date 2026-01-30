/**
 * OBS 配置服务器
 * 提供配置文件读写和静态文件服务
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");
const AdmZip = require("adm-zip");
const { exec, spawn } = require("child_process");

const DEFAULT_PORT = 3000;
const MAX_PORT_TRIES = 10;
const BASE_PORT = Number(process.env.PORT) || DEFAULT_PORT;
let currentPort = BASE_PORT;
const ROOT_DIR = path.dirname(__dirname);
const CONFIG_DIR = path.join(ROOT_DIR, "configs");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DEFAULT_CONFIG_FILE = path.join(CONFIG_DIR, "config.default.json");
const LEGACY_ROOT_CONFIG_FILE = path.join(ROOT_DIR, "config.json");
const LEGACY_ROOT_DEFAULT_CONFIG_FILE = path.join(
  ROOT_DIR,
  "config.default.json",
);
const LEGACY_CONFIG_DIR = path.join(__dirname, "config");
const LEGACY_CONFIG_FILE = path.join(LEGACY_CONFIG_DIR, "config.json");
const LEGACY_DEFAULT_CONFIG_FILE = path.join(
  LEGACY_CONFIG_DIR,
  "config.default.json",
);
let updateInProgress = false;

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  if (fs.existsSync(LEGACY_ROOT_CONFIG_FILE) && !fs.existsSync(CONFIG_FILE)) {
    try {
      fs.renameSync(LEGACY_ROOT_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已迁移根目录 config.json 到 config 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_ROOT_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已复制根目录 config.json 到 config 目录");
    }
  }

  if (
    fs.existsSync(LEGACY_ROOT_DEFAULT_CONFIG_FILE) &&
    !fs.existsSync(DEFAULT_CONFIG_FILE)
  ) {
    try {
      fs.renameSync(LEGACY_ROOT_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已迁移根目录 config.default.json 到 config 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_ROOT_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已复制根目录 config.default.json 到 config 目录");
    }
  }

  if (fs.existsSync(LEGACY_CONFIG_FILE) && !fs.existsSync(CONFIG_FILE)) {
    try {
      fs.renameSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已迁移旧位置 config.json 到 config 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_CONFIG_FILE, CONFIG_FILE);
      console.log("🔁 已复制旧位置 config.json 到 config 目录");
    }
  }

  if (
    fs.existsSync(LEGACY_DEFAULT_CONFIG_FILE) &&
    !fs.existsSync(DEFAULT_CONFIG_FILE)
  ) {
    try {
      fs.renameSync(LEGACY_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已迁移旧位置 config.default.json 到 config 目录");
    } catch (error) {
      fs.copyFileSync(LEGACY_DEFAULT_CONFIG_FILE, DEFAULT_CONFIG_FILE);
      console.log("🔁 已复制旧位置 config.default.json 到 config 目录");
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

function readAppVersion() {
  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const raw = fs.readFileSync(packageJsonPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.version === "string") {
        return parsed.version;
      }
    } catch (error) {
      console.warn("⚠️ 读取版本信息失败:", error.message);
    }
  }
  return "0.0.0";
}

function readRepo() {
  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const raw = fs.readFileSync(packageJsonPath, "utf8");
      const parsed = JSON.parse(raw);
      const repoValue =
        typeof parsed?.repository === "string"
          ? parsed.repository
          : parsed?.repository?.url;

      if (typeof repoValue === "string" && repoValue.trim()) {
        const trimmed = repoValue.trim();
        if (trimmed.includes("github.com")) {
          try {
            const url = new URL(trimmed);
            let repoPath = url.pathname.replace(/^\/+/, "");
            repoPath = repoPath.replace(/\.git$/i, "").replace(/\/+$/, "");
            if (repoPath) {
              return repoPath;
            }
          } catch (error) {
            console.warn("⚠️ 解析仓库地址失败:", error.message);
          }
        }

        const simpleMatch = trimmed.match(/^[^/]+\/[^/]+$/);
        if (simpleMatch) {
          return trimmed;
        }
      }
    } catch (error) {
      console.warn("⚠️ 读取仓库信息失败:", error.message);
    }
  }
  return "KurotaniTakeo/OBS-Win10-Background";
}

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

function normalizeVersion(version) {
  if (!version) return "0.0.0";
  return version
    .toString()
    .trim()
    .replace(/^v/i, "")
    .split("+")[0]
    .split("-")[0];
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "obs-config-server",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error("解析响应失败"));
            }
            return;
          }
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        });
      },
    );
    req.on("error", reject);
  });
}

function downloadFile(url, destPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "obs-config-server",
          Accept: "application/octet-stream",
        },
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          if (redirects >= 5) {
            reject(new Error("下载重定向次数过多"));
            return;
          }
          downloadFile(res.headers.location, destPath, redirects + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`下载失败: HTTP ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close(resolve);
        });
        fileStream.on("error", reject);
      },
    );
    req.on("error", reject);
  });
}

function selectUpdateAsset(release) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const zipAssets = assets.filter(
    (asset) =>
      typeof asset?.name === "string" &&
      asset.name.toLowerCase().endsWith(".zip"),
  );

  const preferred =
    zipAssets.find((asset) => asset.name.toLowerCase().includes("public")) ||
    zipAssets.find((asset) => asset.name.toLowerCase().includes("dist")) ||
    zipAssets.find((asset) => asset.name.toLowerCase().includes("web")) ||
    zipAssets[0];

  if (preferred?.browser_download_url) {
    return {
      type: "asset",
      url: preferred.browser_download_url,
      name: preferred.name,
    };
  }

  if (release?.zipball_url) {
    return { type: "zipball", url: release.zipball_url, name: "source.zip" };
  }

  return null;
}

function extractPublicFromZip(zipPath, targetPublicDir) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  if (!entries.length) {
    throw new Error("更新包为空");
  }

  const normalizedEntries = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName.replace(/\\/g, "/"));

  const hasPublicFolder = normalizedEntries.some(
    (name) => name.startsWith("public/") || name.includes("/public/"),
  );

  entries.forEach((entry) => {
    if (entry.isDirectory) return;

    const entryName = entry.entryName.replace(/\\/g, "/");
    let relativePath = "";

    if (hasPublicFolder) {
      if (entryName.startsWith("public/")) {
        relativePath = entryName.slice("public/".length);
      } else {
        const idx = entryName.indexOf("/public/");
        if (idx === -1) return;
        relativePath = entryName.slice(idx + "/public/".length);
      }
    } else {
      relativePath = entryName;
    }

    if (!relativePath || relativePath.includes("..")) return;

    const targetPath = path.join(targetPublicDir, relativePath);
    const normalizedTarget = path.normalize(targetPath);
    if (!normalizedTarget.startsWith(path.normalize(targetPublicDir))) return;

    fs.mkdirSync(path.dirname(normalizedTarget), { recursive: true });
    fs.writeFileSync(normalizedTarget, entry.getData());
  });
}

function replacePublicDir(zipPath) {
  const publicDir = path.join(ROOT_DIR, "public");
  const backupDir = path.join(ROOT_DIR, `public.bak-${Date.now()}`);

  if (fs.existsSync(publicDir)) {
    fs.renameSync(publicDir, backupDir);
  }

  try {
    fs.mkdirSync(publicDir, { recursive: true });
    extractPublicFromZip(zipPath, publicDir);
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
  } catch (error) {
    if (fs.existsSync(publicDir)) {
      fs.rmSync(publicDir, { recursive: true, force: true });
    }
    if (fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, publicDir);
    }
    throw error;
  }
}

function updatePackageVersion(latestVersion) {
  if (!latestVersion) return;
  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  if (!fs.existsSync(packageJsonPath)) return;
  try {
    const raw = fs.readFileSync(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    const normalized = normalizeVersion(latestVersion);
    if (parsed.version !== normalized) {
      parsed.version = normalized;
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(parsed, null, 2),
        "utf8",
      );
    }
  } catch (error) {
    console.warn("⚠️ 更新版本号失败:", error.message);
  }
}

function scheduleServerRestart() {
  setTimeout(() => {
    server.close(() => {
      const nodePath = process.execPath;
      const scriptPath = __filename;
      const child = spawn(nodePath, [scriptPath], {
        cwd: ROOT_DIR,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      process.exit(0);
    });
  }, 800);
}

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

  // 获取版本信息
  if (pathname === "/api/version" && req.method === "GET") {
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
    return;
  }

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

  // 应用更新（下载并替换 public 目录）
  if (pathname === "/api/update/apply" && req.method === "POST") {
    if (updateInProgress) {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "更新正在进行中",
        }),
      );
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", async () => {
      try {
        updateInProgress = true;
        const payload = body ? JSON.parse(body) : {};
        const repo = payload.repo || readRepo();

        const release = await fetchJson(
          `https://api.github.com/repos/${repo}/releases/latest`,
        );
        const latestTag = release?.tag_name || release?.name || "";
        const latestVersion = normalizeVersion(latestTag);

        const asset = selectUpdateAsset(release);
        if (!asset?.url) {
          throw new Error("未找到可用的更新包资源");
        }

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "obs-update-"));
        const zipPath = path.join(tempDir, asset.name || "update.zip");
        await downloadFile(asset.url, zipPath);

        replacePublicDir(zipPath);
        updatePackageVersion(latestVersion);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "更新已应用，服务器即将重启",
            latestVersion: latestVersion || "",
          }),
        );

        scheduleServerRestart();
      } catch (error) {
        console.error("❌ 更新应用失败:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "更新失败: " + error.message,
          }),
        );
      } finally {
        updateInProgress = false;
      }
    });
    return;
  }

  // 静态文件服务
  // 如果访问根路径，返回 public/index.html
  let filePath = req.url === "/" ? "/index.html" : req.url;

  // 移除查询参数
  filePath = filePath.split("?")[0];

  // 确定文件所在的目录
  const PUBLIC_DIR = path.join(ROOT_DIR, "public");
  const DOCS_DIR = path.join(ROOT_DIR, "docs");
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
    console.log(`📁 配置目录: ${CONFIG_DIR}`);
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
