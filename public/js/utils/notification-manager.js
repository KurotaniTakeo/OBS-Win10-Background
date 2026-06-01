/**
 * 通知系统 - 处理所有提示和通知（toast 风格，右下角弹出）
 * 使用 DialogManager.ensureModalStyles() 中的统一 .app-toast 样式
 */
class NotificationManager {
  constructor() {
    this.notificationContainer = [];
  }

  _createToast({ accentColor, icon, title, message, hint, urlDisplay, duration }) {
    DialogManager.ensureModalStyles();

    const toast = document.createElement("div");
    toast.className = "app-toast";
    toast.style.setProperty("--toast-accent", accentColor);

    const bodyHtml = [
      '<div style="display: flex; padding: 16px 16px 12px 16px; align-items: flex-start; position: relative;">',
      `<div class="app-toast-icon" style="background: ${accentColor};">${icon}</div>`,
      '<div style="flex: 1; min-width: 0;">',
      title ? `<div class="app-toast-title">${title}</div>` : "",
      message ? `<div class="app-toast-message">${message}</div>` : "",
      hint ? `<div class="app-toast-hint">${hint}</div>` : "",
      urlDisplay ? `<div class="app-toast-url">${urlDisplay}</div>` : "",
      "</div>",
      '<button class="app-toast-close">✕</button>',
      "</div>",
      '<div class="app-toast-progress"></div>',
    ].join("");

    toast.innerHTML = bodyHtml;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    const progressBar = toast.querySelector(".app-toast-progress");
    const closeBtn = toast.querySelector(".app-toast-close");

    const notificationObj = {
      element: toast,
      progressBar: progressBar,
      startTime: Date.now(),
      duration: duration,
      elapsedBeforePause: 0,
      isPaused: false,
      timer: null,
    };

    this.notificationContainer.push(notificationObj);
    this.updateNotificationPositions();

    const startCountdown = () => {
      if (notificationObj.isPaused) return;
      const elapsed = Date.now() - notificationObj.startTime;
      const progress = Math.min(elapsed / duration, 1);
      progressBar.style.transform = `scaleX(${1 - progress})`;
      if (progress >= 1) {
        this.removeNotification(notificationObj);
      } else {
        notificationObj.timer = requestAnimationFrame(startCountdown);
      }
    };

    toast.addEventListener("mouseenter", () => {
      if (notificationObj.isPaused) return;
      notificationObj.isPaused = true;
      notificationObj.elapsedBeforePause = Date.now() - notificationObj.startTime;
      if (notificationObj.timer) {
        cancelAnimationFrame(notificationObj.timer);
        notificationObj.timer = null;
      }
      progressBar.style.transition = "none";
    });

    toast.addEventListener("mouseleave", () => {
      if (!notificationObj.isPaused) return;
      notificationObj.isPaused = false;
      notificationObj.startTime = Date.now() - notificationObj.elapsedBeforePause;
      startCountdown();
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeNotification(notificationObj);
    });

    startCountdown();
    return notificationObj;
  }

  showSaveNotification(
    success = true,
    message = "配置已保存",
    themeColor = "#0078d4",
  ) {
    this._createToast({
      accentColor: success ? themeColor : "#e81123",
      icon: success ? "✓" : "✕",
      title: success ? "OBS Windows 10 Background" : "操作失败",
      message: message,
      hint: success ? "刷新页面查看新配置" : "请运行: npm start",
      duration: 3000,
    });
  }

  showCopyUrlNotification(url, themeColor = "#0078d4") {
    this._createToast({
      accentColor: themeColor,
      icon: "✓",
      title: "OBS Windows 10 Background",
      message: "已复制，请前往OBS中使用",
      urlDisplay: url,
      duration: 3000,
    });
  }

  showUpdateNotification({
    currentVersion,
    latestVersion,
    releaseUrl,
    themeColor = "#0078d4",
  }) {
    this._createToast({
      accentColor: themeColor,
      icon: "⬆",
      title: "发现新版本",
      message: `当前 ${currentVersion} → 最新 ${latestVersion}`,
      duration: 8000,
    });
  }

  showUpdateStatusNotification({
    title,
    message,
    themeColor = "#0078d4",
    isError = false,
  }) {
    this._createToast({
      accentColor: isError ? "#e81123" : themeColor,
      icon: isError ? "✕" : "✓",
      title: title,
      message: message,
      duration: 3500,
    });
  }


