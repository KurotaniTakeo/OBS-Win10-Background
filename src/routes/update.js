/**
 * 更新API路由
 * 处理版本检查和应用更新的请求
 */

const os = require("os");
const path = require("path");
const fs = require("fs");
const { readAppVersion, readRepo, updatePackageVersion } = require("../config/app-info");
const { compareVersions } = require("../utils/version");
const { fetchJson, downloadFile } = require("../utils/http");
const { extractProjectFromZip, backup, restore } = require("../utils/file");
const { ROOT_DIR } = require("../utils/app-path");
const { scheduleServerRestart } = require("../utils/restart");

const GITHUB_API = "https://api.github.com";

/**
 * 读取请求体 JSON
 * @param {Object} req - 请求对象
 * @returns {Promise<Object>}
 */
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error("请求体格式错误"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * 处理 GET /api/check-update 请求
 * 检查 GitHub Releases 是否有新版本
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function handleCheckUpdate(req, res) {
  try {
    const currentVersion = readAppVersion();
    const repo = readRepo();

    if (!repo) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "无法获取仓库信息" }));
      return;
    }

    let release;
    try {
      release = await fetchJson(`${GITHUB_API}/repos/${repo}/releases/latest`);
    } catch (error) {
      const noRelease =
        error.message.includes("404") || error.message.includes("Not Found");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          noRelease,
          message: noRelease
            ? "仓库暂无 Release"
            : "无法连接更新服务: " + error.message,
        }),
      );
      return;
    }

    const latestVersion = (release.tag_name || "").replace(/^v/i, "");
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url || "",
        downloadUrl: release.zipball_url || "",
        releaseNotes: release.body || "",
      }),
    );
  } catch (error) {
    console.error("❌ 检查更新失败:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "检查更新失败: " + error.message,
      }),
    );
  }
}

/**
 * 处理 POST /api/apply-update 请求
 * 下载最新 Release ZIP 并覆盖更新项目文件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function handleApplyUpdate(req, res) {
  let zipPath = null;
  let backupPath = null;

  try {
    const body = await readRequestBody(req);
    const repo = body.repo || readRepo();

    if (!repo) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "缺少仓库信息" }));
      return;
    }

    let release;
    try {
      release = await fetchJson(`${GITHUB_API}/repos/${repo}/releases/latest`);
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "获取 Release 信息失败: " + error.message,
        }),
      );
      return;
    }

    const zipballUrl = release.zipball_url;
    if (!zipballUrl) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ success: false, message: "Release 无可用下载链接" }),
      );
      return;
    }

    const latestVersion = (release.tag_name || "").replace(/^v/i, "");

    zipPath = path.join(os.tmpdir(), `obs-update-${Date.now()}.zip`);
    backupPath = path.join(os.tmpdir(), `obs-backup-${Date.now()}`);

    console.log(`🔄 开始更新: 下载 ${zipballUrl}`);
    await downloadFile(zipballUrl, zipPath);
    console.log("✅ 下载完成");

    console.log("📦 备份当前项目...");
    backup(ROOT_DIR, backupPath);
    console.log("✅ 备份完成");

    console.log("📂 解压更新包...");
    extractProjectFromZip(zipPath, ROOT_DIR, ["node_modules"], [
      "configs/config.json",
    ]);
    console.log("✅ 解压完成");

    updatePackageVersion(latestVersion);

    if (zipPath && fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    console.log("🔄 即将重启服务器...");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        version: latestVersion,
        message: "更新成功，服务器即将重启",
      }),
    );

    scheduleServerRestart();
  } catch (error) {
    console.error("❌ 更新失败:", error);

    if (backupPath && fs.existsSync(backupPath)) {
      try {
        console.log("⏪ 更新失败，正在回滚...");
        restore(backupPath, ROOT_DIR);
        console.log("✅ 回滚完成");
      } catch (rollbackError) {
        console.error("❌ 回滚失败:", rollbackError);
      }
    }

    if (zipPath && fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "更新失败: " + error.message,
      }),
    );
  }
}

module.exports = {
  handleCheckUpdate,
  handleApplyUpdate,
};
