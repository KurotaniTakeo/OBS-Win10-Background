/**
 * 模态框和对话框管理 - 处理首次启动、更新说明、重置确认等对话框
 */
class DialogManager {
  /**
   * 简单的Markdown转HTML转换
   * @param {string} markdown - Markdown文本
   * @returns {string} HTML文本
   */
  static markdownToHtml(markdown) {
    let html = markdown;

    const codeBlocks = [];
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const placeholder = `@@CODEBLOCK${codeBlocks.length}@@`;
      codeBlocks.push(`<pre><code>${code}</code></pre>`);
      return placeholder;
    });

    const inlineCodes = [];
    html = html.replace(/``([^`]+?)``/g, (match, code) => {
      const placeholder = `@@INLINECODE${inlineCodes.length}@@`;
      inlineCodes.push(`<code>${code}</code>`);
      return placeholder;
    });
    html = html.replace(/`([^`\n]+?)`/g, (match, code) => {
      const placeholder = `@@INLINECODE${inlineCodes.length}@@`;
      inlineCodes.push(`<code>${code}</code>`);
      return placeholder;
    });

    html = html.replace(
      /<segoe_icon>([A-Fa-f0-9]+)<\/segoe_icon>/g,
      (match, code) => {
        return `<span class="segoe-icon-wrapper">&#x${code};</span>`;
      },
    );

    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    html = html.replace(/^---$/gm, "<hr>");

    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    html = html.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+?)_/g, "<em>$1</em>");

    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank">$1</a>',
    );

    html = html.replace(/^(\d+)\. (.+)$/gm, "<___OL___><li>$2</li>");
    html = html.replace(/^\* (.+)$/gm, "<___UL___><li>$1</li>");
    html = html.replace(/^- (.+)$/gm, "<___UL___><li>$1</li>");

    html = html.replace(/(<___UL___><li>.*?<\/li>\n?)+/g, (match) => {
      return "<ul>" + match.replace(/<___UL___>/g, "") + "</ul>";
    });
    html = html.replace(/(<___OL___><li>.*?<\/li>\n?)+/g, (match) => {
      return "<ol>" + match.replace(/<___OL___>/g, "") + "</ol>";
    });

    html = html
      .split(/\n\n+/)
      .map((para) => {
        para = para.trim();
        if (
          para.match(/^<(h[1-6]|ul|ol|pre|hr|code|li|strong|em)/i) ||
          para === ""
        ) {
          return para;
        }
        if (para.match(/^<\/?(ul|ol|li)>/i)) {
          return para;
        }
        return "<p>" + para + "</p>";
      })
      .join("\n");

    html = html.replace(/\n{3,}/g, "\n\n");

    codeBlocks.forEach((code, index) => {
      html = html.replace(`@@CODEBLOCK${index}@@`, code);
    });

    inlineCodes.forEach((code, index) => {
      html = html.replace(`@@INLINECODE${index}@@`, code);
    });

    return html;
  }

  static ensureModalStyles() {
    if (document.getElementById("app-modal-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "app-modal-styles";
    style.textContent = `
      @keyframes appModalBackdropIn {
        from { opacity: 0; background: rgba(0, 0, 0, 0); }
        to { opacity: 1; background: rgba(0, 0, 0, 0.7); }
      }
      @keyframes appModalContentIn {
        from { transform: translateY(10px) scale(0.98); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes appModalBackdropOut {
        from { opacity: 1; background: rgba(0, 0, 0, 0.7); }
        to { opacity: 0; background: rgba(0, 0, 0, 0); }
      }
      @keyframes appModalContentOut {
        from { transform: translateY(0) scale(1); opacity: 1; }
        to { transform: translateY(6px) scale(0.98); opacity: 0; }
      }

      /* 统一通知/弹窗基础样式 */
      .app-toast {
        position: fixed;
        top: 20px;
        right: -400px;
        width: 380px;
        background: #2d2d2d;
        border-left: 4px solid var(--toast-accent, #0078d4);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
        z-index: 10003;
        transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.3s ease;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        overflow: hidden;
      }
      .app-toast.show {
        right: 20px;
      }
      .app-toast-icon {
        width: 32px;
        height: 32px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        flex-shrink: 0;
        margin-right: 12px;
        font-family: 'Segoe MDL2 Assets', 'Segoe UI', sans-serif;
      }
      .app-toast-title {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 6px;
        line-height: 1.3;
      }
      .app-toast-message {
        font-size: 13px;
        color: #e0e0e0;
        line-height: 1.4;
        word-wrap: break-word;
      }
      .app-toast-hint {
        font-size: 12px;
        color: #b0b0b0;
        margin-top: 6px;
      }
      .app-toast-url {
        font-size: 11px;
        color: #b0b0b0;
        margin-top: 6px;
        padding: 6px 8px;
        background: #1e1e1e;
        border: 1px solid #3a3a3a;
        font-family: 'Courier New', monospace;
        word-break: break-all;
      }
      .app-toast-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: transparent;
        border: none;
        color: #999;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        line-height: 1;
        padding: 0;
      }
      .app-toast-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      .app-toast-progress {
        position: absolute;
        bottom: 0;
        right: 0;
        height: 3px;
        width: 100%;
        background: var(--toast-accent, #0078d4);
        transform-origin: right;
      }

      /* 模态弹窗（居中对话框） */
      .app-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        animation: appModalBackdropIn 0.25s ease forwards;
      }
      .app-modal.closing {
        animation: appModalBackdropOut 0.2s ease forwards;
      }
      .app-modal-content {
        background: #1e1e1e;
        border-radius: 0;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        border: 1px solid #3a3a3a;
        opacity: 0;
        transform: translateY(10px) scale(0.98);
        animation: appModalContentIn 0.25s ease forwards;
      }
      .app-modal.closing .app-modal-content {
        animation: appModalContentOut 0.2s ease forwards;
      }
      .app-modal-header {
        padding: 14px 20px;
        border-bottom: 1px solid #3a3a3a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #1e1e1e;
      }
      .app-modal-header h2,
      .app-modal-header h3 {
        margin: 0;
        color: var(--theme-color, #0078d4);
        font-size: 16px;
        font-weight: 600;
      }
      .app-modal-close {
        background: transparent;
        border: none;
        color: #999999;
        font-size: 16px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        line-height: 1;
        padding: 0;
        font-family: 'Segoe UI', sans-serif;
      }
      .app-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      .app-modal-body {
        color: #e0e0e0;
        line-height: 1.6;
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
        font-size: 13px;
      }
      .app-modal-body h1 {
        color: var(--theme-color, #0078d4);
        margin: 0 0 16px 0;
        border-bottom: 1px solid #3a3a3a;
        padding-bottom: 8px;
        font-size: 20px;
        font-weight: 600;
      }
      .app-modal-body h2 {
        color: var(--theme-color, #0078d4);
        margin: 16px 0 8px 0;
        font-size: 16px;
        font-weight: 600;
      }
      .app-modal-body h3 {
        color: #b0b0b0;
        margin: 12px 0 6px 0;
        font-size: 14px;
        font-weight: 600;
      }
      .app-modal-body h4 {
        color: #999999;
        margin: 10px 0 4px 0;
        font-size: 13px;
        font-weight: 600;
      }
      .app-modal-body .segoe-icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe MDL2 Assets', 'Segoe UI', sans-serif;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        width: 26px;
        height: 26px;
        padding: 0;
        box-sizing: border-box;
        margin: 0 2px;
        font-size: 18px;
        line-height: 1;
        vertical-align: middle;
        color: #ffffff;
      }
      .app-modal-body code {
        background: #2d2d2d;
        padding: 2px 6px;
        border-radius: 0;
        font-family: 'Courier New', monospace;
        color: #ff9d76;
        font-size: 12px;
      }
      .app-modal-body pre {
        background: #2d2d2d;
        padding: 12px;
        border-radius: 0;
        border: 1px solid #3a3a3a;
        overflow-x: auto;
        margin: 8px 0;
      }
      .app-modal-body pre code {
        padding: 0;
        background: none;
        color: #ce9178;
      }
      .app-modal-body ul,
      .app-modal-body ol {
        margin: 8px 0;
        padding-left: 24px;
      }
      .app-modal-body li {
        margin: 4px 0;
        font-size: 13px;
      }
      .app-modal-body p {
        margin: 8px 0;
        font-size: 13px;
        line-height: 1.6;
      }
      .app-modal-body strong {
        color: var(--theme-color, #0078d4);
        font-weight: 600;
      }
      .app-modal-body a {
        color: var(--theme-color, #0078d4);
        text-decoration: none;
      }
      .app-modal-body a:hover {
        text-decoration: underline;
      }
      .app-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        border-top: 1px solid #3a3a3a;
        background: #252525;
      }
      .app-modal-btn {
        padding: 8px 24px;
        font-size: 13px;
        border: 1px solid #3a3a3a;
        border-radius: 0;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        background: #2d2d2d;
        color: #e0e0e0;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .app-modal-btn:hover {
        background: #3a3a3a;
        border-color: #4a4a4a;
      }
      .app-modal-btn-primary {
        background: var(--theme-color, #0078d4);
        color: #ffffff;
        border-color: var(--theme-color, #0078d4);
      }
      .app-modal-btn-primary:hover {
        background: var(--theme-color-dark, #106ebe);
        border-color: var(--theme-color-dark, #106ebe);
      }
      .app-modal-btn-danger {
        background: #e81123;
        color: #ffffff;
        border-color: #e81123;
      }
      .app-modal-btn-danger:hover {
        background: #f24545;
        border-color: #f24545;
      }
    `;
    document.head.appendChild(style);
  }

  static createModalShell({ title, maxWidth = "800px", maxHeight = "80vh" }) {
    DialogManager.ensureModalStyles();

    const modal = document.createElement("div");
    modal.className = "app-modal";

    const content = document.createElement("div");
    content.className = "app-modal-content";
    content.style.maxWidth = maxWidth;
    content.style.maxHeight = maxHeight;

    const headerDiv = document.createElement("div");
    headerDiv.className = "app-modal-header";
    headerDiv.innerHTML = `
      <h2>${title}</h2>
      <button class="app-modal-close" aria-label="关闭">✕</button>
    `;

    const bodyDiv = document.createElement("div");
    bodyDiv.className = "app-modal-body";

    const footerDiv = document.createElement("div");
    footerDiv.className = "app-modal-footer";
    content.appendChild(headerDiv);
    content.appendChild(bodyDiv);
    content.appendChild(footerDiv);
    modal.appendChild(content);
    document.body.appendChild(modal);

    const closeBtn = headerDiv.querySelector(".app-modal-close");
    closeBtn.addEventListener("click", () => {
      DialogManager.closeModal(modal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        DialogManager.closeModal(modal);
      }
    });

    return { modal, content, headerDiv, bodyDiv, footerDiv };
  }

  static closeModal(modal) {
    if (!modal) return;
    modal.classList.add("closing");
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 200);
  }

  static getDefaultHelpContent() {
    return [
      "# 使用说明",
      "",
      "## 快速开始",
      "",
      "1. 在浏览器中打开 **配置页面** 设置各项外观参数",
      "2. 点击 **保存配置** 保存到服务器",
      "3. 在 OBS 中添加 **浏览器源**，URL 填 `http://localhost:3000/`",
      "4. 将浏览器源的 **宽度和高度** 设置为你的 OBS 画布分辨率",
      "",
      "## 图标设置",
      "",
      "本项目使用 Windows 内置的 **Segoe MDL2 Assets** 字体来渲染图标，",
      "每个图标对应一个 Unicode 码位（如 `&#xE713;` 表示设置齿轮图标）。",
      "",
      "- **Mac 用户**请先下载安装字体：[获取 Segoe 字体](https://aka.ms/SegoeFonts)",
      "- 图标使用 HTML 实体格式输入，如 `&#xE713;`",
      "- 图标列表参考：[Microsoft Docs](https://learn.microsoft.com/zh-cn/windows/apps/design/iconography/segoe-ui-symbol-font)",
      "",
      "常用图标：",
      "- <segoe_icon>E700</segoe_icon> 导航按钮",
      "- <segoe_icon>E713</segoe_icon> 设置",
      "- <segoe_icon>E7FC</segoe_icon> 游戏",
      "- <segoe_icon>E8BD</segoe_icon> 消息",
      "- <segoe_icon>E90B</segoe_icon> 音乐",
      "- <segoe_icon>E921</segoe_icon> 最小化",
      "- <segoe_icon>E923</segoe_icon> 最大化",
      "- <segoe_icon>E8BB</segoe_icon> 关闭",
      "- <segoe_icon>E713</segoe_icon> 设置",
      "",
      "## 配置页面布局",
      "",
      "- **全局外观**：主题颜色、字体名称",
      "- **侧栏设置**：侧栏背景色、Logo 图标、导航图标、底部图标",
      "- **标题栏设置**：显示/隐藏、窗口标题、字体设置、按钮",
      "- **关于**：版本信息、快速操作",
      "",
      "## 快捷键",
      "",
      "配置页面 `Ctrl+S` 保存配置",
    ].join("\n");
  }

  static getDefaultChangelogContent() {
    return [
      "# 更新说明",
      "",
      "## v1.0.6",
      "",
      "- 重构：场景页与配置页分离",
      "- 配置页改为全页面布局，左侧导航 + 右侧内容",
      "- 统一弹窗和通知样式",
      "- 更新 Segoe MDL2 Assets 图标支持",
      "",
      "## v1.0.5 及更早",
      "",
      "- Windows 10 WinUI 风格 OBS 直播背景",
      "- 支持自定义主题色、侧栏外观、标题栏",
      "- 支持 Segoe MDL2 Assets 图标字体",
      "- 零依赖 Node.js 配置服务器",
    ].join("\n");
  }

  static async showFirstLaunchModal(onConfirm) {
    let helpContent = null;
    try {
      const response = await fetch("/docs/README.md");
      if (response.ok) {
        helpContent = await response.text();
      }
    } catch (err) {
      console.log("📖 使用在线帮助内容");
    }

    if (!helpContent) {
      helpContent = DialogManager.getDefaultHelpContent();
    }

    const htmlContent = DialogManager.markdownToHtml(helpContent);

    const { modal, bodyDiv, footerDiv } = DialogManager.createModalShell({
      title: "使用说明",
      maxWidth: "800px",
      maxHeight: "80vh",
    });

    bodyDiv.innerHTML = htmlContent;

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "app-modal-btn app-modal-btn-primary";
    confirmBtn.textContent = "我已了解，开始使用 →";
    confirmBtn.addEventListener("click", async () => {
      DialogManager.closeModal(modal);
      if (onConfirm) await onConfirm();
    });

    footerDiv.appendChild(confirmBtn);
  }

  static async showChangelogModal() {
    let changelogContent = null;
    try {
      const response = await fetch("/docs/CHANGELOG.md");
      if (response.ok) {
        changelogContent = await response.text();
      }
    } catch (err) {
      console.log("📝 使用内置更新说明");
    }

    if (!changelogContent) {
      changelogContent = DialogManager.getDefaultChangelogContent();
    }

    const htmlContent = DialogManager.markdownToHtml(changelogContent);

    const { modal, bodyDiv, footerDiv } = DialogManager.createModalShell({
      title: "更新说明",
      maxWidth: "700px",
      maxHeight: "70vh",
    });

    bodyDiv.innerHTML = htmlContent;

    const closeBtn = document.createElement("button");
    closeBtn.className = "app-modal-btn";
    closeBtn.textContent = "关闭";
    closeBtn.addEventListener("click", () => {
      DialogManager.closeModal(modal);
    });

    footerDiv.appendChild(closeBtn);
  }

  static showResetConfirmDialog(onConfirm) {
    const { modal, bodyDiv, footerDiv } = DialogManager.createModalShell({
      title: "恢复默认配置",
      maxWidth: "450px",
      maxHeight: "60vh",
    });

    bodyDiv.innerHTML = `
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #b0b0b0;">
        此操作将恢复所有配置为默认值，当前的自定义配置将被覆盖。
      </p>
      <p style="margin: 0; font-size: 13px; color: #ff9999; font-weight: 500;">
        ⚠️ 此操作无法撤销，请确认后继续。
      </p>
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.id = "reset-cancel";
    cancelBtn.className = "app-modal-btn";
    cancelBtn.textContent = "取消";
    cancelBtn.addEventListener("click", () => {
      DialogManager.closeModal(modal);
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.id = "reset-confirm";
    confirmBtn.className = "app-modal-btn app-modal-btn-danger";
    confirmBtn.textContent = "确认恢复";
    confirmBtn.addEventListener("click", async () => {
      DialogManager.closeModal(modal);
      if (onConfirm) await onConfirm();
    });

    footerDiv.appendChild(cancelBtn);
    footerDiv.appendChild(confirmBtn);
  }

  static showUpdateConfirmDialog({
    currentVersion,
    latestVersion,
    releaseUrl,
    themeColor = "#0078d4",
  }) {
    return new Promise((resolve) => {
      const { modal, bodyDiv, footerDiv } = DialogManager.createModalShell({
        title: "发现新版本",
        maxWidth: "520px",
        maxHeight: "70vh",
      });

      modal.style.setProperty("--theme-color", themeColor);
      bodyDiv.innerHTML = `
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #e0e0e0;">
          检测到新版本可用，是否现在下载并更新前端资源？
        </p>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #b0b0b0;">
          当前版本：<strong>${currentVersion || "未知"}</strong><br>
          最新版本：<strong>${latestVersion || "未知"}</strong>
        </p>
        <p style="margin: 0; font-size: 12px; color: #999;">
          更新将替换 public/ 目录并自动重启服务器。
        </p>
        ${
          releaseUrl
            ? `<p style="margin: 10px 0 0 0; font-size: 12px;">
                 <a href="${releaseUrl}" target="_blank">查看更新说明</a>
               </p>`
            : ""
        }
      `;

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "app-modal-btn";
      cancelBtn.textContent = "稍后再说";
      cancelBtn.addEventListener("click", () => {
        DialogManager.closeModal(modal);
        resolve(false);
      });

      const confirmBtn = document.createElement("button");
      confirmBtn.className = "app-modal-btn app-modal-btn-primary";
      confirmBtn.textContent = "立即更新";
      confirmBtn.addEventListener("click", () => {
        DialogManager.closeModal(modal);
        resolve(true);
      });

      footerDiv.appendChild(cancelBtn);
      footerDiv.appendChild(confirmBtn);
    });
  }
}
