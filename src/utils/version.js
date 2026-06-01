/**
 * 版本管理工具
 * 提供版本号的规范化和比较功能
 */

/**
 * 规范化版本号
 * @param {string} version - 原始版本号
 * @returns {string} 规范化后的版本号
 */
function normalizeVersion(version) {
  if (!version) return "0.0.0";
  return version.toString().trim().replace(/^v/i, "");
}

/**
 * 比较两个版本号的大小
 * @param {string} a - 版本号A
 * @param {string} b - 版本号B
 * @returns {number} 1表示a>b, -1表示a<b, 0表示相等
 */
function compareVersions(a, b) {
  const aNorm = normalizeVersion(a);
  const bNorm = normalizeVersion(b);

  // 分离主版本号和 prerelease 部分
  const [aMain, aPrerelease] = aNorm.split("-");
  const [bMain, bPrerelease] = bNorm.split("-");

  // 比较主版本号
  const aParts = aMain.split(".");
  const bParts = bMain.split(".");
  const maxLen = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLen; i++) {
    const aNum = parseInt(aParts[i] || "0", 10);
    const bNum = parseInt(bParts[i] || "0", 10);
    if (aNum > bNum) return 1;
    if (aNum < bNum) return -1;
  }

  // 主版本号相同，比较 prerelease
  if (!aPrerelease && !bPrerelease) return 0;
  if (!aPrerelease) return 1; // 正式版大于 prerelease
  if (!bPrerelease) return -1; // prerelease 小于正式版

  // 都是 prerelease，字符串比较
  if (aPrerelease > bPrerelease) return 1;
  if (aPrerelease < bPrerelease) return -1;
  return 0;
}

module.exports = {
  normalizeVersion,
  compareVersions,
};
