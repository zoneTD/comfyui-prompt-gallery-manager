# 🎨 ComfyUI AI 提示词与图集管理器 • ComfyUI Prompt Gallery & Manager Node

一个集成了 **私密本地大模型提示词反推、图片自动标签生成、多魔态反向提炼、双向卡片同步、提示词实时桥接** 等特性的 ComfyUI 专属节点插件与可视化管理面板。

[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-6474f2?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![ComfyUI](https://img.shields.io/badge/ComfyUI-Plugin-emerald.svg?style=flat-square&logo=python)](https://github.com/comfyanonymous/ComfyUI)
[![Gemini](https://img.shields.io/badge/Google_Gemini-Powered-E57C23?style=flat-square&logo=googlegemini)](https://ai.google.dev/)

---

## 🇨🇳 简体中文说明

本项目已完美转换为 **ComfyUI 专用本地自定义节点插件**。本管理器再也不需要另外使用单独的 Node.js 进程跑 3000 端口，而是由 ComfyUI 自身的 Python 异步 Web 服务器全程托管静态前端网页与读写同步 API！

### ✨ 核心亮点

*   **⚡ 零门槛一键联动**: 
    在精美的画廊页面中，双击或点击任意提示词卡片底部的 **`🎯 设为 Comfy 输出`**，当前卡片的正向与反向提示词将立刻写回本地缓存，与 ComfyUI 节点进行毫秒级无缝联动。
*   **🧩 内置 Prompt Gallery Python 节点**:
    在 ComfyUI 画布上添加并使用 `Prompt Gallery Connector 🎯` 节点，轻松将读取到的值直接管线联接到您工作流的 CLIP Text Encode 编码器中。
*   **👁️ 多模态 AI 双向反推分析**:
    支持将优秀画作拖拽上传。利用 Gemini 1.5 Flash 或 2.5 真实的多模态视觉网络在后台解构构图、主体、灯光、渲染参数并一键保存为高清晰正面提示词并同步到节点。
*   **📁 极简纯净的插件封装**:
    所有的前端 HTML 资源（Vite 生产构建包 `dist` 目录）均安全地存放在 ComfyUI 插件中的静态资源服务端口，开箱即用。

---

### 🚀 极速安装与部署指引

#### 1. 编译并打包插件
若是在二次开发中，在根目录运行构建并同步：
```bash
# 安装所有的打包与编译依赖 
npm install

# 触发一键编译，编译后的静态文件会自动同步拷贝到 python 插件文件夹下的 dist 目录中
npm run build
```

#### 2. 将插件安装至 ComfyUI 中
1. 复制本项目中生成的完整 **`comfyui-prompt-gallery-manager/`** 目录。
2. 粘贴至您的 ComfyUI 原生安装目录中的 **`custom_nodes/`** 文件夹中：
   ```text
   ComfyUI/
   └── custom_nodes/
       └── comfyui-prompt-gallery-manager/
           ├── __init__.py           # 自动注册路由
           ├── prompt_gallery_node.py # 节点与 API 定义
           ├── README.md
           ├── comfy_prompts.json     # 全量画集数据库
           ├── comfy_active.json      # 当前激活的输出状态
           └── dist/                 # 编译后的高性能 React 资源
               ├── index.html
               └── assets/ ...
   ```
3. 重新启动 ComfyUI，此时您会在启动日志中看到 `[PromptGallery] API 路由已就绪，已挂载 ComfyUI 内置 web 服务`。

---

### 🎨 画布中的实战用法

1. **添加节点**：
   在 ComfyUI 工作流界面，鼠标右键双击画布搜索或右键 `PromptGallery` 目录，添加 **`Prompt Gallery Connector 🎯`** 接收节点。
2. **连接管线**：
   - 将 `positive_prompt` 输出节点连至 **`CLIP Text Encode （正面提示词）`** 的 `text`。
   - 将 `negative_prompt` 输出节点连至 **`CLIP Text Encode （反面提示词）`** 的 `text`。
3. **打开可视化控制后台**：
   在浏览器中输入您的 ComfyUI 入口地址，并在尾部拼接 `/prompt-gallery`：
   👉 **`http://127.0.0.1:8188/prompt-gallery`**  *(注：如果修改过 ComfyUI 的默认端口 8188，请自行替换)*
4. **一键换词渲染**：
   在打开的高端管理器界面中，尽情挑选或生成想要的绘图词，直接点击 **`设为 Comfy 输出`**！回到 ComfyUI 中点击 **`Queue Prompt`**，您选择的词便会自动带入画布中运行！

#### 💡 自定义模式选项解释
- **active (活跃模式)**：始终加载您当前点击并激活标记了 `COMFY 活跃输出` 标签的那张特定卡片。
- **random (创意抽卡模式)**：每次重新进行工作流编排渲染时，该连接节点会自动从您同步的几百千张灵感卡片中，**随机精准抽取出一张进行创意渲染**。非常适合用于风格碰撞、探索盲盒生图以及批量制作风格样片图册！

---

## 🇺🇸 English Version

This project is a customized, production-ready **ComfyUI Custom Node Extension** called `comfyui-prompt-gallery-manager`. There is absolutely no longer any need to run Node.js on custom localhost port `3000` because the frontend React components and the prompt read/write APIs are securely hosted directly via **ComfyUI's internal Python web server**!

### ✨ Highlights

*   **🎯 Live Node Active Output**:
    Select any beautiful prompt card in the React gallery dashboard with one-click on the `🎯 Set Comfy Output` button. ComfyUI instantly accesses the updated positive & negative prompt parameters during workflow execution.
*   **🐍 Seamless Python Node Connector**:
    Double click on ComfyUI and add the `Prompt Gallery Connector 🎯` node to retrieve localized positive & negative prompt texts. Pipe them directly to your standard Clip Text Embeds.
*   **👁️ Multimodal AI Analytics**:
    Drag and drop/upload any input reference image inside our manager. Google Gemini API works behind the scene to fully reconstruct styles, details, and descriptors instantly.

### 🚀 Get Started Immediately

1. Move the **`comfyui-prompt-gallery-manager`** directory into your **`ComfyUI/custom_nodes/`** directory.
2. Restart your ComfyUI Server.
3. Open the gorgeous client manager inside your browser:
   👉 **`http://127.0.0.1:8188/prompt-gallery`**
4. Search or design excellent prompting assets, tap `Set Comfy Output`, and click `Queue Prompt` inside your ComfyUI canvas!

---
*Crafted elegantly with React 19, TypeScript, Tailwind v4 and ComfyUI. Happy prompting and generating!* 🎯🎨
