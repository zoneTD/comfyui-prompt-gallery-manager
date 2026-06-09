# 🎨 AI 提示词与图集管理器 • AI Prompt & Image Gallery Manager

[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-6474f2?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-Powered-E57C23?style=flat-square&logo=googlegemini)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

*Read this in [简体中文](#-简体中文) | [English](#-english)*

---

## 🇨🇳 简体中文

**AI 提示词与图集管理器** 是一个专为 AI 绘图玩家和创意工作者打造的多功能、端到端的高级管理工具。它集成了 **本地隔离安全账户沙盒**、**多模态 AI 图像反推与分析**、**中英文双语图集收纳**、**一键复制/全选** 等高阶体验，帮助您极速整理 AI 生图资产，不再迷失于繁杂的文件和凌乱的记事本中。

### ✨ 核心亮点

*   **🔒 用户级沙盒与免密锁定**:
    *   纯本地沙盒存储，无需云端托管！多用户本地注册，账号数据**物理级隔离**。
    *   提供“安全退出/安全锁库”机制。一键退出即可隐蔽所有提示词卡片和灵感资产。
*   **👁️ Gemini 多模态 AI 画面深度反推**:
    *   *高级视觉多模态能力*：任意拖拽/上传本地图像至分析面板，一键交由 Gemini 进行微米级视觉拆解。
    *   *中文优先提示词逆向重构*：自动拆解画面主体、材质、光影、镜头参数、艺术流派，并逆向逆向输出**深度优化的高质量中文绘图提示词**。如果是离线/未配置 Key 状态，提供高保真相拟仿真模式。
*   **📂 精细化图集灵感整理**:
    *   按主题卡片（创意、背景、人物、科技、赛博朋克等）或自动分析标签一键聚合和分类。
    *   每一张图集卡片贴心提供“一键全选”、“一键复制 [绘图提示词/画面分析描述]”，支持提示词自定义微调。
*   **🛠️ 极易上手的本地 Launcher (百宝箱)**:
    *   内置为 Windows 配置的 `双击本地启动.bat` 及为 macOS/Linux 配置的 `本地启动器.sh`。
    *   双击自检并一键直连浏览器 `http://localhost:3000`，省去敲打复杂命令的大量步骤。

---

### 🚀 本地运行与安装

#### 1. 前提环境
确保您的设备已经安装了 **Node.js**:
*   **推荐版本**: Node.js **v18 / v20 / v22+**
*   **验证安装**: 在终端运行 `node -v`，如正常显示版本号即可。

#### 2. 配置环境变量 (用于解锁真 AI 视觉反推功能)
如果想使用真实的 Gemini 多模态反插提示词功能，您需要在当前根目录下创建一个名为 `.env` 的文件（可复制并重命名 `.env.example`）：
```env
# 在下方填入您的 Gemini API Key
GEMINI_API_KEY=您的_GEMINI_API_密钥
```
*(若不配置，系统将进入高性能单机仿真运行状态，您仍可体验核心功能。)*

#### 3. 极速一键启动
*   **Windows 用户**:
    *   直接双击运行根目录下的 `双击本地启动(Windows).bat`。
    *   启动器会自动检测环境，并在一秒内拉起应用和默认浏览器直连 `http://localhost:3000`。
*   **macOS / Linux 用户**:
    *   打开终端（Terminal）进入到当前项目根目录，赋予运行权限：
        ```bash
        chmod +x 本地启动器(Unix-Mac).sh
        ```
    *   双击或在终端运行：
        ```bash
        ./本地启动器(Unix-Mac).sh
        ```

#### 4. 开发/手动命令行运行
您也可以使用纯命令拉起本工程：
```bash
# 1. 安装项目所有本地依赖
npm install

# 2. 启动开发环境热更新服务器
npm run dev

# 3. 生产打包环境构建与测试编译
npm run build

# 4. 运行编译完成的生产级服务
npm start
```
登录/注册您的本地账户，即可立即开始本地私密大图与提示词存储之旅！

---

## 🇺🇸 English

**AI Prompt & Image Gallery Manager** is a high-performance, private-first visual manager designed for AI artists, designers, and prompt engineers. It brings together **isolated secure sandboxed accounts**, **multimodal AI vision reverse-prompting**, **prompt refactoring to optimized Chinese outputs**, **one-click copy**, and beautiful interactive layouts. Maintain clean, searchable, and highly organized references for of your artwork collection.

### ✨ Key Features

*   **🔒 Private Multi-Account Sandbox**:
    *   Keep your artistic creative assets strictly on your local device. Fully **isolated workspace databases** per local user account.
    *   "Clear/Logout Lock" system ensures that your gallery assets are secure and strictly unavailable to domestic lookers-on next to you without your credential passcode.
*   **👁️ Advanced Gemini Multimodal Prompt Reverse-Engineering**:
    *   *State-of-the-Art Analysis*: Drag and drop/upload any artwork image to analyze its focal point, art movement/styles, camera setup, lighting, and textures.
    *   *Chinese AI Art Prompts*: Automatically reconstructs instructions optimized for platforms like DALL-E, Midjourney, and Stable Diffusion **returned entirely in refined Chinese** for optimized nuances.
*   **📂 Multi-Category Folder Organizers**:
    *   Assign categories and labels seamlessly. Search dynamically by prompt keyword, tag, or art style.
    *   Includes fast macro actions: "[Select All]" textboxes & "[One-Click Copy]" of the prompt string to paste instantly into stable generation tools.
*   **🛠️ Elegant Quick-Launcher Scripts**:
    *   Shipped with dual-standard automation scripts: `双击本地启动(Windows).bat` for Windows clicking, plus `本地启动器(Unix-Mac).sh` for macOS & Linux terminals.

---

### 🚀 Get Started Locally

#### 1. Prerequisites
First, install the standard **Node.js** runtime:
*   **Recommended Version**: Node.js **v18 / v20 / v22+**
*   **Check verification**: Open your terminal terminal and run: `node -v`

#### 2. Configure Environment Variables (For real-time AI Analysis)
In order to connect to genuine Google Gemini models, configure your server API secret:
1. Create a `.env` file in the project's root folder (or duplicate `.env.example`).
2. Populate the following key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If left empty, a robust, detailed visual simulator mock mode executes offline seamlessly so that all layouts remain fully interactive).*

