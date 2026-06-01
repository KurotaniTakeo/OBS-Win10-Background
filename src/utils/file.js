/**
 * 文件系统工具
 * 提供文件和目录操作功能
 */

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

/**
 * 从ZIP包中提取项目文件
 * @param {string} zipPath - ZIP文件路径
 * @param {string} targetDir - 目标目录
 * @param {string[]} excludeDirs - 排除的目录列表
 * @param {string[]} excludeFiles - 排除的文件列表
 */
function extractProjectFromZip(
  zipPath,
  targetDir,
  excludeDirs = ["node_modules"],
  excludeFiles = ["configs/config.json"],
) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  if (!entries.length) {
    throw new Error("更新包为空");
  }

  const normalizedEntries = entries
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName.replace(/\\/g, "/"));

  // 检查是否有顶层目录（如 owner-repo-branch/）
  const topLevelMatch = normalizedEntries[0]?.match(/^[^/]+\//);
  const topLevelDir = topLevelMatch ? topLevelMatch[0] : "";

  entries.forEach((entry) => {
    if (entry.isDirectory) return;

    let entryName = entry.entryName.replace(/\\/g, "/");

    // 移除顶层目录前缀
    if (topLevelDir && entryName.startsWith(topLevelDir)) {
      entryName = entryName.slice(topLevelDir.length);
    }

    // 检查是否应该排除此目录
    const shouldExcludeDir = excludeDirs.some(
      (dir) => entryName.startsWith(dir + "/") || entryName === dir,
    );
    if (shouldExcludeDir) {
      console.log(`⏭️ 跳过受保护目录: ${entryName}`);
      return;
    }

    // 检查是否应该排除此文件
    const shouldExcludeFile = excludeFiles.some((file) => entryName === file);
    if (shouldExcludeFile) {
      console.log(`🔒 保护用户配置文件: ${entryName}`);
      return;
    }

    if (!entryName) return;

    const targetPath = path.join(targetDir, entryName);
    const normalizedTarget = path.normalize(targetPath);

    // 安全检查：防止路径遍历
    if (!normalizedTarget.startsWith(path.normalize(targetDir))) {
      console.warn(`⚠️ 拒绝提取危险路径: ${entryName}`);
      return;
    }

    fs.mkdirSync(path.dirname(normalizedTarget), { recursive: true });
    fs.writeFileSync(normalizedTarget, entry.getData());
  });
}

/**
 * 从ZIP包中提取public目录
 * @param {string} zipPath - ZIP文件路径
 * @param {string} targetPublicDir - 目标public目录
 */
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

/**
 * 备份目录或文件
 * @param {string} sourcePath - 源路径
 * @param {string} backupPath - 备份路径
 */
function backup(sourcePath, backupPath) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const stats = fs.statSync(sourcePath);
  if (stats.isDirectory()) {
    fs.cpSync(sourcePath, backupPath, { recursive: true, force: true });
  } else {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(sourcePath, backupPath);
  }
}

/**
 * 恢复备份
 * @param {string} backupPath - 备份路径
 * @param {string} targetPath - 目标路径
 */
function restore(backupPath, targetPath) {
  if (!fs.existsSync(backupPath)) {
    return;
  }

  // 删除目标路径
  if (fs.existsSync(targetPath)) {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
  }

  // 恢复备份
  const backupStats = fs.statSync(backupPath);
  if (backupStats.isDirectory()) {
    fs.cpSync(backupPath, targetPath, { recursive: true, force: true });
  } else {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(backupPath, targetPath);
  }
}

module.exports = {
  extractProjectFromZip,
  extractPublicFromZip,
  backup,
  restore,
};
