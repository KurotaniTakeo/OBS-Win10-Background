/**
 * 配置管理器 - 处理所有配置项，不在OBS中显示
 * 配置文件存储在 config.json 中，通过后端 API 读写
 */

class ConfigManager {
  constructor() {
    this.config = null;
    const hasWindow = typeof window !== "undefined" && window.location;
    const isHttp =
      hasWindow &&
      (window.location.protocol === "http:" ||
        window.location.protocol === "https:");
    const apiBaseUrl = isHttp
      ? `${window.location.origin}/api`
      : "http://localhost:3000/api";

    this.apiService = new ApiService(apiBaseUrl);
    this.notificationManager = new NotificationManager();
    this.saveCooldownMs = 1000;
    this.pendingSaveTimer = null;
    this.updateInProgress = false;
    this.updatePromptShown = false;

    this.defaultConfig = {
      isFirstLaunch: true,
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
    this.init();
  }

  /**
   * 初始化配置管理器（异步）
   */
  async init() {
    // 先加载配置
    await this.loadConfig();

    // 绑定事件
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupUI();
      });
    } else {
      // 如果DOM已加载，直接执行
      this.setupUI();
    }
  }

  /**
   * 设置UI和事件
   */
  setupUI() {
    const eventBinder = new EventBinder(this);
    eventBinder.bindConfigEvents();
    ConfigApplier.applyConfig(this.config);
    this.initConfigShortcut();
    this.checkFirstLaunch();
    this.checkForUpdates();
  }

  /**
   * 从后端 API 加载配置
   */
  async loadConfig() {
    try {
      const loadedConfig = await this.apiService.loadConfig();
      this.config = { ...this.defaultConfig, ...loadedConfig };
      return this.config;
    } catch (error) {
      console.warn("⚠️ 无法从服务器加载配置，使用默认配置");
      this.config = { ...this.defaultConfig };
      return this.config;
    }
  }

  /**
   * 保存配置到服务器（直接写入 config.json）
   */
  async saveConfig(options = {}) {
    try {
      if (this.pendingSaveTimer) {
        clearTimeout(this.pendingSaveTimer);
        this.pendingSaveTimer = null;
      }
      const configToSave = { ...this.config };

      await this.apiService.saveConfig(configToSave);

      const { showNotification = true } = options;
      if (showNotification) {
        // 显示成功提示
        this.notificationManager.showSaveNotification(
          true,
          "配置已保存到 config.json",
          this.config.themeColor,
        );
      }
    } catch (error) {
      console.error("❌ 配置保存失败:", error);

      // 回退：下载 config.json 供手动替换
      const downloaded = this.apiService.downloadConfig({ ...this.config });
      if (downloaded) {
        const { showNotification = true } = options;
        if (showNotification) {
          this.notificationManager.showSaveNotification(
            true,
            "无法连接服务器，已下载 config.json，请替换项目文件并刷新",
            this.config.themeColor,
          );
        }
      } else {
        const { showNotification = true } = options;
        if (showNotification) {
          // 显示错误提示
          this.notificationManager.showSaveNotification(
            false,
            "配置保存失败，请确保服务器正在运行",
            this.config.themeColor,
          );
        }
      }
    }
  }

  /**
   * 延迟保存配置（冷却时间内无操作才执行）
   */
  scheduleSaveConfig() {
    if (this.pendingSaveTimer) {
      clearTimeout(this.pendingSaveTimer);
    }

    this.pendingSaveTimer = setTimeout(() => {
      this.pendingSaveTimer = null;
      this.saveConfig({ showNotification: true });
    }, this.saveCooldownMs);
  }

  /**
   * 检查是否为首次启动
   */
  async checkFirstLaunch() {
    if (this.config.isFirstLaunch === true) {
      console.log("🎉 检测到首次启动，显示帮助提示");
      await DialogManager.showFirstLaunchModal(async () => {
        this.config.isFirstLaunch = false;
        await this.saveConfig({ showNotification: false });
      });
    }
  }

  /**
   * 检查 GitHub Release 更新
   */
  async checkForUpdates({ manual = false } = {}) {
    try {
      const versionInfo = await this.apiService.getVersion();
      if (!versionInfo || !versionInfo.version || !versionInfo.repo) {
        if (manual) {
          this.notificationManager.showUpdateStatusNotification({
            title: "检测失败",
            message: "无法获取版本信息，请检查服务器",
            themeColor: this.config?.themeColor || "#0078d4",
            isError: true,
          });
        }
        return;
      }

      const versionLabel = document.getElementById("app-version");
      if (versionLabel) {
        versionLabel.textContent = versionInfo.version;
      }

      const themeColor = this.config?.themeColor || "#0078d4";

      const result = await UpdateChecker.checkForUpdates({
        currentVersion: versionInfo.version,
        repo: versionInfo.repo,
        notificationManager: this.notificationManager,
        themeColor,
        notifyOnUpdate: false,
      });

      if (result?.status === "update-available") {
        if (!this.updatePromptShown) {
          this.updatePromptShown = true;
          const shouldUpdate = await DialogManager.showUpdateConfirmDialog({
            currentVersion: versionInfo.version,
            latestVersion: result.latestVersion,
            releaseUrl: result.releaseUrl,
            themeColor,
          });
          if (shouldUpdate) {
            await this.applyUpdate({
              repo: versionInfo.repo,
              latestVersion: result.latestVersion,
            });
          }
        }
      }

      if (manual) {
        if (result?.status === "up-to-date") {
          this.notificationManager.showUpdateStatusNotification({
            title: "已是最新",
            message: `当前版本 ${versionInfo.version} 已是最新版本`,
            themeColor,
          });
        } else if (result?.status === "error") {
          this.notificationManager.showUpdateStatusNotification({
            title: "检测失败",
            message: "无法连接更新服务，请稍后再试",
            themeColor,
            isError: true,
          });
        } else if (result?.status === "update-available") {
          this.notificationManager.showUpdateStatusNotification({
            title: "发现新版本",
            message: `当前 ${versionInfo.version} → 最新 ${result.latestVersion}`,
            themeColor,
          });
        }
      }
    } catch (error) {
      console.warn("⚠️ 更新检查异常:", error.message);
      if (manual) {
        this.notificationManager.showUpdateStatusNotification({
          title: "检测失败",
          message: "更新检查异常，请稍后再试",
          themeColor: this.config?.themeColor || "#0078d4",
          isError: true,
        });
      }
    }
  }

  /**
   * 应用更新（下载并替换 public 目录）
   */
  async applyUpdate({ repo, latestVersion }) {
    if (this.updateInProgress) return;
    this.updateInProgress = true;

    const themeColor = this.config?.themeColor || "#0078d4";

    try {
      this.notificationManager.showUpdateStatusNotification({
        title: "正在更新",
        message: "正在下载并应用更新，请稍候...",
        themeColor,
      });

      await this.apiService.applyUpdate({ repo });

      this.notificationManager.showUpdateStatusNotification({
        title: "更新完成",
        message: `已更新到 ${latestVersion || "最新"}，服务器即将重启`,
        themeColor,
      });

      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } catch (error) {
      console.error("❌ 更新应用失败:", error);
      this.notificationManager.showUpdateStatusNotification({
        title: "更新失败",
        message: "更新应用失败，请稍后再试",
        themeColor,
        isError: true,
      });
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * 恢复为默认配置
   */
  async resetToDefaultConfig() {
    try {
      const result = await this.apiService.resetConfig();
      console.log("✅ 已恢复默认配置:", result);

      // 重新加载配置
      await this.loadConfig();
      ConfigApplier.applyConfig(this.config);
      this.notificationManager.showSaveNotification(
        true,
        "配置已恢复为默认值，请刷新页面",
        this.config.themeColor,
      );
    } catch (error) {
      console.error("❌ 恢复配置失败:", error);
      this.notificationManager.showSaveNotification(
        false,
        "恢复配置失败，请检查服务器",
        this.config.themeColor,
      );
    }
  }

  /**
   * 切换配置面板显示状态
   */
  toggleConfigPanel() {
    const panel = document.getElementById("config-panel");
    if (panel) {
      panel.classList.toggle("show");
      console.log(
        "配置面板: " + (panel.classList.contains("show") ? "已打开" : "已关闭"),
      );
    }
  }

  /**
   * 初始化快捷键打开配置面板（Ctrl+K 或 Ctrl+Shift+O）
   */
  initConfigShortcut() {
    // 绑定底部icon按钮点击事件打开设置
    const bottomIconContainer = document.getElementById(
      "bottom-icon-container",
    );
    if (bottomIconContainer) {
      bottomIconContainer.addEventListener("click", () => {
        this.toggleConfigPanel();
      });
    }

    // 在window级别监听，确保捕获所有键盘事件
    window.addEventListener(
      "keydown",
      (e) => {
        // Ctrl+K 打开配置（主快捷键）
        if (e.ctrlKey && !e.shiftKey && e.key === "k") {
          e.preventDefault();
          this.toggleConfigPanel();
          return;
        }

        // Ctrl+Shift+O 打开配置（备选快捷键）
        if (e.ctrlKey && e.shiftKey && (e.key === "O" || e.key === "o")) {
          e.preventDefault();
          this.toggleConfigPanel();
          return;
        }

        // Ctrl+S 快速保存当前配置
        if (e.ctrlKey && !e.shiftKey && e.key === "s") {
          e.preventDefault();
          this.saveConfig({ showNotification: true });
          return;
        }

        // Ctrl+C 快速复制OBS浏览器源URL（如果没有选中文本）
        if (e.ctrlKey && !e.shiftKey && e.key === "c") {
          // 检查是否有选中文本
          const selectedText = window.getSelection().toString().trim();
          if (!selectedText) {
            // 没有选中文本时才复制OBS URL
            e.preventDefault();
            this.copyObsUrl();
          }
          // 有选中文本时，使用默认复制行为
          return;
        }

        // Escape 关闭配置
        if (e.key === "Escape") {
          const panel = document.getElementById("config-panel");
          if (panel && panel.classList.contains("show")) {
            panel.classList.remove("show");
            console.log("配置面板: 已关闭");
          }
        }
      },
      true,
    ); // 使用捕获阶段，确保优先级

    console.log(
      "✅ 快捷键已绑定: Ctrl+K、Ctrl+Shift+O 打开配置面板，Ctrl+S 保存配置，Ctrl+C 复制OBS URL，以及底部icon按钮点击打开",
    );
  }

  /**
   * 快速复制OBS浏览器源URL
   */
  copyObsUrl() {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const port = url.port || (url.protocol === "https:" ? "443" : "80");
    const obsUrl = `http://localhost:${port}`;

    navigator.clipboard
      .writeText(obsUrl)
      .then(() => {
        this.notificationManager.showCopyUrlNotification(
          obsUrl,
          this.config?.themeColor || "#0078d4",
        );
      })
      .catch((err) => {
        console.error("复制失败:", err);
        // 备用方案：使用 textarea
        const textarea = document.createElement("textarea");
        textarea.value = obsUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          this.notificationManager.showCopyUrlNotification(
            obsUrl,
            this.config?.themeColor || "#0078d4",
          );
        } catch (e) {
          console.error("备用复制方案也失败:", e);
          this.notificationManager.showSaveNotification(
            false,
            "URL复制失败，请手动复制",
            this.config?.themeColor || "#0078d4",
          );
        }
        document.body.removeChild(textarea);
      });
  }

  /**
   * 获取配置值
   */
  get(key) {
    return this.config[key];
  }

  /**
   * 设置配置值
   */
  set(key, value) {
    this.config[key] = value;
    ConfigApplier.applyConfig(this.config);
    this.scheduleSaveConfig();
  }

  /**
   * 切换配置面板显示状态
   */
  toggleConfigPanel() {
    const panel = document.getElementById("config-panel");
    if (panel) {
      panel.classList.toggle("show");
      console.log(
        "配置面板: " + (panel.classList.contains("show") ? "已打开" : "已关闭"),
      );
    }
  }
}

// 全局配置管理器实例
const configManager = new ConfigManager();
