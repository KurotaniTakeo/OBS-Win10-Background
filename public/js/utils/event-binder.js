/**
 * 事件绑定管理 - 处理所有UI事件的绑定
 */
class EventBinder {
  constructor(configManager) {
    this.configManager = configManager;
  }

  bindConfigEvents() {
    this.bindFontSettings();
    this.bindThemeColorSettings();
    this.bindSidebarBgColorSettings();
    this.bindIconSettings();
    this.bindWindowTitleSettings();
    this.bindTitleBarButtonSettings();
    this.bindToggle("toggle-titlebar", "showTitleBar");
    this.bindToggle("toggle-titlebar-font", "enableTitleBarFont");
    this.bindPanelControls();
    this.bindNavSwitching();
    this.bindAboutButtons();
    this.bindCopyUrlButton();
  }

  bindFontSettings() {
    const fontFamilyInput = document.getElementById("font-family");
    if (fontFamilyInput) {
      fontFamilyInput.value =
        this.configManager.config.fontFamily || "Segoe UI";
      fontFamilyInput.addEventListener("change", (e) => {
        this.configManager.config.fontFamily = e.target.value;
        ConfigApplier.applyConfig(this.configManager.config);
        this.configManager.scheduleSaveConfig();
      });
    }
  }

  bindThemeColorSettings() {
    const themeColorInput = document.getElementById("theme-color");
    if (themeColorInput) {
      themeColorInput.value = this.configManager.config.themeColor || "#0078d4";
      const themeColorValue = document.getElementById("theme-color-value");
      const themeColorToggle = document.getElementById("theme-color-toggle");

      if (themeColorValue) {
        themeColorValue.value = themeColorInput.value;
      }

      if (themeColorToggle) {
        themeColorToggle.addEventListener("click", () => {
          this.toggleColorFormat(
            themeColorToggle,
            themeColorInput,
            themeColorValue,
          );
        });
      }

      if (themeColorValue) {
        themeColorValue.addEventListener("input", (e) => {
          const format = themeColorToggle?.dataset.format || "hex";
          const hexColor = ColorUtils.parseColorInput(e.target.value, format);
          if (hexColor) {
            themeColorInput.value = hexColor;
            this.configManager.config.themeColor = hexColor;
            ConfigApplier.applyThemeColor(hexColor);
          }
        });

        themeColorValue.addEventListener("change", (e) => {
          const format = themeColorToggle?.dataset.format || "hex";
          const hexColor = ColorUtils.parseColorInput(e.target.value, format);
          if (hexColor) {
            themeColorInput.value = hexColor;
            this.configManager.config.themeColor = hexColor;
            ConfigApplier.applyThemeColor(hexColor);
            this.updateColorDisplay(hexColor, themeColorValue, format);
            this.configManager.scheduleSaveConfig();
          } else {
            this.updateColorDisplay(
              themeColorInput.value,
              themeColorValue,
              format,
            );
          }
        });
      }

      themeColorInput.addEventListener("change", (e) => {
        this.configManager.config.themeColor = e.target.value;
        ConfigApplier.applyThemeColor(e.target.value);
        if (themeColorValue && themeColorToggle) {
          const format = themeColorToggle.dataset.format || "hex";
          this.updateColorDisplay(e.target.value, themeColorValue, format);
        }
        this.configManager.scheduleSaveConfig();
      });

      themeColorInput.addEventListener("input", (e) => {
        if (themeColorValue && themeColorToggle) {
          const format = themeColorToggle.dataset.format || "hex";
          this.updateColorDisplay(e.target.value, themeColorValue, format);
        }
      });
    }
  }

