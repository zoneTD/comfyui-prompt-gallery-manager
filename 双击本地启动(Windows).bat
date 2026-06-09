@echo off
rem Set console encoding to UTF-8 to display Chinese text correctly
chcp 65001 >nul
title AI 提示词与图集管理器 - 本地极速启动器
color 0b

echo ==========================================================
echo       AI 提示词与图集管理器 - 本地极速一键启动器
echo ==========================================================
echo [系统检测] 正在检查本地运行环境，请稍候...
echo.

rem Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo 【错误】未检测到本地 Node.js 运行环境！
    echo ----------------------------------------------------
    echo 本管理系统基于 Node.js/Vite 架构运行，您需要安装 Node.js 才能在本地使用。
    echo 请前往官方网站下载并安装 (推荐 LTS 长期支持版):
    echo - 官网下载: https://nodejs.org/
    echo ----------------------------------------------------
    echo 安装完成后，请重新双击运行本启动器文件。
    pause
    exit
)

rem Get Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo - 检测到 Node.js 版本: %NODE_VER% (状态: 正常)

rem Check if node_modules exists, if not run npm install
if not exist "node_modules\" (
    echo.
    echo 【提示】未检测到依赖库依赖包 (node_modules)，正在为您进行首次自动化安装...
    echo 这是首次运行前的必要准备步骤，由于网络传输可能需要1-3分钟，请耐心等待...
    echo ----------------------------------------------------
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo.
        echo 【错误】依赖安装失败！请检查您的网络连接或尝试手动执行 "npm install"。
        pause
        exit
    )
    echo ----------------------------------------------------
    echo [状态] 所有核心依赖包已就绪！
) else (
    echo - 核心依赖包 (node_modules): 已检出 (状态: 正常)
)

rem Release port 3000 if occupied to prevent EADDRINUSE errors
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo [端口释放] 检测到旧的后台管理进程 PID %%a 仍旧占用 3000 端口
    echo             正在为您自动终结与释放端口，保障全新工作区无缝启动...
    taskkill /f /pid %%a >nul 2>&1
)

rem Start modern local server dev environment
echo.
echo [启动服务] 正在呼叫本地微型容器服务引擎...
echo - 访问地址: http://localhost:3000
echo - 稍后将自动为您在默认浏览器中开启本系统...
echo ----------------------------------------------------

rem Launch browser after a short delay and run dev server
start "" "http://localhost:3000"
npm run dev

pause
