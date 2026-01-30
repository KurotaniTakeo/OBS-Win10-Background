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

REM 检查 npm 和 Node.js
echo [信息] 正在检查 Node.js 和 npm...
node --version >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装 Node.js
  echo [错误] 访问 https://nodejs.org/ 下载安装
  pause
  exit /b 1
)

REM 检查 node_modules 是否存在
if not exist "node_modules" (
  echo [信息] 依赖包未安装，正在执行 npm install...
  call npm install
  if errorlevel 1 (
    echo [错误] npm install 失败
    pause
    exit /b 1
  )
  echo [成功] 依赖包安装完成
) else (
  echo [信息] 依赖包已存在
)

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
