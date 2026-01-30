#!/usr/bin/env bash
set -euo pipefail

# OBS 直播背景服务器（macOS 双击运行）
# 提示：首次运行前可执行：chmod +x "启动服务器.command"

cd "$(dirname "$0")"

printf "\n================================================\n"
printf "   OBS 直播背景服务器\n"
printf "================================================\n\n"

# 检查 Node.js 和 npm
printf "[信息] 正在检查 Node.js 和 npm...\n"
if ! command -v node &> /dev/null; then
  printf "[错误] 未找到 Node.js，请先安装 Node.js\n"
  printf "[错误] 访问 https://nodejs.org/ 下载安装\n"
  read -p "按 Enter 键关闭此窗口..."
  exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
  printf "[信息] 依赖包未安装，正在执行 npm install...\n"
  npm install || {
    printf "[错误] npm install 失败\n"
    read -p "按 Enter 键关闭此窗口..."
    exit 1
  }
  printf "[成功] 依赖包安装完成\n"
else
  printf "[信息] 依赖包已存在\n"
fi

printf "\n[信息] 正在启动服务器...\n"
printf "[提示] 服务器启动后将自动打开浏览器\n"
printf "[提示] 请保持此窗口运行\n"
printf "[提示] 按 Ctrl+C 可以停止服务器\n\n"
printf "================================================\n\n"

node src/server.js

printf "\n[信息] 服务器已停止\n\n"
