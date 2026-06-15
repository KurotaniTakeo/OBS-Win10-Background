/**
 * 自动更新检查器
 * 页面加载后自动触发更新检查，发现新版本时提示用户
 * 依赖: api-service.js, dialog-manager.js, notification-manager.js
 */

(function () {
  function waitForConfigManager() {
    if (typeof configManager !== "undefined" && configManager.checkForUpdates) {
      configManager.checkForUpdates({ manual: false });
      return;
    }
    setTimeout(waitForConfigManager, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      waitForConfigManager();
    });
  } else {
    waitForConfigManager();
  }
})();
