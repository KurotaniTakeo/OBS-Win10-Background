/**
 * 配置应用和UI渲染 - 处理配置的应用和UI更新
 */
class ConfigApplier {
  /**
   * 应用配置
   * @param {Object} config - 配置对象
   */
  static applyConfig(config) {
    console.log("📋 应用配置中...", config);

    // 应用字体到全局及配置面板
    if (config.fontFamily) {
      document.body.style.fontFamily = config.fontFamily;

      // 应用到配置面板的所有文本元素（除了图标）
      const configPanel = document.querySelector(".config-panel");
      if (configPanel) {
        configPanel.style.fontFamily = config.fontFamily;
      }

      // 应用到所有输入框和标签
      const inputs = document.querySelectorAll(
        ".config-input:not(#logo-icon-input):not(#nav-icons-input):not(#bottom-icon-input):not(#titlebar-buttons-input)",
      );
      inputs.forEach((input) => {
        input.style.fontFamily = config.fontFamily;
      });

      const labels = document.querySelectorAll(".config-label");
      labels.forEach((label) => {
        label.style.fontFamily = config.fontFamily;
      });

      const hints = document.querySelectorAll(".config-hint");
      hints.forEach((hint) => {
        hint.style.fontFamily = config.fontFamily;
      });

      const groupTitles = document.querySelectorAll(
        ".config-group-title span:not(.group-title-icon)",
      );
      groupTitles.forEach((title) => {
        title.style.fontFamily = config.fontFamily;
      });

      const tabs = document.querySelectorAll(
        ".config-tab span:not(.config-tab-icon)",
      );
      tabs.forEach((tab) => {
        tab.style.fontFamily = config.fontFamily;
      });

      const buttons = document.querySelectorAll(
        ".save-config-btn, .about-btn span:not(.btn-icon), .color-format-toggle",
      );
      buttons.forEach((btn) => {
        btn.style.fontFamily = config.fontFamily;
      });

      const aboutText = document.querySelectorAll(
        ".about-section h3, .about-section p, .about-header h2, .about-version",
      );
      aboutText.forEach((text) => {
        text.style.fontFamily = config.fontFamily;
      });

      const colorValues = document.querySelectorAll(".color-picker-value");
      colorValues.forEach((val) => {
        val.style.fontFamily = "monospace, " + config.fontFamily;
      });
    }

    // 应用主题颜色
    if (config.themeColor) {
      ConfigApplier.applyThemeColor(config.themeColor);
    }

    // 应用侧栏背景色
    if (config.sidebarBgColor) {
      ConfigApplier.applySidebarBgColor(config.sidebarBgColor);
    }

    // 应用可见性设置
    ConfigApplier.setVisibility(".title-bar", config.showTitleBar);

    // 应用icon配置
    const logoIcon = document.getElementById("logo-icon");
    if (logoIcon) {
      logoIcon.textContent = config.logoIcon || "\uE700";
    }

    // 动态生成导航栏icons（传递侧栏背景色）
    console.log("🎨 准备生成导航icons:", config.navIconsBlack);
    ConfigApplier.renderNavIcons(config.navIconsBlack, config.sidebarBgColor);

    // 应用底部icon
    const bottomIcon = document.getElementById("bottom-icon");
    if (bottomIcon) {
      bottomIcon.textContent = config.bottomIcon || "\uE713";
    }

    // 应用窗口标题
    const windowTitle = document.getElementById("window-title");
    if (windowTitle) {
      windowTitle.textContent = config.windowTitle ?? "";
      if (config.enableTitleBarFont) {
        if (config.windowTitleFont) {
          windowTitle.style.fontFamily = config.windowTitleFont;
        }
        if (config.windowTitleFontSize) {
          windowTitle.style.fontSize = config.windowTitleFontSize + "px";
        }
      } else {
        windowTitle.style.fontFamily = "";
        windowTitle.style.fontSize = "";
      }
    }

    // 应用标题栏按钮
    ConfigApplier.renderTitleBarButtons(config.titleBarButtons);

    console.log("✅ 配置应用完成");
  }

  /**
   * 应用主题颜色
   * @param {string} color - HEX颜色
   */
  static applyThemeColor(color) {
    const style = document.getElementById("theme-style");
    if (!style) {
      const newStyle = document.createElement("style");
      newStyle.id = "theme-style";
      document.head.appendChild(newStyle);
    }

    const darkColor = ColorUtils.adjustColor(color, -20);
    const shadowColor = ColorUtils.hexToRgba(color, 0.4);
    const brightness = ColorUtils.getColorBrightness(color);
    const textColor = brightness > 128 ? "#000000" : "#ffffff";

    const themeStyle = document.getElementById("theme-style");
    themeStyle.innerHTML = `
      :root {
        --theme-color: ${color};
        --theme-color-dark: ${darkColor};
        --theme-color-shadow: ${shadowColor};
        --theme-text-color: ${textColor};
      }
      
      .sidebar {
        --sidebar-bg: ${ColorUtils.hexToRgba(color, 0.95)};
        --sidebar-border: ${color};
        border-right: 2px solid ${color};
      }
      
      .logo-placeholder {
        background: linear-gradient(135deg, ${color} 0%, ${darkColor} 100%);
        border-bottom: 2px solid ${color};
        color: ${textColor};
      }
      
      .info-content {
        color: ${color};
      }
      
      .config-header,
      .save-config-btn {
        color: ${textColor};
      }
      
      .config-header-close {
        color: ${textColor};
      }
      
      .footer-bar {
        background: linear-gradient(90deg, ${color} 0%, transparent 100%);
      }
      
      .music-visualizer .bar {
        background: linear-gradient(180deg, ${color}, ${ColorUtils.adjustColor(color, 1.2)});
      }
    `;

    console.log(`🎨 主题颜色已应用: ${color}, 文字颜色: ${textColor}`);
  }