#### 3. Automatic Run (One-Click Launchers)
*   **On Windows**:
    *   Double-click the file named `双击本地启动(Windows).bat`.
*   **On macOS or Linux**:
    *   Open terminal in root repository path, authorize executions:
        ```bash
        chmod +x 本地启动器(Unix-Mac).sh
        ```
    *   Run the launcher wrapper:
        ```bash
        ./本地启动器(Unix-Mac).sh
        ```
    *   Open your browser and navigate to `http://localhost:3000`.

#### 4. Alternative Manual Console Setup
Run manual commands if you prefer CLI tools:
```bash
# Install dependencies
npm install

# Start development dev-server with Live-Reload
npm run dev

# Build the system for highly optimized container hosting or production bundle
npm run build

# Start production runtime
npm start
```

---

## 💾 数据存储路径、文件加密与备份说明 • Data Storage Path Details

本应用为了确保极佳的隐私安全性以及即开即用的免配置体验，所有数据**均存储于您的本地浏览器沙盒（`localStorage`）中**，绝不上传任何网络或云端服务器，保障用户完全独占所有商业与艺术灵感资产。

### 1. 存储机制 (Storage Mechanism)
*   **私密数据物理隔离**：用户信息、灵感画廊卡片、AI分析标签及自定义合集，全部进行本地高保真 JSON 序列化。依据账户与当前配置的存储路径，生成带有空间专属后缀的隔离键（如 `prompt_vault_cards_${userId}_path_${hashSuffix}`），实行**完全独立的沙盒级工作区逻辑隔离**。
*   **图片持久化形式**：画廊或上传分析的图像在本地进行极限智能压缩后，转换为高还原度 **Base64 编码内嵌于卡片的 JSON 字段中统一存储**。因此不会在磁盘生成零散杂乱的媒体碎片文件，迁移和清理极其纯净。

### 2. 物理数据路径切换 (Custom Physical Path)
本系统在底栏/状态栏特别设计了**自定义物理存储路径按钮**：
*   **多工作区快速切换**：在应用底栏点击带有 💾 标识的「存储与备份」卡片，填写任何本地电脑的相对或绝对路径（如 `D:/AI-Vault/Data` 或 `/Users/Shared/PromptVault`）。系统会将该路径值进行安全的 Hash 计算，衍生出一个单独的专属数据库环境。
*   **创建/独立多个图库**：这非常适合您为不同的创作项目创建、加载完全独立的图库。在不同路径名下存放不同的灵感，互不干扰！

