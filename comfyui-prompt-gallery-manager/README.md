# ComfyUI AI 提示词与图集管理器 (Prompt Gallery Connector Node)

一个集成了 **私密安全本地大模型提示词反推、标签管理、多模态反推、双向卡片同步、卡片比对** 等先进特性的 ComfyUI 专属插件与可视化管理面板。

---

## 🌟 特点
1. **一体化全功能界面**: 无论是由本软件自带的 AI 逆向反推，还是您手动录入、多账户隔离存放的提示词与美图，全部完美保存在此。
2. **零独立进程依赖**: 当作为 ComfyUI 插件启动时，ComfyUI 自身的 web 服务器将同时接管本管理器的所有 API 交互与静态前端页面服务，再也不需要另外用 Node 跑 3000 端口，开箱即用！
3. **支持多种运行模式**:
   - **Active (活跃输出模式)**: 在本管理器精美的图集卡片上，点击任意卡片的 `🎯 设为 Comfy 输出` 按钮，该张卡片中的 **正面提示词** 及其 **反面提示词** 会在加载该节点的 workflow 运行时即时输出给 CLIP Text Encode 编码节点。
   - **Random (创意随机模式)**: ComfyUI 会从您当前已保存在本软件的整个图集保险库中随机挑出一张卡片进行生图。非常适合进行创意思路碰撞、大规模批量测试以及自适应渲染队列！

---

## 🛠️ 安装指南

1. **获取插件文件夹**
   - 打包本项目并提取其中的或直接复制整个 `comfyui-prompt-gallery-manager/` 目录。
   
2. **复制到 ComfyUI 中**
   - 找到您的 ComfyUI 根目录，打开其中的 `custom_nodes/` 文件夹。
   - 将 `comfyui-prompt-gallery-manager` 文件夹粘贴进去。
   - 确保目录结构如下：
     ```text
     ComfyUI/
     └── custom_nodes/
         └── comfyui-prompt-gallery-manager/
             ├── __init__.py
             ├── prompt_gallery_node.py
             ├── README.md
             ├── comfy_prompts.json (自动生成)
             ├── comfy_active.json  (自动生成)
             └── dist/
                 ├── index.html
                 └── assets/
                     └── ... (js/css 静态资源)
     ```

3. **重新启动 ComfyUI**
   - 双击您常用的 ComfyUI 启动脚本（如 `run_nvidia_gpu.bat`）重启 ComfyUI。
   - 控制台将会输出：`[PromptGallery] API 路由已就绪，已挂载 ComfyUI 内置 web 服务`。

---

## 🚀 画布节点使用方式与教程

1. **添加桥接接收节点**
   - 在 ComfyUI canvas 空白处右键双击，搜索并添加 `Prompt Gallery Connector 🎯` 节点。

2. **连接管线**
   - 将该节点的 `positive_prompt` 输出引脚连接至您流程中的 `CLIP Text Encode (Prompt)`（正面提示词）的 `text` 输入端口。
   - 将该节点的 `negative_prompt` 输出引脚连接至您流程中的 `CLIP Text Encode (Negative)`（反面提示词）的 `text` 输入端口。

3. **双向可视化操控界面 (超赞!)**
   - 重启 ComfyUI 后，在浏览器中输入以下地址打开完整、好看的管理面板：
     👉 **`http://127.0.0.1:8188/prompt-gallery`** (如果您的 ComfyUI 不是默认的 8188 端口，请自行替换)
   - 在这个全屏网页中，您可以：
     1. 直接进行 AI 图像反推词、生成炫酷标题标签。
     2. 将大模型推导出的最佳结果双向保存。
     3. 找到满意的图片，点击卡片底部的 **`🎯 设为 Comfy 输出`**！
   - 回到 ComfyUI 画布点击 **Queue Prompt（排队生图）**，刚才选择的卡片提示词将自动输入到生图工作流中！