  /**
   * 应用侧栏背景色并自动调整icon颜色
   * @param {string} color - RGB或HEX颜色
   */
  static applySidebarBgColor(color) {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.style.backgroundColor = color;
    }

    const brightness = ColorUtils.getColorBrightness(color);
    const iconColor = brightness > 180 ? "#000000" : "#ffffff";

    const navIcons = document.querySelectorAll(
      ".nav-icon-btn, .bottom-icon-container",
    );
    navIcons.forEach((icon) => {
      icon.style.color = iconColor;
      const infoContent = icon.querySelector(".info-content");
      if (infoContent) {
        infoContent.style.color = iconColor;
      }
    });

    const infoBoxes = document.querySelectorAll(".info-box .info-content");
    infoBoxes.forEach((box) => {
      box.style.color = iconColor;
    });

    const logoIcon = document.querySelector(".logo-placeholder");
    if (logoIcon) {
      logoIcon.style.color = brightness > 200 ? "#000000" : "#ffffff";
    }

    console.log(`🎨 侧栏背景色已应用: ${color}, Icon颜色: ${iconColor}`);
  }

  /**
   * 设置元素可见性
   * @param {string} selector - CSS选择器
   * @param {boolean} visible - 是否显示
   */
  static setVisibility(selector, visible) {
    const element =
      selector.startsWith(".") || selector.startsWith("#")
        ? document.querySelector(selector)
        : document.getElementById(selector);
    if (element) {
      if (selector === ".title-bar") {
        element.classList.toggle("hidden", !visible);
        document.body.classList.toggle("titlebar-hidden", !visible);
        return;
      }

      element.style.display = visible ? "" : "none";
    }
  }

  /**
   * 动态生成导航栏icons
   * @param {string} iconsString - 逗号分隔的icon字符串
   * @param {string} sidebarBgColor - 侧栏背景色
   */
  static renderNavIcons(iconsString, sidebarBgColor) {
    const container = document.getElementById("nav-icons-container");
    if (!container) return;

    container.innerHTML = "";

    if (!iconsString || iconsString.trim() === "") {
      return;
    }

    const icons = iconsString
      .split(",")
      .map((icon) => icon.trim())
      .filter((icon) => icon !== "");

    icons.forEach((icon, index) => {
      const button = document.createElement("button");
      button.className = "nav-icon-btn";
      button.id = `nav-icon-dynamic-${index}`;
      button.textContent = icon;
      button.style.fontFamily = "'Segoe MDL2 Assets', 'Segoe UI'";
      button.style.fontSize = "36px";
      button.style.color = "#ffffff";
      button.style.backgroundColor = "transparent";
      button.style.border = "none";
      button.style.cursor = "pointer";
      button.style.width = "80px";
      button.style.height = "80px";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.transition = "all 0.2s ease";
      button.style.borderRadius = "0";

      button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "rgba(0, 212, 255, 0.1)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "transparent";
      });

      container.appendChild(button);
    });

    // 使用传入的侧栏背景色而不是尝试从CSS变量读取
    if (sidebarBgColor) {
      ConfigApplier.applySidebarBgColor(sidebarBgColor);
    }
  }

  /**
   * 动态生成标题栏按钮
   * @param {string} buttonsString - 逗号分隔的按钮字符串
   */
  static renderTitleBarButtons(buttonsString) {
    const controlButtons = document.querySelector(
      ".title-bar .control-buttons",
    );
    if (!controlButtons) return;

    controlButtons.innerHTML = "";

    if (!buttonsString || buttonsString.trim() === "") {
      buttonsString = "&#xE921;,&#xE923;,&#xE8BB;";
    }

    const buttons = buttonsString
      .split(",")
      .map((btn) => btn.trim())
      .filter((btn) => btn !== "");
    const buttonTitles = ["Minimize", "Maximize/Restore", "Close"];

    buttons.forEach((btnChar, index) => {
      const button = document.createElement("button");
      button.className = "control-button";
      button.id = `titlebar-btn-${index}`;
      button.innerHTML = btnChar;
      button.title = buttonTitles[index] || `Button ${index + 1}`;

      controlButtons.appendChild(button);
    });
  }
}
