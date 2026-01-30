#!/usr/bin/env bash
set -euo pipefail

# OBS 直播背景服务器（macOS 双击运行）
# 提示：首次运行前可执行：chmod +x "启动服务器.command"

cd "$(dirname "$0")"

printf "\n================================================\n"
printf "   OBS 直播背景服务器\n"
printf "================================================\n\n"
printf "[信息] 正在启动服务器...\n"
printf "[提示] 服务器启动后将自动打开浏览器\n"
printf "[提示] 请保持此窗口运行\n"
printf "[提示] 按 Ctrl+C 可以停止服务器\n\n"
printf "================================================\n\n"

node src/server.js

printf "\n[信息] 服务器已停止\n\n"