### 3. 数据是否加密 (Data Encryption & Security)
*   **结构化混淆保护**：存储的数据均通过系统的 JSON 编码压缩和图片 Base64 底层哈希表达，物理磁盘扫描无法直接识别或预览内部图像，能有效防御初级的磁盘探针或缓存扫描。
*   **无硬件级物理秘钥加密**：受限于现代浏览器原生 `localStorage` 原生沙盒的安全权限（属于单主机独占沙盒），并未对本地数据库进行消耗硬件运算的对称秘钥暴力文件加密。
*   **防御窥屏建议**：如果经常与他人共用电脑，建议在离开应用时点击左下角 **“安全退出” / “Safe Logout”**。账户一经退出，当前浏览器内存中的解密画卷将被瞬间锁闭清除，完美阻断旁人窥探。

### 4. 浏览器在操作系统中的物理文件存储位置 (OS LocalStorage Directory)
由于数据完全由当下浏览器控制，它们在您设备操作系统中的绝对物理 leveldb 文件地址如下：

#### 🔴 Windows 系统：
*   **Google Chrome / Chromium 核心浏览器**：
    `%LocalAppData%\Google\Chrome\User Data\Default\Local Storage\leveldb`
*   **Microsoft Edge 浏览器**：
    `%LocalAppData%\Microsoft\Edge\User Data\Default\Local Storage\leveldb`
*   **Firefox (火狐) 浏览器**：
    `%AppData%\Mozilla\Firefox\Profiles\您的配置文件夹\webappsstore.sqlite`

#### 🟢 macOS 系统：
*   **Google Chrome**：
    `~/Library/Application Support/Google/Chrome/Default/Local Storage/leveldb`
*   **Safari 浏览器**：
    `~/Library/Safari/LocalStorage`

#### 🔵 Linux 系统：
*   **Google Chrome**：
    `~/.config/google-chrome/Default/Local Storage/leveldb`

---

### 📥 备份导出与导入恢复选项 (Data Backup & Restore)

针对由于更换浏览器、清理系统垃圾、或者更换电脑设备带来的画廊数据安全顾虑，系统提供了全面的备份/恢复双层模式：
*   **数据导出 (Export JSON)**：一键打包生成以当前存储路径和日期命名的 `.json` 纯文本图集包。其中包含全部图集卡片序列、高还原度原画配图、自定分析标签、及自定义主题合集文件夹。
*   **数据导入恢复 (Import RESTORE)**，支持以下两种载入冲突解决策略：
    1.  **💡 智能合并模式（推荐）**：自动排重，仅为您载入并合并图本中原本不存在的新灵感和特色大图，对本地已有卡片与合集文件做原样无损保留。
    2.  **⚠️ 覆盖并彻底清空老图集**：删除当前工作区的所有残留，完全按照导出的备份包状态进行无损高保真还原。

---

## 📁 Repository Directory Layout • 项目结构说明

A high-level overview of files and directory layouts of this application:

```text
├── src/
│   ├── components/
│   │   ├── AuthPortal.tsx     # Secure Local Login System (Sandbox Account Controller)
│   │   └── AuthProvider.tsx   # React global safe Context authentication
│   ├── App.tsx                # Primary interactive manager control unit
│   ├── main.tsx               # Entrance bundle
│   └── index.css              # Custom styling definitions pairing Google Fonts
├── server.ts                  # Hybrid development & production Express Node server
├── metadata.json              # Platform core configurations
├── package.json               # Modular builds & node dependencies
├── tsconfig.json              # Strict compiler definitions
├── vite.config.ts             # Bundler specifications
├── .env.example               # Environmental definitions variables guide
├── 双击本地启动(Windows).bat    # Batch launcher shell script wrapper
└── 本地启动器(Unix-Mac).sh     # Bash script command runner (MacOS/Linux)
```

## 📜 License • 开源授权许可

This project is open-sourced under the terms of the MIT License, meaning that you can modify, share, or self-deploy it freely! See the corresponding files for complete details.

---
*Crafted privately on AI Studio with passion. Feel free to Fork, Star, or raise an Issue on GitHub if you have creative requests!* 🎨
