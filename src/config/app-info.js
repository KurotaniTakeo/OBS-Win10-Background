/**
 * 应用信息模块
 * 提供版本号和仓库信息读取功能
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.dirname(path.dirname(__dirname));

/**
 * 读取应用版本号
 * @returns {string} 版本号
 */
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

/**
 * 读取仓库信息
 * @returns {string} 仓库路径 (格式: owner/repo)
 */
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

        // 解析 GitHub URL
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

        // 简单格式 (owner/repo)
        const simpleMatch = trimmed.match(/^[^/]+\/[^/]+$/);
        if (simpleMatch) {
          return trimmed;
        }
      }
    } catch (error) {
      console.warn("⚠️ 读取仓库信息失败:", error.message);
    }
  }

  // 默认仓库
  return "KurotaniTakeo/OBS-Win10-Background";
}

/**
 * 更新 package.json 中的版本号
 * @param {string} version - 新版本号
 */
function updatePackageVersion(version) {
  if (!version) return;

  const packageJsonPath = path.join(ROOT_DIR, "package.json");
  if (!fs.existsSync(packageJsonPath)) return;

  try {
    const raw = fs.readFileSync(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw);

    const { normalizeVersion } = require("../utils/version");
    const normalized = normalizeVersion(version);

    if (parsed.version !== normalized) {
      parsed.version = normalized;
      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(parsed, null, 2),
        "utf8",
      );
      console.log(`📝 版本号已更新: ${normalized}`);
    }
  } catch (error) {
    console.warn("⚠️ 更新版本号失败:", error.message);
  }
}

module.exports = {
  readAppVersion,
  readRepo,
  updatePackageVersion,
};
