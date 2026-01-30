/**
 * 更新检查 - 通过 GitHub Release 检测更新
 */
class UpdateChecker {
  static normalizeVersion(version) {
    if (!version) return "0.0.0";
    return version
      .toString()
      .trim()
      .replace(/^v/i, "")
      .split("+")[0]
      .split("-")[0];
  }

  static compareVersions(a, b) {
    const aParts = UpdateChecker.normalizeVersion(a).split(".");
    const bParts = UpdateChecker.normalizeVersion(b).split(".");

    const maxLen = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < maxLen; i++) {
      const aNum = parseInt(aParts[i] || "0", 10);
      const bNum = parseInt(bParts[i] || "0", 10);
      if (aNum > bNum) return 1;
      if (aNum < bNum) return -1;
    }
    return 0;
  }

  static async checkForUpdates({
    currentVersion,
    repo,
    notificationManager,
    themeColor,
    notifyOnUpdate = true,
  }) {
    if (!repo || !notificationManager) return;

    const normalizedCurrent = UpdateChecker.normalizeVersion(currentVersion);
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latestTag = data?.tag_name || data?.name;
      const latestVersion = UpdateChecker.normalizeVersion(latestTag);

      if (
        latestVersion &&
        UpdateChecker.compareVersions(latestVersion, normalizedCurrent) > 0
      ) {
        const releaseUrl =
          data?.html_url || `https://github.com/${repo}/releases/latest`;
        if (notifyOnUpdate) {
          notificationManager.showUpdateNotification({
            currentVersion: normalizedCurrent,
            latestVersion,
            releaseUrl,
            themeColor,
          });
        }
        return {
          status: "update-available",
          latestVersion,
          releaseUrl,
        };
      }

      return {
        status: "up-to-date",
        latestVersion: latestVersion || normalizedCurrent,
      };
    } catch (error) {
      console.warn("⚠️ 更新检查失败:", error.message);
      return {
        status: "error",
        message: error.message,
      };
    }
  }
}
