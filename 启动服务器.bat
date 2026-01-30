@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"
title OBS 直播背景服务器
color 0A
echo.
echo ================================================
echo    OBS 直播背景服务器
echo ================================================
echo.
echo [信息] 正在启动服务器...
echo [提示] 服务器启动后将自动打开浏览器
echo [提示] 请保持此窗口运行
echo [提示] 按 Ctrl+C 可以停止服务器
echo.
echo ================================================
echo.

node src\server.js

echo.
echo [信息] 服务器已停止
echo.
pause
