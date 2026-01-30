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

    // 处理代码块（先处理，避免被其他规则影响）
    const codeBlocks = [];
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const placeholder = `@@CODEBLOCK${codeBlocks.length}@@`;
      codeBlocks.push(`<pre><code>${code}</code></pre>`);
      return placeholder;
    });

    // 处理行内代码（保护代码不被处理）
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

    // 处理 <segoe_icon> 标签（在其他规则之前处理）
    html = html.replace(/<segoe_icon>([A-Fa-f0-9]+)<\/segoe_icon>/g, (match, code) => {
      return `<span class="segoe-icon-wrapper">&#x${code};</span>`;
    });

    // 处理标题（从h4到h1，避免冲突）
    html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // 处理水平线
    html = html.replace(/^---$/gm, "<hr>");

    // 处理加粗（在斜体之前）
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // 处理斜体
    html = html.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+?)_/g, "<em>$1</em>");

    // 处理链接
    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank">$1</a>',
    );

    // 处理列表项
    html = html.replace(/^(\d+)\. (.+)$/gm, "<___OL___><li>$2</li>");
    html = html.replace(/^\* (.+)$/gm, "<___UL___><li>$1</li>");
    html = html.replace(/^- (.+)$/gm, "<___UL___><li>$1</li>");

    // 包装连续的列表项
    html = html.replace(/(<___UL___><li>.*?<\/li>\n?)+/g, (match) => {
      return "<ul>" + match.replace(/<___UL___>/g, "") + "</ul>";
    });
    html = html.replace(/(<___OL___><li>.*?<\/li>\n?)+/g, (match) => {
      return "<ol>" + match.replace(/<___OL___>/g, "") + "</ol>";
    });

    // 处理段落
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

    // 清理多余的换行
    html = html.replace(/\n{3,}/g, "\n\n");

    // 恢复代码块
    codeBlocks.forEach((code, index) => {
      html = html.replace(`@@CODEBLOCK${index}@@`, code);
    });

    // 恢复内联代码
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
        padding: 12px 16px;
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
        font-size: 14px;
        font-weight: 500;
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
      }
      .app-modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      .app-modal-body {
        color: #e0e0e0;
        line-height: 1.5;
        padding: 16px 20px;
        overflow-y: auto;
        flex: 1;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
        font-size: 13px;
      }
      .app-modal-body h1 {
        color: var(--theme-color, #0078d4);
        margin: 0 0 16px 0;
        border-bottom: 1px solid #3a3a3a;
        padding-bottom: 0;
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
        font-family: 'Segoe MDL2 Assets', sans-serif;
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
      }
      .app-modal-body pre {
        background: #2d2d2d;
        padding: 10px;
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
        line-height: 1.5;
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
        padding: 12px 16px;
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

  /**
   * 显示首次启动帮助模态框
   * @param {Function} onConfirm - 确认回调函数
   */
  static async showFirstLaunchModal(onConfirm) {
    try {
      const response = await fetch("/README.md");
      if (!response.ok) {
        throw new Error("无法加载帮助文档");
      }
      const helpContent = await response.text();
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
    } catch (error) {
      console.error("❌ 显示帮助模态框失败:", error);
    }
  }

  /**
   * 显示更新说明弹窗
   */
  static async showChangelogModal() {
    try {
      const response = await fetch("/CHANGELOG.md");
      if (!response.ok) {
        throw new Error("无法加载更新说明");
      }
      const changelog = await response.text();
      const htmlContent = DialogManager.markdownToHtml(changelog);

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
    } catch (error) {
      console.error("❌ 显示更新说明失败:", error);
    }
  }

  /**
   * 显示恢复默认配置确认对话框
   * @param {Function} onConfirm - 确认回调函数
   */
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
}