  updateNotificationPositions() {
    if (!this.notificationContainer) return;
    let topOffset = 20;
    this.notificationContainer.forEach((notif) => {
      notif.element.style.top = `${topOffset}px`;
      topOffset += notif.element.offsetHeight + 10;
    });
  }

  removeNotification(notificationObj) {
    if (!notificationObj || !notificationObj.element) return;
    if (notificationObj.timer) {
      cancelAnimationFrame(notificationObj.timer);
    }

    notificationObj.element.classList.remove("show");
    notificationObj.element.style.right = "-400px";

    setTimeout(() => {
      if (notificationObj.element.parentNode) {
        document.body.removeChild(notificationObj.element);
      }
      if (this.notificationContainer) {
        const index = this.notificationContainer.indexOf(notificationObj);
        if (index > -1) {
          this.notificationContainer.splice(index, 1);
        }
        this.updateNotificationPositions();
      }
    }, 300);
  }

  /**
   * 显示配置切换成功通知
   * @param {string} themeColor - 主题颜色
   */
  showProfileSwitchNotification(themeColor = "#0078d4") {
    const notification = document.createElement("div");
    const bgColor = "#2d2d2d";
    const accentColor = themeColor;
    const icon = "✓";
    const duration = 3000;

    const lightenColor = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = Math.min(255, ((rgb >> 16) & 255) + 40);
      const g = Math.min(255, ((rgb >> 8) & 255) + 40);
      const b = Math.min(255, (rgb & 255) + 40);
      return `rgb(${r}, ${g}, ${b})`;
    };
    const lightAccentColor = lightenColor(accentColor);

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: -400px;
      width: 360px;
      background: ${bgColor};
      border-left: 4px solid ${accentColor};
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), inset 3px 3px 0 0 ${lightAccentColor}, inset -3px -3px 0 0 ${lightAccentColor}, inset 3px -3px 0 0 ${lightAccentColor}, inset -3px 3px 0 0 ${lightAccentColor};
      z-index: 10003;
      transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.3s ease;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    `;

    notification.innerHTML = `
      <div style="display: flex; padding: 16px 16px 12px 16px; align-items: flex-start; position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background: ${accentColor};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          flex-shrink: 0;
          margin-right: 12px;
        ">${icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 6px;
            line-height: 1.3;
          ">配置切换成功</div>
          <div style="
            font-size: 13px;
            color: #e0e0e0;
            line-height: 1.4;
            word-wrap: break-word;
          ">配置已切换，外观已更新</div>
        </div>
        <button class="toast-close-btn" style="
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
        " onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='#999';">✕</button>
      </div>
      <div class="toast-progress-bar" style="
        position: absolute;
        bottom: 0;
        right: 0;
        height: 3px;
        width: 100%;
        background: ${accentColor};
        transform-origin: right;
      "></div>
    `;

    document.body.appendChild(notification);

    const progressBar = notification.querySelector(".toast-progress-bar");
    const closeBtn = notification.querySelector(".toast-close-btn");

    const notificationObj = {
      element: notification,
      progressBar: progressBar,
      startTime: Date.now(),
      duration: duration,
      elapsedBeforePause: 0,
      isPaused: false,
      timer: null,
    };

    this.notificationContainer.push(notificationObj);
    this.updateNotificationPositions();

    requestAnimationFrame(() => {
      notification.style.right = "20px";
    });

    const startCountdown = () => {
      if (notificationObj.isPaused) return;

      const elapsed = Date.now() - notificationObj.startTime;
      const progress = Math.min(elapsed / duration, 1);

      progressBar.style.transform = `scaleX(${1 - progress})`;

      if (progress >= 1) {
        this.removeNotification(notificationObj);
      } else {
        notificationObj.timer = requestAnimationFrame(startCountdown);
      }
    };

    notification.addEventListener("mouseenter", () => {
      if (notificationObj.isPaused) return;
      notificationObj.isPaused = true;
      notificationObj.elapsedBeforePause =
        Date.now() - notificationObj.startTime;

      if (notificationObj.timer) {
        cancelAnimationFrame(notificationObj.timer);
        notificationObj.timer = null;
      }
      progressBar.style.transition = "none";
    });

    notification.addEventListener("mouseleave", () => {
      if (!notificationObj.isPaused) return;
      notificationObj.isPaused = false;
      notificationObj.startTime =
        Date.now() - notificationObj.elapsedBeforePause;
      startCountdown();
    });

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeNotification(notificationObj);
    });

    startCountdown();
  }
}
