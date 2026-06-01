/**
 * 配置管理器 - 处理所有配置项
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

  async init() {
    await this.loadConfig();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupUI();
      });
    } else {
      this.setupUI();
    }
  }

  setupUI() {
    const eventBinder = new EventBinder(this);
    eventBinder.bindConfigEvents();
    eventBinder.bindProfileEvents();
    ConfigApplier.applyConfig(this.config);
    this.initConfigShortcut();
    this.checkFirstLaunch();
    // 保留配置相关初始化，移除自动更新检查
    this.loadProfileList();
  }

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
        this.notificationManager.showSaveNotification(
          true,
          "配置已保存到 config.json",
          this.config.themeColor,
        );
      }
    } catch (error) {
      console.error("❌ 配置保存失败:", error);

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
          this.notificationManager.showSaveNotification(
            false,
            "配置保存失败，请确保服务器正在运行",
            this.config.themeColor,
          );
        }
      }
    }
  }

  scheduleSaveConfig() {
    if (this.pendingSaveTimer) {
      clearTimeout(this.pendingSaveTimer);
    }

    this.pendingSaveTimer = setTimeout(() => {
      this.pendingSaveTimer = null;
      this.saveConfig({ showNotification: true });
    }, this.saveCooldownMs);
  }

  async checkFirstLaunch() {
    if (this.config.isFirstLaunch === true) {
      console.log("🎉 检测到首次启动，显示帮助提示");
      await DialogManager.showFirstLaunchModal(async () => {
        this.config.isFirstLaunch = false;
        await this.saveConfig({ showNotification: false });
      });
    }
  }

  async checkForUpdates({ manual = false } = {}) {
    try {
      const versionInfo = await this.apiService.getVersion();
      if (!versionInfo || !versionInfo.version) {
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

      const result = await this.apiService.checkUpdate();

      if (result?.success && result?.hasUpdate) {
        if (!this.updatePromptShown) {
          this.updatePromptShown = true;
          const shouldUpdate = await DialogManager.showUpdateConfirmDialog({
            currentVersion: result.currentVersion,
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
        if (result?.success && !result?.hasUpdate) {
          this.notificationManager.showUpdateStatusNotification({
            title: "已是最新",
            message: `当前版本 ${result.currentVersion} 已是最新版本`,
            themeColor,
          });
        } else if (!result?.success) {
          if (!result?.noRelease) {
            this.notificationManager.showUpdateStatusNotification({
              title: "检测失败",
              message: result?.message || "无法连接更新服务，请稍后再试",
              themeColor,
              isError: true,
            });
          } else {
            this.notificationManager.showUpdateStatusNotification({
              title: "暂无更新",
              message: "仓库暂无可用更新",
              themeColor,
            });
          }
        } else if (result?.hasUpdate) {
          this.notificationManager.showUpdateStatusNotification({
            title: "发现新版本",
            message: `当前 ${result.currentVersion} → 最新 ${result.latestVersion}`,
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


  async resetToDefaultConfig() {
    try {
      const result = await this.apiService.resetConfig();
      console.log("✅ 已恢复默认配置:", result);

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

  initConfigShortcut() {
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.ctrlKey && !e.shiftKey && e.key === "s") {
          e.preventDefault();
          this.saveConfig({ showNotification: true });
          return;
        }
      },
      true,
    );

    console.log("✅ 快捷键已绑定: Ctrl+S 保存配置");
  }

  get(key) {
    return this.config[key];
  }

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

  /**
   * 加载配置列表
   */
  async loadProfileList() {
    try {
      const profiles = await this.apiService.getProfiles();
      const selector = document.getElementById("profile-selector");

      if (!selector) return;

      // 清空现有选项
      selector.innerHTML = "";

      // 添加配置选项
      profiles.forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        if (profile.isCurrent) {
          option.selected = true;
        }
        selector.appendChild(option);
      });

      // 更新按钮状态
      this.updateProfileButtonStates();
    } catch (error) {
      console.error("❌ 加载配置列表失败:", error);
    }
  }

  /**
   * 更新配置按钮状态（默认配置不可删除/重命名）
   */
  updateProfileButtonStates() {
    const selector = document.getElementById("profile-selector");
    const renameBtn = document.getElementById("btn-rename-profile");
    const deleteBtn = document.getElementById("btn-delete-profile");

    if (!selector) return;

    const selectedValue = selector.value;
    const isDefault = selectedValue === "default";

    if (renameBtn) {
      renameBtn.disabled = isDefault;
      renameBtn.style.opacity = isDefault ? "0.5" : "1";
      renameBtn.style.cursor = isDefault ? "not-allowed" : "pointer";
    }

    if (deleteBtn) {
      deleteBtn.disabled = isDefault;
      deleteBtn.style.opacity = isDefault ? "0.5" : "1";
      deleteBtn.style.cursor = isDefault ? "not-allowed" : "pointer";
    }
  }

  /**
   * 切换配置
   */
  async switchProfile(profileId) {
    try {
      const newConfig = await this.apiService.switchProfile(profileId);
      this.config = newConfig;
      ConfigApplier.applyConfig(this.config);

      // 更新按钮状态
      this.updateProfileButtonStates();

      // 显示Toast通知
      this.notificationManager.showProfileSwitchNotification(
        this.config.themeColor,
      );

      console.log(`✅ 已切换到配置: ${profileId}`);
    } catch (error) {
      console.error("❌ 配置切换失败:", error);
      this.notificationManager.showSaveNotification(
        false,
        "配置切换失败: " + error.message,
        this.config.themeColor,
      );
    }
  }

  /**
   * 新建配置
   */
  async createProfile() {
    const name = prompt("请输入新配置的名称:", "新配置");
    if (!name || name.trim() === "") {
      return;
    }

    try {
      const profile = await this.apiService.createProfile(name.trim());
      console.log(`✅ 已创建配置: ${profile.name}`);

      // 重新加载配置列表
      await this.loadProfileList();

      // 切换到新配置
      const selector = document.getElementById("profile-selector");
      if (selector) {
        selector.value = profile.id;
        await this.switchProfile(profile.id);
      }

      this.notificationManager.showSaveNotification(
        true,
        `配置 "${profile.name}" 创建成功`,
        this.config.themeColor,
      );
    } catch (error) {
      console.error("❌ 配置创建失败:", error);
      this.notificationManager.showSaveNotification(
        false,
        "配置创建失败: " + error.message,
        this.config.themeColor,
      );
    }
  }

  /**
   * 重命名配置
   */
  async renameProfile() {
    const selector = document.getElementById("profile-selector");
    if (!selector) return;

    const profileId = selector.value;
    if (profileId === "default") {
      this.notificationManager.showSaveNotification(
        false,
        "默认配置不能重命名",
        this.config.themeColor,
      );
      return;
    }

    const currentName = selector.options[selector.selectedIndex].text;
    const newName = prompt("请输入新名称:", currentName);

    if (!newName || newName.trim() === "" || newName.trim() === currentName) {
      return;
    }

    try {
      await this.apiService.renameProfile(profileId, newName.trim());
      console.log(`✅ 配置已重命名: ${newName}`);

      // 重新加载配置列表
      await this.loadProfileList();

      // 保持选中当前配置
      selector.value = profileId;

      this.notificationManager.showSaveNotification(
        true,
        `配置已重命名为 "${newName.trim()}"`,
        this.config.themeColor,
      );
    } catch (error) {
      console.error("❌ 配置重命名失败:", error);
      this.notificationManager.showSaveNotification(
        false,
        "配置重命名失败: " + error.message,
        this.config.themeColor,
      );
    }
  }

  /**
   * 复制配置
   */
  async duplicateProfile() {
    const selector = document.getElementById("profile-selector");
    if (!selector) return;

    const profileId = selector.value;

    try {
      const profile = await this.apiService.duplicateProfile(profileId);
      console.log(`✅ 配置已复制: ${profile.name}`);

      // 重新加载配置列表
      await this.loadProfileList();

      // 切换到新配置
      selector.value = profile.id;
      await this.switchProfile(profile.id);

      this.notificationManager.showSaveNotification(
        true,
        `配置 "${profile.name}" 复制成功`,
        this.config.themeColor,
      );
    } catch (error) {
      console.error("❌ 配置复制失败:", error);
      this.notificationManager.showSaveNotification(
        false,
        "配置复制失败: " + error.message,
        this.config.themeColor,
      );
    }
  }

  /**
   * 删除配置
   */
  async deleteProfile() {
    const selector = document.getElementById("profile-selector");
    if (!selector) return;

    const profileId = selector.value;
    if (profileId === "default") {
      this.notificationManager.showSaveNotification(
        false,
        "默认配置不能删除",
        this.config.themeColor,
      );
      return;
    }

    const profileName = selector.options[selector.selectedIndex].text;
    if (!confirm(`确定要删除配置 "${profileName}" 吗？`)) {
      return;
    }

    try {
      await this.apiService.deleteProfile(profileId);
      console.log(`✅ 配置已删除: ${profileId}`);

      // 重新加载配置列表（会自动切换到默认配置）
      await this.loadProfileList();

      // 切换到默认配置
      selector.value = "default";
      await this.switchProfile("default");

      this.notificationManager.showSaveNotification(
        true,
        `配置 "${profileName}" 已删除`,
        this.config.themeColor,
      );
    } catch (error) {
      console.error("❌ 配置删除失败:", error);
      this.notificationManager.showSaveNotification(
        false,
        "配置删除失败: " + error.message,
        this.config.themeColor,
      );
    }
  }
}

const configManager = new ConfigManager();