  bindSidebarBgColorSettings() {
    const sidebarBgColorInput = document.getElementById("sidebar-bg-color");
    if (sidebarBgColorInput) {
      const hexColor = ColorUtils.rgbToHex(
        this.configManager.config.sidebarBgColor || "rgb(20, 20, 30)",
      );
      sidebarBgColorInput.value = hexColor;
      const sidebarBgColorValue = document.getElementById(
        "sidebar-bg-color-value",
      );
      const sidebarBgColorToggle = document.getElementById(
        "sidebar-bg-color-toggle",
      );

      if (sidebarBgColorValue) {
        sidebarBgColorValue.value = hexColor;
      }

      if (sidebarBgColorToggle) {
        sidebarBgColorToggle.addEventListener("click", () => {
          this.toggleColorFormat(
            sidebarBgColorToggle,
            sidebarBgColorInput,
            sidebarBgColorValue,
          );
        });
      }

      if (sidebarBgColorValue) {
        sidebarBgColorValue.addEventListener("input", (e) => {
          const format = sidebarBgColorToggle?.dataset.format || "hex";
          const hexColor = ColorUtils.parseColorInput(e.target.value, format);
          if (hexColor) {
            sidebarBgColorInput.value = hexColor;
            this.configManager.config.sidebarBgColor = hexColor;
            ConfigApplier.applySidebarBgColor(hexColor);
          }
        });

        sidebarBgColorValue.addEventListener("change", (e) => {
          const format = sidebarBgColorToggle?.dataset.format || "hex";
          const hexColor = ColorUtils.parseColorInput(e.target.value, format);
          if (hexColor) {
            sidebarBgColorInput.value = hexColor;
            this.configManager.config.sidebarBgColor = hexColor;
            ConfigApplier.applySidebarBgColor(hexColor);
            this.updateColorDisplay(hexColor, sidebarBgColorValue, format);
            this.configManager.scheduleSaveConfig();
          } else {
            this.updateColorDisplay(
              sidebarBgColorInput.value,
              sidebarBgColorValue,
              format,
            );
          }
        });
      }

      sidebarBgColorInput.addEventListener("change", (e) => {
        this.configManager.config.sidebarBgColor = e.target.value;
        ConfigApplier.applySidebarBgColor(e.target.value);
        if (sidebarBgColorValue && sidebarBgColorToggle) {
          const format = sidebarBgColorToggle.dataset.format || "hex";
          this.updateColorDisplay(e.target.value, sidebarBgColorValue, format);
        }
        this.configManager.scheduleSaveConfig();
      });

      sidebarBgColorInput.addEventListener("input", (e) => {
        if (sidebarBgColorValue && sidebarBgColorToggle) {
          const format = sidebarBgColorToggle.dataset.format || "hex";
          this.updateColorDisplay(e.target.value, sidebarBgColorValue, format);
        }
      });
    }
  }

  bindIconSettings() {
    this.bindIconInput("logo-icon-input", "logoIcon", "#logo-icon");
    this.bindIconInput(
      "nav-icons-input",
      "navIconsBlack",
      null,
      "renderNavIcons",
    );
    this.bindIconInput("bottom-icon-input", "bottomIcon", "#bottom-icon");
  }

