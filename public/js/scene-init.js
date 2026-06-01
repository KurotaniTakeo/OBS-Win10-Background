/**
 * 场景页初始化 - 仅用于 OBS 浏览器源页面
 * 加载配置并应用到场景元素，不包含任何配置编辑功能
 */
(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont",
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

  function getApiBaseUrl() {
    var hasWindow = typeof window !== "undefined" && window.location;
    var isHttp =
      hasWindow &&
      (window.location.protocol === "http:" ||
        window.location.protocol === "https:");
    return isHttp
      ? window.location.origin + "/api"
      : "http://localhost:3000/api";
  }

  async function loadConfig() {
    try {
      var apiBaseUrl = getApiBaseUrl();
      var response = await fetch(apiBaseUrl + "/config");
      if (!response.ok) throw new Error("HTTP " + response.status);
      var loaded = await response.json();
      return Object.assign({}, DEFAULT_CONFIG, loaded);
    } catch (error) {
      console.warn("⚠️ 无法加载配置，使用默认配置:", error.message);
      return Object.assign({}, DEFAULT_CONFIG);
    }
  }

  function bindBottomIcon() {
    var bottomIconContainer = document.getElementById("bottom-icon-container");
    if (bottomIconContainer) {
      bottomIconContainer.addEventListener("click", function () {
        var port =
          window.location.port ||
          (window.location.protocol === "https:" ? "443" : "80");
        window.open("http://localhost:" + port + "/config", "_blank");
      });
    }
  }

  var currentConfigJson = null;

  function startConfigPolling() {
    setInterval(async function () {
      try {
        var newConfig = await loadConfig();
        var newJson = JSON.stringify(newConfig);
        if (newJson !== currentConfigJson) {
          currentConfigJson = newJson;
          ConfigApplier.applyConfig(newConfig);
          console.log("🔄 配置已自动更新");
        }
      } catch (e) {
        // ignore polling errors
      }
    }, 5000);
  }

  async function init() {
    var config = await loadConfig();
    currentConfigJson = JSON.stringify(config);
    ConfigApplier.applyConfig(config);
    bindBottomIcon();
    startConfigPolling();
    console.log("🎬 OBS 场景页已启动");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
