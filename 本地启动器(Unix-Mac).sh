#!/bin/bash
# AI 提示词与图集管理器 - macOS / Linux 极速一键启动器

# 设置终端输出颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}==========================================================${NC}"
echo -e "       ${GREEN}AI 提示词与图集管理器 - macOS/Linux 极速一键启动器${NC}"
echo -e "${BLUE}==========================================================${NC}"
echo -e "[系统检测] 正在排查本地 Node.js 环境，请稍候...\n"

# 1. 检测 Node.js
if ! command -v node &> /dev/null
then
    echo -e "${RED}【错误】未检测到本地 Node.js 运行环境！${NC}"
    echo "----------------------------------------------------"
    echo "本管理系统基于 Node.js/Vite 架构运行，您需要安装 Node.js 才能在本地使用。"
    echo "请前往官方网站下载并首装 (推荐 LTS 长期支持版):"
    echo " - 官网下载: https://nodejs.org/"
    echo "您也可以通过 Homebrew 极速安装: brew install node"
    echo "----------------------------------------------------"
    echo "安装完成后，请重新在此终端运行本启动文件。"
    exit 1
fi

NODE_VER=$(node -v)
echo -e " - 检测到 Node.js 版本: ${GREEN}${NODE_VER}${NC} (状态: 正常)"

# 2. 检查依赖包
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}【提示】未检测到依赖包 (node_modules)，正在为您进行首次自动化安装...${NC}"
    echo "由于网络下载速率异同，此过程可能需要 1-2 分钟，请稍候..."
    echo "----------------------------------------------------"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}【错误】核心依赖安装失败，请检查网络后重试手动运行 npm install${NC}"
        exit 1
    fi
    echo "----------------------------------------------------"
    echo -e "${GREEN}[状态] 所有核心依赖程序集已正常就绪！${NC}"
else
    echo -e " - 核心依赖包 (node_modules): ${GREEN}已检出${NC} (状态: 正常)"
fi

# 2.5 自动检测并释放 3000 端口占用，防止后台进程残留导致端口被锁
if command -v lsof &> /dev/null; then
    LAUNCHER_STALE_PID=$(lsof -t -i:3000)
    if [ ! -z "$LAUNCHER_STALE_PID" ]; then
        echo -e "${YELLOW}[端口释放] 检测到旧的后台服务器 PID ${LAUNCHER_STALE_PID} 仍旧占用 3000 端口${NC}"
        echo -e "           正在为您自动杀死后台残留进程，保障新工作区安全冷启动..."
        kill -9 $LAUNCHER_STALE_PID 2>/dev/null
        sleep 1
    fi
fi

# 3. 启动本地服务
echo -e "\n[启动服务] 正在在后台唤醒微型全栈专线容器..."
echo -e " - 默认本地管理端端口: ${BLUE}http://localhost:3000${NC}"
echo -e " - 稍后将尝试在默认浏览器中为您直接打开此系统入口..."
echo "----------------------------------------------------"

# 4. 启动默认浏览器打开
if command -v open &> /dev/null; then
    # macOS
    sleep 1.5
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    # Linux
    sleep 1.5
    xdg-open "http://localhost:3000"
fi

# 5. 挂起启动开发服务器
npm run dev