  bindIconInput(inputId, configKey, elementSelector, callbackMethod) {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = this.configManager.config[configKey] || "";
      input.addEventListener("change", (e) => {
        this.configManager.config[configKey] = e.target.value;

        const defaultValues = { logoIcon: "\uE700", bottomIcon: "\uE713" };
        const valueToApply =
          e.target.value.trim() || defaultValues[configKey] || e.target.value;

        if (callbackMethod && callbackMethod === "renderNavIcons") {
          ConfigApplier.renderNavIcons(
            e.target.value,
            this.configManager.config.sidebarBgColor,
          );
        } else if (
          callbackMethod &&
          typeof ConfigApplier[callbackMethod] === "function"
        ) {
          ConfigApplier[callbackMethod](e.target.value);
        } else if (elementSelector) {
          const element = document.querySelector(elementSelector);
          if (element) {
            element.textContent = valueToApply;
          }
        }
        this.configManager.scheduleSaveConfig();
      });

      if (this.configManager.config[configKey]) {
        if (callbackMethod && callbackMethod === "renderNavIcons") {
          ConfigApplier.renderNavIcons(
            this.configManager.config[configKey],
            this.configManager.config.sidebarBgColor,
          );
        } else if (
          callbackMethod &&
          typeof ConfigApplier[callbackMethod] === "function"
        ) {
          ConfigApplier[callbackMethod](this.configManager.config[configKey]);
        } else if (elementSelector) {
          const element = document.querySelector(elementSelector);
          if (element) {
            element.textContent = this.configManager.config[configKey];
          }
        }
      }
    }
  }

  bindWindowTitleSettings() {
    const windowTitleInput = document.getElementById("window-title-input");
    if (windowTitleInput) {
      windowTitleInput.value =
        this.configManager.config.windowTitle || "OBS Windows 10 Background";
      windowTitleInput.addEventListener("change", (e) => {
        this.configManager.config.windowTitle = e.target.value;
        this.configManager.scheduleSaveConfig();
      });
    }

    const windowTitleFontInput = document.getElementById(
      "window-title-font-input",
    );
    if (windowTitleFontInput) {
      windowTitleFontInput.value =
        this.configManager.config.windowTitleFont ||
        "Segoe UI, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
      windowTitleFontInput.addEventListener("change", (e) => {
        this.configManager.config.windowTitleFont = e.target.value;
        this.configManager.scheduleSaveConfig();
      });
    }

    const windowTitleFontSizeInput = document.getElementById(
      "window-title-font-size-input",
    );
    if (windowTitleFontSizeInput) {
      windowTitleFontSizeInput.value =
        this.configManager.config.windowTitleFontSize || 18;
      windowTitleFontSizeInput.addEventListener("change", (e) => {
        this.configManager.config.windowTitleFontSize = parseInt(
          e.target.value,
        );
        this.configManager.scheduleSaveConfig();
      });
    }
  }

  bindTitleBarButtonSettings() {
    const titleBarButtonsInput = document.getElementById(
      "titlebar-buttons-input",
    );
    if (titleBarButtonsInput) {
      titleBarButtonsInput.value =
        this.configManager.config.titleBarButtons ||
        "&#xE921;,&#xE923;,&#xE8BB;";
      titleBarButtonsInput.addEventListener("change", (e) => {
        this.configManager.config.titleBarButtons = e.target.value;
        this.configManager.scheduleSaveConfig();
      });
    }
  }

  bindPanelControls() {
    const saveBtnIds = [
      "save-config-btn",
      "save-config-btn-appearance",
      "save-config-btn-sidebar",
      "btn-save-topbar",
    ];
    saveBtnIds.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          await this.configManager.saveConfig();
        });
      }
    });
  }

  bindNavSwitching() {
    const navItems = document.querySelectorAll(".config-nav-item");
    const pages = document.querySelectorAll(".config-page");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const pageId = item.dataset.page;

        navItems.forEach((n) => n.classList.remove("active"));
        pages.forEach((p) => p.classList.remove("active"));

        item.classList.add("active");
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
          targetPage.classList.add("active");
        }
      });
    });
  }

  bindAboutButtons() {
    const helpBtn = document.getElementById("btn-help");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => {
        DialogManager.showFirstLaunchModal(async () => {
          this.configManager.config.isFirstLaunch = false;
          await this.configManager.saveConfig({ showNotification: false });
        });
      });
    }

    const changelogBtn = document.getElementById("btn-changelog");
    if (changelogBtn) {
      changelogBtn.addEventListener("click", () => {
        DialogManager.showChangelogModal();
      });
    }

    const checkUpdateBtn = document.getElementById("btn-check-update");
    if (checkUpdateBtn) {
      checkUpdateBtn.addEventListener("click", () => {
        this.configManager.checkForUpdates({ manual: true });
      });
    }

    const downloadFontBtn = document.getElementById("btn-download-font");
    if (downloadFontBtn) {
      downloadFontBtn.addEventListener("click", () => {
        window.open("https://aka.ms/SegoeFonts", "_blank");
      });
    }


    const resetBtn = document.getElementById("btn-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        DialogManager.showResetConfirmDialog(async () => {
          await this.configManager.resetToDefaultConfig();
        });
      });
    }
  }

  bindCopyUrlButton() {
    const copyUrlBtnIds = ["btn-copy-url", "btn-copy-url-appearance"];
    copyUrlBtnIds.forEach((btnId) => {
      const copyUrlBtn = document.getElementById(btnId);
      if (!copyUrlBtn) return;

      copyUrlBtn.addEventListener("click", () => {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const port = url.port || (url.protocol === "https:" ? "443" : "80");
        const obsUrl = `http://localhost:${port}`;

        navigator.clipboard
          .writeText(obsUrl)
          .then(() => {
            this.configManager.notificationManager.showCopyUrlNotification(
              obsUrl,
              this.configManager.config?.themeColor || "#0078d4",
            );
          })
          .catch((err) => {
            console.error("复制失败:", err);
            const textarea = document.createElement("textarea");
            textarea.value = obsUrl;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand("copy");
              this.configManager.notificationManager.showCopyUrlNotification(
                obsUrl,
                this.configManager.config?.themeColor || "#0078d4",
              );
            } catch (e) {
              console.error("降级复制也失败:", e);
            }
            document.body.removeChild(textarea);
          });
      });
    });
  }

  bindToggle(toggleId, configKey) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      const collapsibleId =
        configKey === "showTitleBar"
          ? "titlebar-details"
          : configKey === "enableTitleBarFont"
            ? "titlebar-font-details"
            : null;

      if (this.configManager.config[configKey]) {
        toggle.classList.add("active");
      } else if (collapsibleId) {
        const collapsible = document.getElementById(collapsibleId);
        if (collapsible) {
          collapsible.classList.add("collapsed");
        }
      }

      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.classList.toggle("active");
        this.configManager.config[configKey] =
          toggle.classList.contains("active");

        if (collapsibleId) {
          const collapsible = document.getElementById(collapsibleId);
          if (collapsible) {
            if (this.configManager.config[configKey]) {
              collapsible.classList.remove("collapsed");
            } else {
              collapsible.classList.add("collapsed");
            }
          }
        }

        this.configManager.scheduleSaveConfig();
      });
    }
  }

  toggleColorFormat(toggleBtn, colorInput, valueDisplay) {
    const formats = ["hex", "rgb", "hsl"];
    let currentFormat = toggleBtn.dataset.format || "hex";
    let currentIndex = formats.indexOf(currentFormat);
    let nextIndex = (currentIndex + 1) % formats.length;
    let nextFormat = formats[nextIndex];

    toggleBtn.dataset.format = nextFormat;
    toggleBtn.textContent = nextFormat.toUpperCase();

    this.updateColorDisplay(colorInput.value, valueDisplay, nextFormat);
  }

  updateColorDisplay(hexColor, valueDisplay, format) {
    if (!valueDisplay) return;

    switch (format) {
      case "hex":
        valueDisplay.value = hexColor.toUpperCase();
        break;
      case "rgb":
        const rgb = ColorUtils.hexToRgb(hexColor);
        valueDisplay.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        break;
      case "hsl":
        const hsl = ColorUtils.hexToHsl(hexColor);
        valueDisplay.value = `hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`;
        break;
    }
  }

  /**
   * 绑定配置管理事件
   */
  bindProfileEvents() {
    // 配置选择器
    const profileSelector = document.getElementById("profile-selector");
    if (profileSelector) {
      profileSelector.addEventListener("change", (e) => {
        const profileId = e.target.value;
        this.configManager.switchProfile(profileId);
      });
    }

    // 新建配置按钮
    const newProfileBtn = document.getElementById("btn-new-profile");
    if (newProfileBtn) {
      newProfileBtn.addEventListener("click", () => {
        this.configManager.createProfile();
      });
    }

    // 重命名配置按钮
    const renameProfileBtn = document.getElementById("btn-rename-profile");
    if (renameProfileBtn) {
      renameProfileBtn.addEventListener("click", () => {
        this.configManager.renameProfile();
      });
    }

    // 复制配置按钮
    const duplicateProfileBtn = document.getElementById(
      "btn-duplicate-profile",
    );
    if (duplicateProfileBtn) {
      duplicateProfileBtn.addEventListener("click", () => {
        this.configManager.duplicateProfile();
      });
    }

    // 删除配置按钮
    const deleteProfileBtn = document.getElementById("btn-delete-profile");
    if (deleteProfileBtn) {
      deleteProfileBtn.addEventListener("click", () => {
        this.configManager.deleteProfile();
      });
    }
  }
}
