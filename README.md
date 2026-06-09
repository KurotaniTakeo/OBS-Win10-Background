<p align="center">
  <h1 align="center">Windows 10 风格 Fluent Design 直播间场景</h1>
  <p align="center">
    一个为 OBS 设计的直播间背景模板，采用 Windows 10 Fluent Design 风格
    <br />
    支持多配置切换、主题色自定义、图标配置等功能
    <br />
    <br />
    <a href="#快速开始"><strong>快速开始 »</strong></a>
    ·
    <a href="#自定义">自定义</a>
    ·
    <a href="#常见问题">常见问题</a>
  </p>
</p>

## 关于项目

一个为 OBS Studio 设计的直播间背景模板，复刻 Windows 10 时期的 Fluent Design 风格 UI，通过内置的配置页面支持外观自定义。

> **注：** 本项目的绝大部分内容由 AI 协助开发

## 功能特性

- Windows 10 Fluent Design 风格界面
- 内置配置页面，浏览器中即可完成所有设置
- 多配置管理：创建、切换、复制、重命名、删除配置
- 自定义主题颜色
- 自定义侧栏背景色、Logo、导航图标、底部图标
- 标题栏显示/隐藏及字体独立设置
- 自动检测端口占用并切换
- 跨平台支持：Windows / macOS / Linux

## 快速开始

### 前置要求

- Node.js 14.0+（推荐最新 LTS 版本）
- OBS Studio 27.0+（推荐最新版本）

### 启动服务器

**Windows：** 双击 `启动服务器.bat`

**macOS：** 双击 `启动服务器.command`（首次运行前可能需要执行 `chmod +x "启动服务器.command"`）

**Linux：** 在终端中运行 `bash 启动服务器.sh`

**通用方式：** 也可以手动执行：
```bash
npm install
npm start
```

服务器启动后会自动打开浏览器进入配置页面。默认端口 `3000`，如被占用会自动尝试 `3001`-`3009`。

### 在 OBS 中添加浏览器源

1. 打开 OBS Studio，在场景中点击 **+** 添加 **浏览器** 源
2. URL 填入服务器地址（配置页面顶部有复制按钮），例如：`http://localhost:3000`
3. 宽度和高度设置为你的 OBS 画布分辨率（推荐 1920×1080）
4. 勾选 **关闭源时刷新浏览器** 以节省资源
5. 建议启用自定义帧速率（60fps）

> **提示：** 先在浏览器中完成配置并保存，再在 OBS 中刷新浏览器源即可看到效果。

## 自定义

所有自定义操作均通过配置页面完成。启动服务器后浏览器会自动打开配置页，也可以手动访问 `http://localhost:3000/config`。

### 全局外观

- **主题颜色** — 配置页面标题栏等元素的强调色
- **字体名称** — 全局后备字体

### 侧栏设置

- **侧栏背景色**
- **顶部 Logo Icon** — 使用 Segoe MDL2 Assets 字体的 Unicode 字符
- **导航栏图标** — 多个图标用逗号分隔，逗号表示空位
- **底部图标**

### 标题栏设置

- **显示/隐藏标题栏**
- **窗口标题** — 自定义标题文字
- **独立字体设置** — 标题栏可使用独立的字体和字号
- **标题栏按钮** — 自定义最小化、最大化、关闭按钮图标

> **关于 Segoe MDL2 Assets 字体：** 图标使用 Windows 内置的 Segoe MDL2 Assets 字体，采用 HTML 实体格式（如 `&#xE713;`）。Mac 用户需[下载字体](https://aka.ms/SegoeFonts)后安装。参考：[Microsoft Docs](https://learn.microsoft.com/zh-cn/windows/apps/design/iconography/segoe-ui-symbol-font)

## 配置管理

配置页面支持多配置管理，可以创建多套不同的配置方案并随时切换。

- **新建** — 创建空白配置
- **切换** — 从下拉菜单选择，切换后自动应用
- **复制** — 基于当前配置创建副本
- **重命名** — 修改配置名称（默认配置除外）
- **删除** — 删除配置（默认配置不可删除）
- **保存** — 按 `Ctrl+S` 或点击页面底部的保存按钮

## 常见问题

**Q: 配置页面和 OBS 中显示的页面有什么区别？**

A: `/config` 是配置页面，用于编辑外观设置；`/`（根路径）是 OBS 浏览器源使用的场景页面，只显示背景效果，不显示配置面板。

**Q: 如何在 Mac/Linux 上使用？**

A: 运行对应的启动脚本（`启动服务器.command` 或 `启动服务器.sh`）。图标字体 Segoe MDL2 Assets 是 Windows 内置字体，Mac 用户需手动[下载安装](https://aka.ms/SegoeFonts)。

**Q: 端口被占用怎么办？**

A: 服务器会自动尝试下一个端口（最多尝试 10 次）。也可以通过环境变量指定端口：`PORT=8080 npm start`。

**Q: 配置保存在哪里？**

A: 用户配置保存在 `configs/config.json`，默认配置在 `configs/config.default.json`。旧版本的配置文件会自动迁移到新位置。

**Q: 如何恢复默认配置？**

A: 在配置页面的「关于」标签页中点击「恢复默认配置」。

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/KurotaniTakeo/OBS-Win10-Background/issues)
- 发起 [Discussion](https://github.com/KurotaniTakeo/OBS-Win10-Background/discussions)

---

<p align="center">
  如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！
</p>
