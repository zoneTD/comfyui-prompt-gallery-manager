import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Helper to check for base64 image data
interface ImagePayload {
  imageBytes: string;
  mimeType: string;
}

function parseBase64Image(dataUrl: string): ImagePayload | null {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  return {
    mimeType: matches[1],
    imageBytes: matches[2],
  };
}

function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  // Strip markdown code block wrapper if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\s*\n?/, "");
    // Also strip closing code block
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned.trim());
}

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(customApiKey?: string, customApiUrl?: string): GoogleGenAI | null {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("⚠️ GEMINI_API_KEY is not configured or in placeholder state. Using offline mock simulation.");
    return null;
  }
  
  // Under direct custom dynamic API setups: always construct fresh client to avoid caching wrong configs
  if (customApiKey || customApiUrl) {
    const config: any = {
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    };
    if (customApiUrl) {
      config.baseURL = customApiUrl;
    }
    return new GoogleGenAI(config);
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set body limits high enough to transfer raw base64 images (e.g., up to 20MB)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ limit: "25mb", extended: true }));

  // API Route 1: Suggest three tags based on a prompt
  app.post("/api/tags", async (req, res) => {
    const { prompt, useCustomApi, customProvider, customApiKey, customApiUrl, customModel } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "提示词不可为空且必须是字符串" });
    }

    // Checking if OpenAI provider is explicitly selected and enabled
    if (useCustomApi && customProvider === "openai" && customApiKey) {
      try {
        const baseUrl = customApiUrl || "https://api.openai.com/v1";
        const url = `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}/chat/completions`;
        const modelName = customModel || "gpt-4o-mini";

        const systemPrompt = `你是一个专业的 AI 绘画专家。请根据以下用户提供的图片提示词（Prompt），给出恰好 3 个最契合的中文标签。这三个标签必须是以下三维度的严格对应（每个维度一个词）：
1. 画面主体（如：孤独少女、异星黑洞、晶体鸢尾花 等主要聚焦事物）
2. 核心主题/情感氛围（如：赛博朋克、唯美治愈、太空歌剧、情绪抑郁 等创意大方向）
3. 艺术风格/流派质感（如：经典动漫手绘、写实摄影、3D厚涂渲染、70年代复古插画 等技术流派）

请直接输出 3 个标签组成的 JSON 字符串数组，不要包含任何多余解释。格式例如：["孤独少女", "宇宙黑洞", "3D厚涂渲染"]`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customApiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `提示词："${prompt}"` }
            ],
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI 兼容 API 错误: 状态码 ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("接口返回的内容为空或 choices 节点缺失");
        }

        const tags = cleanAndParseJson(content);
        if (Array.isArray(tags)) {
          return res.json({ tags: tags.slice(0, 3) });
        } else {
          throw new Error("返回格式不匹配数组");
        }
      } catch (error: any) {
        console.error("OpenAI tags generation error:", error);
        return res.status(500).json({ 
          error: "第三方 API 生成标签失败", 
          details: error?.message || String(error) 
        });
      }
    }

    const ai = getGeminiClient(useCustomApi && customProvider === "gemini" ? customApiKey : undefined, useCustomApi && customProvider === "gemini" ? customApiUrl : undefined);
    if (!ai) {
      // Offline fallback: Analyze prompt keywords to suggest mock tags
      const lowercasePrompt = prompt.toLowerCase();
      let subject = "未知主体";
      let theme = "创意插画";
      let style = "通用画风";
      
      if (lowercasePrompt.includes("anime") || lowercasePrompt.includes("二次元") || lowercasePrompt.includes("girl") || lowercasePrompt.includes("少女")) {
        subject = "二次元少女";
        theme = "青春幻想";
        style = "经典动漫手绘";
      } else if (lowercasePrompt.includes("cyberpunk") || lowercasePrompt.includes("赛博朋克") || lowercasePrompt.includes("neon") || lowercasePrompt.includes("霓虹")) {
        subject = "赛博改造人";
        theme = "高科技低生活";
        style = "赛博朋克霓虹";
      } else if (lowercasePrompt.includes("nature") || lowercasePrompt.includes("landscape") || lowercasePrompt.includes("风景") || lowercasePrompt.includes("山水")) {
        subject = "自然风景";
        theme = "唯美旷野";
        style = "写实摄影";
      } else if (lowercasePrompt.includes("space") || lowercasePrompt.includes("astronaut") || lowercasePrompt.includes("宇航员")) {
        subject = "孤独宇航员";
        theme = "异星太空探险";
        style = "70年代复古科幻";
      } else if (lowercasePrompt.includes("realistic") || lowercasePrompt.includes("写实")) {
        subject = "真实人物";
        theme = "日常写实";
        style = "超分大片摄影";
      } else if (lowercasePrompt.includes("fantasy") || lowercasePrompt.includes("luminous") || lowercasePrompt.includes("奇幻")) {
        subject = "奇幻大陆";
        theme = "发光水晶";
        style = "立体CG渲染";
      }
      
      const tags = [subject, theme, style];
      
      return res.json({ 
        tags: tags, 
        mocked: true,
        message: "已通过本地智能分词生成模拟精准标签(主体、主题、流派)。请输入 GEMINI_API_KEY 以体验 3.5 智能分词。" 
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: customModel || "gemini-3.5-flash",
        contents: `你是一个专业的 AI 绘画专家。请根据以下用户提供的图片提示词（Prompt），给出恰好 3 个最契合的中文标签。这三个标签必须是以下三维度的严格对应（每个维度一个词）：
1. 画面主体（如：孤独少女、异星黑洞、晶体鸢尾花 等主要聚焦事物）
2. 核心主题/情感氛围（如：赛博朋克、唯美治愈、太空歌剧、情绪抑郁 等创意大方向）
3. 艺术风格/流派质感（如：经典动漫手绘、写实摄影、3D厚涂渲染、70年代复古插画 等技术流派）

请直接输出 3 个标签组成的 JSON 字符串数组，不要包含任何多余解释。
提示词："${prompt}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "恰好3个标签数组，分别依次是：[图片主体, 核心主题, 艺术风格]",
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini 返回的内容为空");
      }

      const tags = JSON.parse(responseText.trim());
      if (Array.isArray(tags)) {
        return res.json({ tags: tags.slice(0, 3) });
      } else {
        throw new Error("返回格式不匹配数组");
      }
    } catch (error: any) {
      console.error("Gemini tags generation error:", error);
      return res.status(500).json({ 
        error: "生成标签失败", 
        details: error?.message || String(error) 
      });
    }
  });

  // API Route 2: Analyze an image to generate description and prompt
  app.post("/api/describe", async (req, res) => {
    const { image, useCustomApi, customProvider, customApiKey, customApiUrl, customModel } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "由于必须选择上传图片，因此图片不能为空" });
    }

    const parsedImage = parseBase64Image(image);
    if (!parsedImage) {
      return res.status(400).json({ error: "图片格式错误，必须为Base64 data-uri格式" });
    }

    // Checking if OpenAI Vision provider is requested and enabled
    if (useCustomApi && customProvider === "openai" && customApiKey) {
      try {
        const baseUrl = customApiUrl || "https://api.openai.com/v1";
        const url = `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}/chat/completions`;
        const modelName = customModel || "gpt-4o-mini";

        const systemPrompt = `你是一个最顶级的 AI 绘画反推大师与多模态分析专家。请仔细分析这张图片的内容，并返回以下三项信息，采用 JSON 格式输出（不要返回任何 \`\`\`json 等 markdown 格式包装，也不要有多余解释）：
必须包含以下三个字段类型：
1. "description": 一段深入、生动且简短的中文描述，概述画面的核心内容，涵盖主体、环境氛围、色调、质感与流派等（100字以内）。
2. "prompt": 一段针对 Midjourney / DALL-E 3 或 Stable Diffusion 进行深度优化的高质量中文提示词（Prompt），能够帮助用户重新生成或二次创作出这种艺术风格的图片。包含画面主体、艺术风格、摄影机位/镜头、光效和超清画质参数等，请全部使用中文（Chinese）书写开发。
3. "tags": 恰好3个中文核心标签词的数组，并且严格遵循以下三个维度：
   [画面主体(如: 晶体鸢尾花), 核心主题/情感氛围(如: 太空歌剧), 艺术风格/流派质感(如: 写实摄影)]。`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customApiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: systemPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: image
                    }
                  }
                ]
              }
            ],
            temperature: 0.4
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI 兼容多模态 API 错误: 状态码 ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("多模态接口返回的内容为空或 choices 节点缺失");
        }

        const result = cleanAndParseJson(content);
        return res.json(result);
      } catch (error: any) {
        console.error("OpenAI vision describe error:", error);
        return res.status(500).json({ 
          error: "第三方多模态 AI 绘图反推失败", 
          details: error?.message || String(error) 
        });
      }
    }

    const ai = getGeminiClient(useCustomApi && customProvider === "gemini" ? customApiKey : undefined, useCustomApi && customProvider === "gemini" ? customApiUrl : undefined);
    if (!ai) {
      // Offline fallback
      return res.json({
        description: "由于您未在 Settings > Secrets 内添加有效 GEMINI_API_KEY，系统在离线仿真状态下对图片进行结构化解析。这只在本地测试环境中使用，生产环境需要配置密钥。",
        prompt: "一幅绝美的艺术杰作，精致详实的背景，动态戏剧性光影，电影感，8K分辨率，逼真写实，Artstation热门风格，比例 16:9",
        tags: ["孤独宇航员", "异星探索之旅", "70年代复古科幻"],
        mocked: true,
        message: "离线仿真解析成功。要启用真正的 Gemini 多模态深度反向推导，请配置 GEMINI_API_KEY 秘钥。"
      });
    }

    try {
      const imagePart = {
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.imageBytes,
        },
      };

      const textPart = {
        text: `你是一个最顶级的 AI 绘画反推大师与多模态分析专家。请仔细分析这张图片的内容，并返回以下三项信息，采用给极客需要的 JSON 格式输出：
        1. description: 一段深入、生动且简短 of 中文描述，概述画面的核心内容，涵盖主体、环境氛围、色调、质感与流派等（100字以内）。
        2. prompt: 一段针对 Midjourney / DALL-E 3 或 Stable Diffusion 进行深度优化的高质量中文提示词（Prompt），能够帮助用户重新生成或二次创作出这种艺术风格 of 图片。包含画面主体、艺术风格、摄影机位/镜头、光效和超清画质参数等，请全部使用中文（Chinese）书写开发。
        3. tags: 恰好3个中文核心标签词，并且严格遵循以下三个维度：
           [画面主体(如: 晶体鸢尾花), 核心主题/情感氛围(如: 太空歌剧), 艺术风格/流派质感(如: 写实摄影)]。`,
      };

      const response = await ai.models.generateContent({
        model: customModel || "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "对图片的详细、具有美感的中文描述"
              },
              prompt: {
                type: Type.STRING,
                description: "高品质的高级中文提示词重构，适合AI绘图反推，请全部使用中文撰写"
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "包含恰好3个标签数组，第一项是主体名称，第二项是核心主题氛围，第三项是画风流派"
              }
            },
            required: ["description", "prompt", "tags"]
          }
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini 返回内容为空");
      }

      const result = JSON.parse(responseText.trim());
      return res.json(result);
    } catch (error: any) {
      console.error("Gemini describe generation error:", error);
      return res.status(500).json({ 
        error: "多模态推导失败", 
        details: error?.message || String(error) 
      });
    }
  });

  // API Route 3: Test connection for custom API settings
  app.post("/api/test-connection", async (req, res) => {
    const { customProvider, customApiKey, customApiUrl, customModel } = req.body;
    
    if (!customApiKey || !customApiKey.trim()) {
      return res.status(400).json({ error: "测试失败：API 密钥 (API Key) 不能为空" });
    }

    if (customProvider === "openai") {
      try {
        const baseUrl = customApiUrl || "https://api.openai.com/v1";
        const url = `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}/chat/completions`;
        const modelName = customModel || "gpt-4o-mini";

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customApiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "user", content: "Ping" }
            ],
            max_tokens: 10,
            temperature: 0.1
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`连接失败：状态码 ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        return res.json({ success: true, message: `连接成功！模型 ${modelName} 响应：${content ? content.trim() : "OK"}` });
      } catch (error: any) {
        console.error("OpenAI test connection error:", error);
        return res.status(500).json({ error: error?.message || String(error) });
      }
    } else {
      // Gemini
      try {
        const ai = getGeminiClient(customApiKey, customApiUrl);
        if (!ai) {
          return res.status(400).json({ error: "未成功创建 Gemini 客户端" });
        }

        const modelName = customModel || "gemini-3.5-flash";
        const response = await ai.models.generateContent({
          model: modelName,
          contents: "Ping"
        });

        const responseText = response.text;
        return res.json({ success: true, message: `连接成功！模型 ${modelName} 响应：${responseText ? responseText.trim() : "OK"}` });
      } catch (error: any) {
        console.error("Gemini test connection error:", error);
        return res.status(500).json({ error: error?.message || String(error) });
      }
    }
  });

  // --- COMFYUI NODE CONNECTOR ENDPOINTS ---
  
  // 1. Sync React client custom cards list with backend
  app.post("/api/comfy/sync", (req, res) => {
    try {
      const { cards } = req.body;
      if (!Array.isArray(cards)) {
        return res.status(400).json({ error: "数据格式不正确，必须为卡片数组" });
      }
      fs.writeFileSync(
        path.join(process.cwd(), "comfy_prompts.json"),
        JSON.stringify(cards, null, 2),
        "utf-8"
      );
      return res.json({ success: true, message: `成功同步 ${cards.length} 张提示词卡片到本地服务器！` });
    } catch (err: any) {
      console.error("ComfyUI sync error:", err);
      return res.status(500).json({ error: "数据同步失败", details: err?.message });
    }
  });

  // 2. Fetch list of synced prompts from backend
  app.get("/api/comfy/prompts", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "comfy_prompts.json");
      if (!fs.existsSync(filePath)) {
        return res.json([]);
      }
      const data = fs.readFileSync(filePath, "utf-8");
      return res.json(JSON.parse(data));
    } catch (err: any) {
      console.error("ComfyUI fetch prompts error:", err);
      return res.status(500).json({ error: "获取数据失败", details: err?.message });
    }
  });

  // 3. Mark a prompt card as active in ComfyUI
  app.post("/api/comfy/set-active", (req, res) => {
    try {
      const { activeId, customPrompt, customNegativePrompt } = req.body;
      const config = {
        activeId: activeId || "",
        customPrompt: customPrompt || "",
        customNegativePrompt: customNegativePrompt || ""
      };
      fs.writeFileSync(
        path.join(process.cwd(), "comfy_active.json"),
        JSON.stringify(config, null, 2),
        "utf-8"
      );
      return res.json({ success: true, message: "成功将该提示词设为 ComfyUI 活跃输出了！" });
    } catch (err: any) {
      console.error("ComfyUI set active error:", err);
      return res.status(500).json({ error: "设置活跃提示词失败", details: err?.message });
    }
  });

  // 4. Fetch the active state (used by ComfyUI Python node)
  app.get("/api/comfy/active", (req, res) => {
    try {
      const mode = req.query.mode || "active"; // 'active' or 'random'
      
      const promptsPath = path.join(process.cwd(), "comfy_prompts.json");
      const activePath = path.join(process.cwd(), "comfy_active.json");
      
      let cardsList: any[] = [];
      if (fs.existsSync(promptsPath)) {
        cardsList = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));
      }
      
      let activeConfig = { activeId: "", customPrompt: "", customNegativePrompt: "" };
      if (fs.existsSync(activePath)) {
        activeConfig = JSON.parse(fs.readFileSync(activePath, "utf-8"));
      }

      // If active mode is random
      if (mode === "random" && cardsList.length > 0) {
        const randomIndex = Math.floor(Math.random() * cardsList.length);
        const card = cardsList[randomIndex];
        return res.json({
          id: card.id,
          prompt: card.prompt,
          negative_prompt: card.skillPrompt || "",
          description: card.description || "",
          tags: card.tags || [],
          imageUrl: card.imageUrl || "",
          targetModel: card.targetModel || ""
        });
      }

      // Default to active mode
      let activeCard = null;
      if (activeConfig.activeId) {
        activeCard = cardsList.find(c => c.id === activeConfig.activeId);
      }
      
      if (activeCard) {
        return res.json({
          id: activeCard.id,
          prompt: activeConfig.customPrompt || activeCard.prompt,
          negative_prompt: activeConfig.customNegativePrompt || activeCard.skillPrompt || "",
          description: activeCard.description || "",
          tags: activeCard.tags || [],
          imageUrl: activeCard.imageUrl || "",
          targetModel: activeCard.targetModel || ""
        });
      } else if (cardsList.length > 0) {
        // Fallback to first card if nothing is selected or active ID doesn't exist anymore
        const card = cardsList[0];
        return res.json({
          id: card.id,
          prompt: card.prompt,
          negative_prompt: card.skillPrompt || "",
          description: card.description || "",
          tags: card.tags || [],
          imageUrl: card.imageUrl || "",
          targetModel: card.targetModel || ""
        });
      } else {
        return res.json({
          id: "default",
          prompt: activeConfig.customPrompt || "A neon-style robotic core in an ancient sanctuary, cyberpunk style, volumetric lighting, photorealistic",
          negative_prompt: activeConfig.customNegativePrompt || "negetive, bad anatomy, lowres, blurry",
          description: "默认演示提示词（未同步任何画布数据）",
          tags: ["默认", "演示", "三维渲染"],
          imageUrl: "",
          targetModel: "General"
        });
      }
    } catch (err: any) {
      console.error("ComfyUI active retrieval error:", err);
      // Fail gracefully with a default prompt so ComfyUI doesn't crash
      return res.json({
        id: "fail-safe",
        prompt: "A beautiful cinematic digital painting of a metallic robot working on a glowing motherboard, cozy ambient light",
        negative_prompt: "blurry, low resolution",
        description: "容灾默认提示词 (Fail-safe prompt)",
        tags: ["容灾", "机械", "数字艺术"]
      });
    }
  });

  // API Route: Graceful shutdown of the server process
  app.post("/api/shutdown", (req, res) => {
    res.json({ success: true, message: "服务器即将彻底终止并释放 3000 端口！" });
    console.log("🛑 Received shutdown command from client. Shutting down system and releasing port 3000...");
    setTimeout(() => {
      process.exit(0);
    }, 800);
  });

  // Serve static files / Vite middleware integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
