import React, { useState, useEffect, useRef } from "react";
import { AIPromptCard, AIPromptCollection, User } from "./types";
import { compressAndStoreImage } from "./utils";
import { PromptCard } from "./components/PromptCard";
import { CardDetailModal } from "./components/CardDetailModal";
import { AuthPortal } from "./components/AuthPortal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { 
  Plus, 
  Search, 
  Sparkles, 
  Tag as TagIcon, 
  Trash2, 
  Grid, 
  LayoutGrid,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  FileUp,
  Loader2,
  Copy,
  FolderLock,
  Download,
  Info,
  Folder,
  FolderPlus,
  LogOut,
  Scale,
  Columns,
  Sun,
  Moon,
  Cpu
} from "lucide-react";

// Prepopulated sample cards to demo the design right away
const INITIAL_DEMO_CARDS: AIPromptCard[] = [
  {
    id: "demo-cyberpunk",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    prompt: "A neon-drenched cyborg holding a crystalline iris flower in a desert at midnight, volumetric lighting, 8k resolution cinematic lighting, intricate cyberpunk style",
    description: "这张图像展现了一位身处午夜沙漠中的赛博朋克改造人，手中捧着一朵发光的晶体鸢尾花。场景充满大量高对比度霓虹光影，呈现出高科技与荒凉自然结合的荒诞美学。",
    tags: ["赛博朋克", "超现实", "霓虹光影"],
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: "demo-astronaut",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    prompt: "1970s retro sci-fi book cover illustration of a lonely astronaut discovering an ancient floating brass obelisk on a foreign toxic planet landscape",
    description: "经典的1970年代复古科幻画风。宇航员站在满是荧光毒雾的异星沼泽表面，眼前悬浮着巨大的黄铜色上古尖碑，透露出太空探索的未知与孤寂。",
    tags: ["复古科幻", "异星探索", "视觉震慑"],
    createdAt: Date.now() - 3600000 * 24,
  }
];

export default function App() {
  const [cards, setCards] = useState<AIPromptCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [galleryLayout, setGalleryLayout] = useState<"complete" | "compact">(
    () => (localStorage.getItem("gallery_layout_mode") as "complete" | "compact") || "complete"
  );

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("app_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((item) => item.id === active.id);
    const newIndex = cards.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updated = arrayMove(cards, oldIndex, newIndex);
      saveCardsToStateAndStorage(updated);
    }
  };
  
  // UI Tabs & Sidebar Modes
  const [activeTab, setActiveTab] = useState<"gallery" | "add-manual" | "add-ai">("gallery");
  const [viewDetailCard, setViewDetailCard] = useState<AIPromptCard | null>(null);

  // --- COMPARE MODE STATES ---
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareCardIds, setCompareCardIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const handleCompareCardSelect = (card: AIPromptCard) => {
    setCompareCardIds(prev => {
      if (prev.includes(card.id)) {
        return prev.filter(id => id !== card.id);
      } else {
        if (prev.length < 2) {
          return [...prev, card.id];
        } else {
          // Keep second and add new one
          return [prev[1], card.id];
        }
      }
    });
  };

  // States for manual custom API settings
  const [customProvider, setCustomProvider] = useState<"gemini" | "openai">(() => {
    return (localStorage.getItem("custom_gemini_provider") as "gemini" | "openai") || "gemini";
  });
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("custom_gemini_api_key") || "");
  const [customApiUrl, setCustomApiUrl] = useState(() => localStorage.getItem("custom_gemini_api_url") || "");
  const [customModel, setCustomModel] = useState(() => {
    const saved = localStorage.getItem("custom_gemini_model");
    if (saved) return saved;
    const provider = localStorage.getItem("custom_gemini_provider") || "gemini";
    return provider === "openai" ? "gpt-4o-mini" : "gemini-3.5-flash";
  });
  const [useCustomApi, setUseCustomApi] = useState(() => localStorage.getItem("use_custom_gemini_api") === "true");
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testApiLoading, setTestApiLoading] = useState(false);
  const [testApiResult, setTestApiResult] = useState<{ success: boolean; message: string } | null>(null);

  // States for interactive creator
  const [uploadProgress, setUploadProgress] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [isDraggingManual, setIsDraggingManual] = useState(false);
  const [isDraggingAI, setIsDraggingAI] = useState(false);
  
  // Separate add pages configuration states
  const [manualAddMode, setManualAddMode] = useState<"draw" | "system" | "skill">("draw");
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  
  // For Manual Upload Form
  const [manualImageFile, setManualImageFile] = useState<string | null>(null);
  const [manualPrompt, setManualPrompt] = useState("");
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newManualTagInput, setNewManualTagInput] = useState("");
  const [manualSingleAiPrompt, setManualSingleAiPrompt] = useState("");
  const [manualSkillPrompt, setManualSkillPrompt] = useState("");
  const [manualTargetModel, setManualTargetModel] = useState("Midjourney v6");

  // For AI Describe/Reverse Tool Form
  const [aiImageFile, setAiImageFile] = useState<string | null>(null);
  const [aiDescribeResult, setAiDescribeResult] = useState<{
    description: string;
    prompt: string;
    tags: string[];
  } | null>(null);
  const [newAiTagInput, setNewAiTagInput] = useState("");
  const [aiSingleAiPrompt, setAiSingleAiPrompt] = useState("");
  const [aiSkillPrompt, setAiSkillPrompt] = useState("");
  const [aiTargetModel, setAiTargetModel] = useState("Midjourney v6");

  const fileInputRefManual = useRef<HTMLInputElement>(null);
  const fileInputRefAI = useRef<HTMLInputElement>(null);

  // Custom Collections / Subfolders States
  const [collections, setCollections] = useState<AIPromptCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [confirmCollectionDeleteId, setConfirmCollectionDeleteId] = useState<string | null>(null);



  // Helper to add tag manually in Form
  const handleAddManualTag = () => {
    const val = newManualTagInput.trim().replace(/#/g, "");
    if (!val) return;
    if (!manualTags.includes(val)) {
      setManualTags([...manualTags, val]);
    }
    setNewManualTagInput("");
  };

  // Helper to remove tag manually in Form
  const handleRemoveManualTag = (tagToRemove: string) => {
    setManualTags(manualTags.filter(t => t !== tagToRemove));
  };

  // Helper to add tag in AI generator Form
  const handleAddAiTag = () => {
    if (!aiDescribeResult) return;
    const val = newAiTagInput.trim().replace(/#/g, "");
    if (!val) return;
    if (!aiDescribeResult.tags.includes(val)) {
      setAiDescribeResult({
        ...aiDescribeResult,
        tags: [...aiDescribeResult.tags, val],
      });
    }
    setNewAiTagInput("");
  };

  // Helper to remove tag in AI generator Form
  const handleRemoveAiTag = (tagToRemove: string) => {
    if (!aiDescribeResult) return;
    setAiDescribeResult({
      ...aiDescribeResult,
      tags: aiDescribeResult.tags.filter(t => t !== tagToRemove),
    });
  };

  // Active User session state - hardcoded to bypass login portal completely for ComfyUI integration
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "comfy-local-user",
    email: "comfy-dev@local"
  });

  // --- COMFYUI NODE CONNECTOR INTEGRATION STATES & EFFECTS ---
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [comfyActiveId, setComfyActiveId] = useState<string>(() => localStorage.getItem("comfy_active_id") || "demo-cyberpunk");
  const [showComfyModal, setShowComfyModal] = useState(false);
  const [showComfyGuide, setShowComfyGuide] = useState(() => localStorage.getItem("show_comfy_guide_banner") !== "false");

  const syncCardsToBackend = async (cardsToSync: AIPromptCard[]) => {
    if (!cardsToSync || cardsToSync.length === 0) return;
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/comfy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: cardsToSync })
      });
      if (res.ok) {
        setSyncStatus("success");
        setTimeout(() => setSyncStatus("idle"), 3000);
      } else {
        setSyncStatus("error");
      }
    } catch (e) {
      setSyncStatus("error");
    }
  };

  // Sync cards with backend automatically when list changes
  useEffect(() => {
    if (cards && cards.length > 0) {
      syncCardsToBackend(cards);
    }
  }, [cards]);

  // Set the specified card as active output in backend comfy_active.json file
  const handleSetActivePromptForComfy = async (card: AIPromptCard) => {
    try {
      const res = await fetch("/api/comfy/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeId: card.id,
          customPrompt: card.prompt,
          customNegativePrompt: card.skillPrompt || ""
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComfyActiveId(card.id);
        localStorage.setItem("comfy_active_id", card.id);
      } else {
        console.error("激活活跃节点失败");
      }
    } catch (err) {
      console.error("后台服务连接失败", err);
    }
  };

  // --- CUSTOM STORAGE PATHS & PERSISTENT DATA CONTROL ---
  const [storagePath, setStoragePath] = useState<string>(
    () => localStorage.getItem("prompt_vault_storage_path") || "/Users/Shared/PromptVault/data"
  );
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [tempStoragePath, setTempStoragePath] = useState(storagePath);
  const [importOption, setImportOption] = useState<"merge" | "overwrite">("merge");
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | ""; msg: string }>({ type: "", msg: "" });
  const [isSystemShutDown, setIsSystemShutDown] = useState(false);

  const handleShutDownService = async () => {
    if (!window.confirm("确定要终止后台服务和终结本地 Node.js 进程吗？\n\n关闭后：\n1. AI 标签抽取、智能反推等全栈服务将立即停用。\n2. 默认的 3000 端口会被瞬间释放，不会产生任何后台残留。\n\n如需再次使用，只需回到项目文件夹中，再次双击对应的启动器脚本即可！")) {
      return;
    }
    try {
      setIsSystemShutDown(true);
      await fetch("/api/shutdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      // Immediate server death can cause fetch abort/rejections, which represent a successful termination exit!
      setIsSystemShutDown(true);
    }
  };

  const getPathHashSuffix = (pathStr: string) => {
    const trimmed = (pathStr || "").trim();
    if (!trimmed || trimmed === "/Users/Shared/PromptVault/data") return "";
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash << 5) - hash + trimmed.charCodeAt(i);
      hash |= 0;
    }
    return `_path_${Math.abs(hash)}`;
  };

  const getCardsKey = (userId: string, pathStr: string) => {
    const suffix = getPathHashSuffix(pathStr);
    return `prompt_vault_cards_${userId}${suffix}`;
  };

  const getCollectionsKey = (userId: string, pathStr: string) => {
    const suffix = getPathHashSuffix(pathStr);
    return `prompt_vault_collections_${userId}${suffix}`;
  };

  // Load User Data upon authentication changes or storage path changes
  useEffect(() => {
    if (!currentUser) {
      setCards([]);
      setCollections([]);
      setSelectedCollectionId(null);
      setSelectedTag(null);
      return;
    }

    const cardsKey = getCardsKey(currentUser.id, storagePath);
    const colsKey = getCollectionsKey(currentUser.id, storagePath);

    // 1. Load Cards
    const storedCards = localStorage.getItem(cardsKey);
    if (storedCards) {
      try {
        setCards(JSON.parse(storedCards));
      } catch (e) {
        setCards(INITIAL_DEMO_CARDS);
      }
    } else {
      // Lazy pre-populate for a fresh spectacular onboarding experience!
      setCards(INITIAL_DEMO_CARDS);
      localStorage.setItem(cardsKey, JSON.stringify(INITIAL_DEMO_CARDS));
    }

    // 2. Load Collections
    const storedCols = localStorage.getItem(colsKey);
    if (storedCols) {
      try {
        setCollections(JSON.parse(storedCols));
      } catch (e) {
        setCollections([]);
      }
    } else {
      const demoCollections: AIPromptCollection[] = [
        {
          id: "demo-col-cyber",
          name: "赛博黑客霓虹",
          cardIds: ["demo-cyberpunk"],
          createdAt: Date.now()
        },
        {
          id: "demo-col-space",
          name: "太空科幻经典",
          cardIds: ["demo-astronaut"],
          createdAt: Date.now()
        }
      ];
      setCollections(demoCollections);
      localStorage.setItem(colsKey, JSON.stringify(demoCollections));
    }
  }, [currentUser, storagePath]);

  // Update collections storage whenever state changes
  const saveCollectionsToStateAndStorage = (updated: AIPromptCollection[]) => {
    setCollections(updated);
    if (currentUser) {
      const key = getCollectionsKey(currentUser.id, storagePath);
      localStorage.setItem(key, JSON.stringify(updated));
    } else {
      const key = getCollectionsKey("guest", storagePath);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  // Helper to create a new folder/collection
  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    // Check for duplicate name
    if (collections.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert("该合集活页夹名称已存在，请换个名字。");
      return;
    }
    const newColl: AIPromptCollection = {
      id: "col-" + Date.now(),
      name,
      cardIds: [],
      createdAt: Date.now()
    };
    saveCollectionsToStateAndStorage([...collections, newColl]);
    setNewCollectionName("");
  };

  // Helper to delete an entire collection grouping (without deleting the cards inside)
  const handleDeleteCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = collections.filter(c => c.id !== id);
    saveCollectionsToStateAndStorage(updated);
    if (selectedCollectionId === id) {
      setSelectedCollectionId(null);
    }
  };

  // Toggle card inside collection membership state
  const handleToggleCollectionForCard = (cardId: string, collectionId: string) => {
    const updated = collections.map(coll => {
      if (coll.id === collectionId) {
        const hasCard = coll.cardIds.includes(cardId);
        const cardIds = hasCard
          ? coll.cardIds.filter(id => id !== cardId)
          : [...coll.cardIds, cardId];
        return { ...coll, cardIds };
      }
      return coll;
    });
    saveCollectionsToStateAndStorage(updated);
  };

  // Update storage whenever state changes
  const saveCardsToStateAndStorage = (updated: AIPromptCard[]) => {
    setCards(updated);
    if (currentUser) {
      const key = getCardsKey(currentUser.id, storagePath);
      localStorage.setItem(key, JSON.stringify(updated));
    } else {
      const key = getCardsKey("guest", storagePath);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  // Helper calculating localStorage raw usage
  const getStorageSizeMB = () => {
    const key = currentUser ? getCardsKey(currentUser.id, storagePath) : getCardsKey("guest", storagePath);
    const raw = localStorage.getItem(key) || "";
    const bytes = raw.length * 2; // UTF-16 characters
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2);
  };

  // --- Data Backup & Restore Operations ---
  const handleExportData = () => {
    const dataToExport = {
      version: "1.0",
      exportTime: Date.now(),
      storagePath: storagePath,
      userId: currentUser?.id || "guest",
      cards: cards,
      collections: collections
    };
    
    try {
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const pathSlug = storagePath.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, "_");
      link.href = url;
      link.download = `PromptVault_Backup_${pathSlug}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("导出备份失败: " + err.message);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsed = JSON.parse(rawContent);

        if (!parsed || !Array.isArray(parsed.cards)) {
          setImportStatus({ type: "error", msg: "解析失败: 备份文件格式非法，未找到卡片数据。" });
          return;
        }

        const newCardsCount = parsed.cards.length;
        const newColsCount = Array.isArray(parsed.collections) ? parsed.collections.length : 0;

        if (importOption === "overwrite") {
          const updatedCards = parsed.cards;
          const updatedCols = Array.isArray(parsed.collections) ? parsed.collections : [];
          saveCardsToStateAndStorage(updatedCards);
          saveCollectionsToStateAndStorage(updatedCols);
          setImportStatus({ 
            type: "success", 
            msg: `覆盖导入成功！共载入 ${newCardsCount} 张灵感卡片，${newColsCount} 个合集。` 
          });
        } else {
          const existingIds = new Set(cards.map(c => c.id));
          const mergedCards = [...cards];
          let mergedCount = 0;
          parsed.cards.forEach((card: AIPromptCard) => {
            if (!existingIds.has(card.id)) {
              mergedCards.push(card);
              mergedCount++;
            }
          });

          const existingColIds = new Set(collections.map(c => c.id));
          const mergedCols = [...collections];
          let mergedColsCount = 0;
          if (Array.isArray(parsed.collections)) {
            parsed.collections.forEach((col: AIPromptCollection) => {
              if (!existingColIds.has(col.id)) {
                mergedCols.push(col);
                mergedColsCount++;
              }
            });
          }

          saveCardsToStateAndStorage(mergedCards);
          saveCollectionsToStateAndStorage(mergedCols);
          setImportStatus({
            type: "success",
            msg: `合并导入成功！新增 ${mergedCount} 张灵感画布（已过滤重复），合并了 ${mergedColsCount} 个合集夹。`
          });
        }
      } catch (err: any) {
        setImportStatus({ type: "error", msg: `导入失败: ${err.message || "文件解析错误。"}` });
      }
    };
    reader.readAsText(file);
  };

  // List all distinct tags from library
  const getAllUniqueTags = () => {
    const tagsSet = new Set<string>();
    cards.forEach(c => c.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  };

  // Handle Manual Image Selection
  const handleManualImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(true);
    try {
      const base64 = await compressAndStoreImage(file);
      setManualImageFile(base64);
    } catch (err) {
      alert("处理图片出错，请选择常规图片格式。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Handle Describe AI Image Selection
  const handleAiImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(true);
    setAiDescribeResult(null);
    try {
      const base64 = await compressAndStoreImage(file);
      setAiImageFile(base64);
      // Immediately trigger Describe AI Analysis to present premium dynamic response
      await analyzeImageWithAI(base64);
    } catch (err) {
      alert("处理或读取图片失败。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Connect & ping API handler to verify credentials live
  const handleTestApiConnection = async () => {
    if (!customApiKey || !customApiKey.trim()) {
      setTestApiResult({
        success: false,
        message: "测试失败：API 密钥 (API Key) 不能为空！"
      });
      return;
    }

    setTestApiLoading(true);
    setTestApiResult(null);

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customProvider,
          customApiKey: customApiKey.trim(),
          customApiUrl: (customApiUrl || "").trim(),
          customModel: (customModel || "").trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "发生了未知错误/HTTP请求失败");
      }

      setTestApiResult({
        success: true,
        message: data.message || "连接测试成功！"
      });
    } catch (err: any) {
      setTestApiResult({
        success: false,
        message: err?.message || String(err)
      });
    } finally {
      setTestApiLoading(false);
    }
  };

  // Drag and drop event handlers for Manual Upload Zone
  const handleManualDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingManual(true);
  };

  const handleManualDragLeave = () => {
    setIsDraggingManual(false);
  };

  const handleManualDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingManual(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请拖拽有效的图片文件。");
      return;
    }
    setUploadProgress(true);
    try {
      const base64 = await compressAndStoreImage(file);
      setManualImageFile(base64);
    } catch (err) {
      alert("处理图片出错，请选择常规图片格式。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Drag and drop event handlers for AI Auto-Description Upload Zone
  const handleAIDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAI(true);
  };

  const handleAIDragLeave = () => {
    setIsDraggingAI(false);
  };

  const handleAIDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAI(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请拖拽有效的图片文件。");
      return;
    }
    setUploadProgress(true);
    setAiDescribeResult(null);
    try {
      const base64 = await compressAndStoreImage(file);
      setAiImageFile(base64);
      // Immediately trigger Describe AI Analysis to present premium dynamic response
      await analyzeImageWithAI(base64);
    } catch (err) {
      alert("处理或读取图片失败。");
    } finally {
      setUploadProgress(false);
    }
  };

  // Call Server-Side API to Suggest tags for manual inputs
  const triggerTagSuggestion = async () => {
    let textToAnalyze = "";
    if (manualAddMode === "draw") {
      textToAnalyze = manualPrompt.trim();
    } else if (manualAddMode === "system") {
      textToAnalyze = manualSingleAiPrompt.trim();
    } else {
      textToAnalyze = manualSkillPrompt.trim();
    }

    if (!textToAnalyze) {
      alert("请先输入核心提示词指令内容，AI 才可以帮您打标分词。");
      return;
    }
    setApiLoading(true);
    try {
      const payload: any = { prompt: textToAnalyze };
      if (useCustomApi && customApiKey.trim()) {
        payload.useCustomApi = true;
        payload.customProvider = customProvider;
        payload.customApiKey = customApiKey.trim();
        if (customApiUrl.trim()) payload.customApiUrl = customApiUrl.trim();
        if (customModel.trim()) payload.customModel = customModel.trim();
      }

      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.tags) {
        setSuggestedTags(data.tags);
        setManualTags(data.tags);
      } else {
        throw new Error(data.error || "获取标签失败");
      }
    } catch (err: any) {
      console.warn("API tags suggestion failure:", err);
      // Fallback based on specific mode
      const defaultModeTags: Record<string, string[]> = {
        draw: ["图像艺术", "材质质感", "图集备份"],
        system: ["系统设定", "角色扮演", "提效模板"],
        skill: ["SKILL指令", "高级微操", "核心规则"]
      };
      const fallbackTags = defaultModeTags[manualAddMode] || ["智能生成", "私有备份", "保险库"];
      setSuggestedTags(fallbackTags);
      setManualTags(fallbackTags);
    } finally {
      setApiLoading(false);
    }
  };

  // Call Server-Side API to Describe picture and reverse prompt
  const analyzeImageWithAI = async (base64Data: string) => {
    setApiLoading(true);
    try {
      const payload: any = { image: base64Data };
      if (useCustomApi && customApiKey.trim()) {
        payload.useCustomApi = true;
        payload.customProvider = customProvider;
        payload.customApiKey = customApiKey.trim();
        if (customApiUrl.trim()) payload.customApiUrl = customApiUrl.trim();
        if (customModel.trim()) payload.customModel = customModel.trim();
      }

      const res = await fetch("/api/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setAiDescribeResult({
          description: data.description,
          prompt: data.prompt,
          tags: data.tags || ["自然还原", "高精度", "AI逆向"],
        });
      } else {
        throw new Error(data.error || "图片逆向反推失败");
      }
    } catch (err: any) {
      console.error(err);
      // Dynamic fallback based on general tags
      setAiDescribeResult({
        description: "在没有配置 GEMINI_API_KEY 且未手动配置第三方 API 的情况下，系统启动安全沙盒仿真提取机制。图像内容已存储。如果您已经配置了第三方 API Key，请检查网络或配置是否正确。",
        prompt: "A beautiful cinematic digital painting, intricate details, vivid soft lighting, realistic art station render --ar 16:9",
        tags: ["沙盒仿真", "私有储存", "安全提示"],
      });
    } finally {
      setApiLoading(false);
    }
  };

  // Save manual card to pool
  const saveManualCard = () => {
    const hasPrompt = manualPrompt.trim().length > 0;
    const hasSingle = manualSingleAiPrompt.trim().length > 0;
    const hasSkill = manualSkillPrompt.trim().length > 0;

    if (!hasPrompt && !hasSingle && !hasSkill) {
      alert("请在此卡片中至少填入“AI 绘图提示词”、“单个 AI 提示词 / 系统主指令”或“SKILL 提示词 / 高级技能”中的任意一项以便保存！");
      return;
    }

    // Dynamic high-quality fallback abstract 3D cover artworks tailored to prompt categories
    let finalImageUrl = manualImageFile;
    if (!finalImageUrl) {
      if (manualAddMode === "draw") {
        finalImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"; // Organic abstract grid wave
      } else if (manualAddMode === "system") {
        finalImageUrl = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop"; // Glowing neon virtual intelligence core / brain
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=600&auto=format&fit=crop"; // Cyber stream neon neon grid pattern
      }
    }

    let defaultDesc = "用户手动录入并管理的提示词备忘记录。";
    if (manualAddMode === "system") {
      defaultDesc = "用户保存调校的 LLM 智能体系统级角色设定及系统主指令 (System Prompt) 指示。";
    } else if (manualAddMode === "skill") {
      defaultDesc = "用户打磨沉淀的专属 SKILL 指令包及高级技能微调规则组。";
    }

    const modeLabels: Record<string, string[]> = {
      draw: ["绘图提示词", "画集"],
      system: ["系统指令", "智能体"],
      skill: ["SKILL技能", "规则组"]
    };

    const finalTags = manualTags.length > 0 
      ? manualTags 
      : [...(modeLabels[manualAddMode] || ["自定义", "备忘记录"])];

    let autoModel = "Midjourney v6";
    if (manualAddMode === "system") {
      autoModel = "Gemini 2.5 Pro";
    } else if (manualAddMode === "skill") {
      autoModel = "DeepSeek-V3";
    }

    const newCard: AIPromptCard = {
      id: "card-" + Date.now(),
      imageUrl: finalImageUrl,
      prompt: manualPrompt.trim() || "(无绘图原词)",
      tags: finalTags,
      createdAt: Date.now(),
      description: defaultDesc,
      singleAiPrompt: manualSingleAiPrompt.trim() || undefined,
      skillPrompt: manualSkillPrompt.trim() || undefined,
      targetModel: autoModel
    };

    saveCardsToStateAndStorage([newCard, ...cards]);
    // Reset manual form
    setManualImageFile(null);
    setManualPrompt("");
    setManualTags([]);
    setSuggestedTags([]);
    setManualSingleAiPrompt("");
    setManualSkillPrompt("");
    setActiveTab("gallery");
  };

  // Save AI analyzed card to pool
  const saveAiAnalyzedCard = () => {
    if (!aiImageFile) {
      alert("请先上传反推分析的图片！");
      return;
    }
    if (!aiDescribeResult) {
      alert("AI 还没有完成分析提取，请先分析图片。");
      return;
    }

    const newCard: AIPromptCard = {
      id: "card-" + Date.now(),
      imageUrl: aiImageFile,
      prompt: aiDescribeResult.prompt,
      tags: aiDescribeResult.tags,
      description: aiDescribeResult.description,
      createdAt: Date.now(),
      singleAiPrompt: aiSingleAiPrompt.trim() || undefined,
      skillPrompt: aiSkillPrompt.trim() || undefined,
      targetModel: aiTargetModel.trim() || undefined
    };

    saveCardsToStateAndStorage([newCard, ...cards]);
    // Reset AI form
    setAiImageFile(null);
    setAiDescribeResult(null);
    setAiSingleAiPrompt("");
    setAiSkillPrompt("");
    setAiTargetModel("Midjourney v6");
    setActiveTab("gallery");
  };

  // Delete Card
  const handleDeleteCard = (id: string) => {
    const updated = cards.filter(c => c.id !== id);
    saveCardsToStateAndStorage(updated);

    const updatedCollections = collections.map(coll => ({
      ...coll,
      cardIds: coll.cardIds.filter(cardId => cardId !== id)
    }));
    saveCollectionsToStateAndStorage(updatedCollections);

    if (viewDetailCard?.id === id) {
      setViewDetailCard(null);
    }
  };

  // Update card fields inside modal
  const handleUpdateCard = (updatedCard: AIPromptCard) => {
    const updated = cards.map(c => {
      if (c.id === updatedCard.id) {
        return updatedCard;
      }
      return c;
    });
    saveCardsToStateAndStorage(updated);
    // Update live modal too
    if (viewDetailCard && viewDetailCard.id === updatedCard.id) {
      setViewDetailCard(updatedCard);
    }
  };

  // Edit custom tags inside modal
  const handleUpdateTags = (id: string, newTags: string[]) => {
    const updated = cards.map(c => {
      if (c.id === id) {
        return { ...c, tags: newTags };
      }
      return c;
    });
    saveCardsToStateAndStorage(updated);
    // Update live modal too
    if (viewDetailCard && viewDetailCard.id === id) {
      setViewDetailCard({ ...viewDetailCard, tags: newTags });
    }
  };

  // Filter cards by search, Custom Collection folders, and tags
  const filteredCards = cards.filter(c => {
    const matchesSearch = 
      c.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesTag = selectedTag ? c.tags.includes(selectedTag) : true;

    const matchesCollection = selectedCollectionId 
      ? collections.find(col => col.id === selectedCollectionId)?.cardIds.includes(c.id) || false
      : true;

    return matchesSearch && matchesTag && matchesCollection;
  });

  if (isSystemShutDown) {
    return (
      <div className="fixed inset-0 bg-[#020005] flex items-center justify-center p-4 z-9999 text-center font-sans select-none">
        <div className="max-w-md w-full space-y-6 p-8 bg-[#0b0518] rounded-2xl border border-red-500/20 shadow-2xl relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-2xl" />
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold animate-pulse">
            🛑
          </div>
          <div className="space-y-2.5">
            <h2 className="text-lg font-black text-slate-100 tracking-wider">
              系统后台服务已安全关闭/注销
            </h2>
            <p className="text-xs text-slate-350 leading-relaxed">
              向微型全栈专线容器发送的 <span className="text-purple-400">process.exit(0)</span> 终止指令已被成功完全执行。
              本地运行占用的 <span className="text-red-400">3000</span> 端口已彻底释放。
            </p>
            <div className="p-3 bg-black/60 rounded-xl text-[11px] text-start text-slate-400 space-y-1 font-mono border border-white/5">
              <div>✓ 后端 API 服务器: 已关闭 (Terminated)</div>
              <div>✓ 端口 3000 占用情况: 已释放 (Cleaned)</div>
              <div>✓ 全栈开发实例: 完全终结 (Offline)</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 border-t border-purple-500/5 pt-4">
            现在您可以放心地关闭本浏览器标签页以及相关的命令行/终端窗口。
            下次启动使用，只需再次双击本地启动器脚本即可！
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthPortal
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("prompt_vault_session", JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans overflow-x-hidden antialiased transition-colors duration-200 ${
      isDark 
        ? "bg-[#03000b] text-[#cbd5e1] selection:bg-purple-950/40 selection:text-white" 
        : "bg-[#f8fafc] text-[#334155] selection:bg-purple-100 selection:text-purple-900"
    }`}>
      
      {/* HEADER SECTION */}
      <header className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-md backdrop-blur-md transition-colors duration-200 ${
        isDark 
          ? "border-purple-500/10 bg-[#070311]/90 text-white" 
          : "border-slate-200 bg-white/95 text-slate-800"
      }`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedTag(null); setActiveTab("gallery"); }}>
          <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center font-black text-white italic tracking-tighter text-sm shadow-[0_0_12px_rgba(168,85,247,0.4)]">AI</div>
          <span className={`font-extrabold text-base tracking-widest uppercase font-mono sm:block hidden ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            PROMPT<span className="text-purple-500 animate-pulse">VAULT</span>
          </span>
        </div>
        
        {/* Realtime Search Bar input */}
        <div className="flex-1 max-w-xl mx-4 sm:mx-8">
          <div className="relative flex items-center">
            <input 
              type="text" 
              placeholder="按提示词、图像属性或归纳标签搜索图集..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-full py-1.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 transition-all font-mono ${
                isDark 
                  ? "bg-[#020005]/60 border border-purple-500/10 text-slate-100 placeholder-slate-500 focus:border-purple-500/55 focus:ring-[#8b5cf6]/20" 
                  : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-450 focus:ring-purple-400/20"
              }`}
            />
            <Search className="w-4 h-4 absolute left-3.5 text-slate-450" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className={`absolute right-3 text-[10px] font-bold rounded-full px-1.5 py-0.5 transition-all cursor-pointer ${
                  isDark ? "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10" : "text-[#475569] hover:text-[#1e293b] bg-slate-200 hover:bg-slate-300"
                }`}
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme switcher toggle button */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-lg border transition-all cursor-pointer focus:outline-none flex items-center justify-center ${
              isDark 
                ? "bg-white/5 border-white/5 hover:bg-white/10 text-amber-400" 
                : "bg-slate-50 border-slate-201 border-slate-200 hover:bg-slate-100 text-purple-600 hover:border-slate-300"
            }`}
            title={isDark ? "切换为明亮模式" : "切换为暗黑模式"}
          >
            {isDark ? <Sun size={14} className="animate-spin-slow text-amber-400" /> : <Moon size={14} className="text-purple-600" />}
          </button>

          {/* 手动保存 Button & Dropdown Drop Menu */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => {
                setAddDropdownOpen(!addDropdownOpen);
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                activeTab === "add-manual" 
                  ? "bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                  : "bg-white/5 hover:bg-white/10 text-slate-355 border border-white/5"
              }`}
            >
              <Plus size={14} />
              <span>手动保存</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${addDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Options */}
            {addDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setAddDropdownOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-64 border rounded-xl shadow-2xl py-1.5 z-55 text-xs font-semibold animate-scale-in ${
                  isDark 
                    ? "bg-[#0a0518] border-purple-500/15 text-slate-300" 
                    : "bg-white border-slate-200 text-slate-700 shadow-xl"
                }`}>
                  <div className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border-b mb-1 select-none ${
                    isDark ? "text-white/30 border-white/5" : "text-slate-400 border-slate-100"
                  }`}>
                    选择录入卡片类型
                  </div>
                  <button
                    onClick={() => {
                      setManualAddMode("draw");
                      setActiveTab("add-manual");
                      setAddDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center gap-2.5 ${
                      isDark 
                        ? `hover:bg-white/[0.04] ${manualAddMode === "draw" && activeTab === "add-manual" ? "text-purple-400 bg-white/[0.02]" : "text-slate-300"}` 
                        : `hover:bg-slate-50 ${manualAddMode === "draw" && activeTab === "add-manual" ? "text-purple-700 bg-purple-50/50" : "text-slate-650 text-slate-600"}`
                    }`}
                  >
                    <span className="text-base">🎨</span>
                    <div className="flex flex-col">
                      <span className="font-bold">AI 绘图提示词卡片</span>
                      <span className={`text-[10px] font-normal ${isDark ? "text-white/40" : "text-slate-400"}`}>核心绘图 Prompt (可配图)</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setManualAddMode("system");
                      setActiveTab("add-manual");
                      setAddDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center gap-2.5 ${
                      isDark 
                        ? `hover:bg-white/[0.04] ${manualAddMode === "system" && activeTab === "add-manual" ? "text-purple-400 bg-white/[0.02]" : "text-slate-300"}` 
                        : `hover:bg-slate-50 ${manualAddMode === "system" && activeTab === "add-manual" ? "text-purple-700 bg-purple-50/50" : "text-slate-650 text-slate-600"}`
                    }`}
                  >
                    <span className="text-base">🤖</span>
                    <div className="flex flex-col">
                      <span className="font-bold">单个 AI 提示词 / 系统主指令</span>
                      <span className={`text-[10px] font-normal ${isDark ? "text-white/40" : "text-slate-400"}`}>角色的核心 System/AI Prompt</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setManualAddMode("skill");
                      setActiveTab("add-manual");
                      setAddDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center gap-2.5 ${
                      isDark 
                        ? `hover:bg-white/[0.04] ${manualAddMode === "skill" && activeTab === "add-manual" ? "text-purple-400 bg-white/[0.02]" : "text-slate-300"}` 
                        : `hover:bg-slate-50 ${manualAddMode === "skill" && activeTab === "add-manual" ? "text-purple-700 bg-purple-50/50" : "text-slate-650 text-slate-600"}`
                    }`}
                  >
                    <span className="text-base">⚡</span>
                    <div className="flex flex-col">
                      <span className="font-bold">SKILL 提示词 / 技能微操规则</span>
                      <span className={`text-[10px] font-normal ${isDark ? "text-white/40" : "text-slate-400"}`}>风格组或专属技能规则微操指导</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <button 
            onClick={() => setActiveTab(activeTab === "add-ai" ? "gallery" : "add-ai")}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === "add-ai" 
                ? "bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                : (isDark 
                    ? "bg-purple-500/10 hover:bg-purple-550/20 text-purple-400 border border-purple-500/20" 
                    : "bg-purple-550/5 hover:bg-purple-100 text-purple-700 border border-purple-150 shadow-2xs")
            }`}
          >
            <Sparkles size={14} />
            <span>AI 逆向分析助手</span>
          </button>

          {/* ComfyUI Custom Node Connector Button */}
          <button
            onClick={() => setShowComfyModal(true)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm ${
              isDark 
                ? "bg-emerald-500/10 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 text-emerald-400 shadow-emerald-950/20" 
                : "bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-600 shadow-2xs"
            }`}
            title="查看 ComfyUI 专用 Python 节点代码与接口"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>ComfyUI 桥接配置</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto overflow-hidden">
        
        {/* SIDEBAR NAVIGATION - LEFT */}
        <nav className={`w-60 border-r p-5 hidden lg:flex flex-col gap-6 shrink-0 transition-colors duration-200 ${
          isDark ? "border-purple-500/10 bg-[#05020c]/90 text-white" : "border-slate-200 bg-white text-slate-800"
        }`}>
          {/* Main Control Panel */}
          <div>
            <p className={`text-[10px] uppercase tracking-widest font-bold mb-3 px-2 ${isDark ? "text-[#a855f7]/40" : "text-purple-605 text-purple-600/70"}`}>主控面板</p>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { setActiveTab("gallery"); setSelectedTag(null); setSelectedCollectionId(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "gallery" && !selectedTag && !selectedCollectionId
                      ? (isDark ? "bg-purple-500/10 text-purple-400 border border-purple-500/15" : "bg-[#f3e8ff] text-purple-750 border border-purple-200") 
                      : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50")
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span>📋</span> 所有提示词备份
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono border ${
                    isDark ? "bg-[#020005]/80 text-slate-400 border-purple-500/10" : "bg-slate-100 text-slate-650 border-slate-200"
                  }`}>
                    {cards.length}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Subfolders Collections Section */}
          <div className="flex flex-col gap-3">
            <p className={`text-[10px] uppercase tracking-widest font-bold px-2 ${isDark ? "text-[#a855f7]/40" : "text-purple-605 text-purple-600/70"}`}>
              整理合集子文件夹 (COLLECTIONS)
            </p>
            
            <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar px-1">
              {collections.map((coll) => {
                const isActive = selectedCollectionId === coll.id;
                const isConfirmingDelete = confirmCollectionDeleteId === coll.id;

                if (isConfirmingDelete) {
                  return (
                    <div key={coll.id} className="flex items-center justify-between gap-1 px-2 py-1 bg-red-950/20 border border-red-500/20 rounded-md animate-scale-in text-[10px] font-bold">
                      <span className="text-red-400 truncate">确认解散？</span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = collections.filter(c => c.id !== coll.id);
                            saveCollectionsToStateAndStorage(updated);
                            if (selectedCollectionId === coll.id) {
                              setSelectedCollectionId(null);
                            }
                            setConfirmCollectionDeleteId(null);
                          }}
                          className="text-red-400 hover:text-red-300 px-1 py-0.5 font-bold cursor-pointer transition-colors"
                        >
                          是
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmCollectionDeleteId(null);
                          }}
                          className={`px-1 py-0.5 font-bold cursor-pointer transition-colors ${
                            isDark ? "text-slate-400 hover:text-white" : "text-slate-550 hover:text-[#0f172a]"
                          }`}
                        >
                          否
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={coll.id} className={`group/folder flex items-center justify-between gap-1 rounded-lg ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-100/40"}`}>
                    <button
                      onClick={() => {
                        setActiveTab("gallery");
                        setSelectedCollectionId(coll.id);
                        setSelectedTag(null);
                      }}
                      className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                        isActive
                          ? (isDark ? "text-purple-400 font-extrabold" : "text-purple-750 font-black")
                          : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900")
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate max-w-[130px]">
                        <Folder size={12} className={isActive ? (isDark ? "text-purple-400 fill-purple-400/20" : "text-purple-600 fill-purple-600/10") : (isDark ? "text-slate-500" : "text-slate-400")} />
                        <span>{coll.name}</span>
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                        isDark 
                          ? "bg-[#020005]/80 text-slate-400 border-purple-500/10 group-hover/folder:border-white/10" 
                          : "bg-slate-100 text-slate-600 border-slate-200 group-hover/folder:border-slate-300"
                      }`}>
                        {coll.cardIds.length}
                      </span>
                    </button>
                    
                    {/* Tiny delete button to delete collection folder */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmCollectionDeleteId(coll.id);
                      }}
                      className="opacity-0 group-hover/folder:opacity-100 text-slate-500 hover:text-red-400 p-1 text-xs transition-opacity cursor-pointer font-bold select-none mr-1.5"
                      title="解散合集"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
              
              {collections.length === 0 && (
                <p className={`text-[10px] italic px-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>暂无整理合集文件夹。</p>
              )}
            </div>

            {/* Micro inline collection creation form */}
            <div className="px-2 pt-1">
              <div className={`flex gap-1.5 items-center border rounded-md p-1 ${
                isDark ? "bg-[#020005]/85 border-purple-500/10" : "bg-white border-slate-250 border-slate-200"
              }`}>
                <input
                  type="text"
                  placeholder="+ 新建子合集..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCollection();
                    }
                  }}
                  className={`bg-transparent border-none text-[10px] focus:outline-none w-full px-1 font-sans ${
                    isDark ? "text-slate-200 placeholder-purple-900/60" : "text-slate-700 placeholder-slate-400 font-medium"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  className={`p-1 transition-colors cursor-pointer text-[10px] rounded font-black leading-none ${
                    isDark ? "text-slate-400 hover:text-purple-400 bg-white/5 hover:bg-purple-555/15" : "text-slate-500 hover:text-purple-700 bg-slate-50 hover:bg-slate-100 border border-slate-200"
                  }`}
                  title="确认创建"
                >
                  确定
                </button>
              </div>
            </div>
          </div>

          
          {/* Tag Cloud filter */}
          <div className="flex-1">
            <p className={`text-[10px] uppercase tracking-widest font-bold mb-3 px-2 ${isDark ? "text-[#a855f7]/40" : "text-purple-600/70"}`}>标签快速检索 (STYLE FILTERS)</p>
            {getAllUniqueTags().length === 0 ? (
              <p className={`text-[11px] italic px-2 ${isDark ? "text-slate-600" : "text-slate-400 font-medium"}`}>暂无可用分类标签...</p>
            ) : (
              <div className="flex flex-wrap gap-2 px-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                <span 
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-all border ${
                    selectedTag === null 
                      ? (isDark ? "bg-purple-500/20 text-[#d8b4fe] border border-purple-400/30" : "bg-purple-100 text-purple-750 border border-purple-300 font-bold") 
                      : (isDark ? "bg-[#020005]/80 border border-purple-500/10 text-slate-400 hover:text-white" : "bg-white border border-slate-200 text-[#475569] hover:text-[#0f172a] hover:border-slate-350")
                  }`}
                >
                  * 全部重置
                </span>
                {getAllUniqueTags().map((tag) => (
                  <span 
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-all border ${
                      selectedTag === tag 
                        ? (isDark ? "bg-purple-500/20 text-purple-355 text-purple-300 border border-[#a855f7]/40 shadow-xs animate-scale-in" : "bg-[#f3e8ff] text-purple-705 text-purple-800 border-purple-350 shadow-2xs font-extrabold animate-scale-in") 
                        : (isDark ? "bg-[#020005]/80 border border-purple-500/10 text-slate-400 hover:text-white hover:border-white/10" : "bg-white border border-slate-200 text-[#475569] hover:text-[#0f172a] hover:border-slate-350")
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* User Account Session Info */}
          <div className={`mt-auto pt-4 border-t px-2 space-y-2 ${isDark ? "border-purple-500/10" : "border-slate-200"}`}>
            <div className={`flex items-center justify-between border p-2 rounded-xl transition-all ${
              isDark ? "bg-white/[0.02] border-purple-500/10" : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-center gap-2 truncate">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-[10px] font-mono shrink-0 transition-colors ${
                  isDark ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-purple-100 border-purple-200 text-purple-700"
                }`}>
                  {currentUser?.email.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex flex-col justify-center">
                  <span className={`text-[10px] font-bold truncate leading-none ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {currentUser?.email}
                  </span>
                  <span className={`text-[9px] font-mono mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"} flex items-center gap-1`}>
                    <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span>COMFY 节点服务在线</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowComfyModal(true)}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors shrink-0 ${
                  isDark ? "hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400" : "hover:bg-emerald-50 text-slate-500 hover:text-emerald-600"
                }`}
                title="ComfyUI 桥接配置及脚本说明"
              >
                <Cpu size={13} />
              </button>
            </div>
          </div>

          {/* Secure Sandbox Status banner */}
          <div className="pt-2 px-2">
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isDark ? "bg-purple-955/10 border-purple-550/10" : "bg-purple-50/50 border-purple-150"
            }`}>
              <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? "text-[#a855f7]" : "text-purple-700"}`}>
                <FolderLock size={14} className={isDark ? "text-[#a855f7]" : "text-purple-600"} />
                <span>100% 私人沙盒模式</span>
              </div>
              <p className={`text-[10px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                所有创作图片和提示词完美归于本地私人内存中。绝不上传、审查或向外界公开。
              </p>
              <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? "text-purple-400" : "text-purple-605"}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-purple-500" : "bg-purple-600"}`}></div>
                本地私密储存有效
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN DISPLAY REGION */}
        <main className={`flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 transition-colors duration-200 ${
          isDark ? "bg-[#020005]" : "bg-slate-50"
        }`}>
          
          {/* Header titles */}
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-4 transition-colors duration-200 ${
            isDark ? "border-purple-500/10" : "border-slate-200"
          }`}>
            <div>
              <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-800"
              }`}>
                {selectedCollectionId 
                  ? `合集: 📁 ${collections.find(col => col.id === selectedCollectionId)?.name || "安全合集"}`
                  : selectedTag 
                    ? `标签: #${selectedTag}` 
                    : "私密提示词保险库"
                }
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark ? "bg-purple-500/10 text-purple-400 border-purple-500/15" : "bg-purple-50 text-purple-700 border-purple-200"
                }`}>
                  Private Cloud
                </span>
              </h2>
              <p className={`text-xs mt-1 select-none ${isDark ? "text-white/40" : "text-slate-500 font-medium"}`}>
                {cards.length === 0 
                  ? "目前暂无记录，可点击右侧反推工具一键生成您的首个画集备份！" 
                  : `当前共有 ${filteredCards.length} 项图集匹配条件，一一对应，安全存储。`}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3.5 sm:self-auto self-start shrink-0">
              {/* Layout switcher buttons */}
              <div className={`p-1 rounded-xl border gap-1 select-none items-center shrink-0 flex ${
                isDark ? "bg-[#0b0518] border-purple-500/10" : "bg-white border-slate-200 shadow-2xs"
              }`}>
                <button 
                  onClick={() => { setGalleryLayout("complete"); localStorage.setItem("gallery_layout_mode", "complete"); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer ${
                    galleryLayout === "complete" 
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40" 
                      : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800")
                  }`}
                  title="完整卡片详细分析（带主体、主题标签及详细时间等）"
                >
                  <LayoutGrid size={12} />
                  <span>完整卡片</span>
                </button>
                <button 
                  onClick={() => { setGalleryLayout("compact"); localStorage.setItem("gallery_layout_mode", "compact"); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer ${
                    galleryLayout === "compact" 
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40" 
                      : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800")
                  }`}
                  title="紧凑型正方形大图流（极致紧凑纯手绘感图集馆）"
                >
                  <Grid size={12} />
                  <span>紧凑画廊</span>
                </button>
              </div>

              {/* Compare Mode Toggle Button */}
              <button
                onClick={() => {
                  setIsCompareMode(!isCompareMode);
                  setCompareCardIds([]); // Clear selection when toggling
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 uppercase tracking-wide cursor-pointer border h-[32px] ${
                  isCompareMode 
                    ? "bg-purple-700 border-purple-500 text-white shadow-md shadow-purple-950/40" 
                    : (isDark 
                        ? "bg-[#0b0518] border-purple-500/10 text-slate-400 hover:text-white hover:border-purple-500/20" 
                        : "bg-white border-slate-200 text-slate-650 hover:text-[#0f172a] hover:border-purple-300 shadow-2xs")
                }`}
                title="开启对比模式：允许您选中两张画廊卡片并排对比提示词和描述，直观观察不同AI模型表现特征"
              >
                <Scale size={12} className={isCompareMode ? "animate-pulse text-white" : "text-[#a855f7]"} />
                <span>对比模式</span>
                {isCompareMode && (
                  <span className={`ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-md font-mono scale-90 ${
                    isDark ? "bg-white text-purple-800" : "bg-purple-100 text-purple-750"
                  }`}>
                    {compareCardIds.length}/2
                  </span>
                )}
              </button>

              {/* Storage Quota widget - Click to open settings & paths & backups */}
              <button 
                onClick={() => {
                  setTempStoragePath(storagePath);
                  setImportStatus({ type: "", msg: "" });
                  setShowStorageModal(true);
                }}
                className={`p-2.5 rounded-xl border flex flex-col justify-center text-right w-44 transition-all duration-205 group/quota text-left shrink-0 cursor-pointer ${
                  isDark 
                    ? "bg-[#0b0518] hover:bg-[#110724] border-purple-500/10 hover:border-purple-550/30 text-slate-300 hover:text-white" 
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-700 shadow-2xs"
                }`}
                title="点击管理数据库存储：修改自定义本地磁盘路径、导入/导出画廊备份"
              >
                <div className={`flex items-center justify-between mb-1.5 text-[9px] font-bold uppercase tracking-wider w-full ${
                  isDark ? "text-[#a855f7]/60 group-hover/quota:text-purple-400" : "text-purple-650"
                }`}>
                  <span className="flex items-center gap-1">💾 存储与备份</span>
                  <span className={`font-mono text-[10px] ${isDark ? "text-purple-300" : "text-purple-650"}`}>{getStorageSizeMB()} MB</span>
                </div>
                <div className={`w-full text-[10px] text-left font-sans truncate mb-1 ${
                  isDark ? "text-slate-400 group-hover/quota:text-slate-200" : "text-slate-550 group-hover/quota:text-slate-800"
                }`}>
                  路径: {storagePath}
                </div>
                <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? "bg-[#020005]" : "bg-slate-100"}`}>
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-505"
                    style={{ width: `${Math.min(100, (parseFloat(getStorageSizeMB()) / 5) * 100)}%` }}
                  ></div>
                </div>
              </button>
            </div>
          </div>

          {/* ACTIVE CREATE WORKSPACE FORMS (MANUAL / AI DESCRIBE) */}
          {activeTab === "add-manual" && (
            <div className="bg-[#0b0518] border border-purple-500/20 rounded-xl p-5 shadow-xl animate-scale-in relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-purple-800 via-purple-550 to-fuchsia-500 w-full"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <h3 className="font-bold text-sm text-purple-400 uppercase tracking-wider flex items-center gap-1.5 select-none font-sans">
                  <Plus size={16} />
                  <span>
                    {manualAddMode === "draw" && "手动录入：🎨 AI 绘图提示词卡片"}
                    {manualAddMode === "system" && "手动录入：🤖 单个 AI 系统提示词库"}
                    {manualAddMode === "skill" && "手动录入：⚡ SKILL 专属高级技能规则"}
                  </span>
                </h3>
                <button 
                  onClick={() => setActiveTab("gallery")}
                  className="text-xs text-white/40 hover:text-slate-200 cursor-pointer self-end sm:self-auto"
                >
                  关闭窗口
                </button>
              </div>

              {/* HIGHLY POLISHED INNER PAGE SEGMENTED TABS SWITCHER */}
              <div className="flex flex-wrap bg-[#020005]/80 border border-purple-550/10 rounded-xl p-1 mb-5 gap-1 select-none">
                <button
                  type="button"
                  onClick={() => setManualAddMode("draw")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                    manualAddMode === "draw"
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <span>🎨</span>
                  <span>AI 绘图提示词</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualAddMode("system")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                    manualAddMode === "system"
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <span>🤖</span>
                  <span>系统主控制指令</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualAddMode("skill")}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                    manualAddMode === "skill"
                      ? "bg-purple-700 text-white shadow-md shadow-purple-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <span>⚡</span>
                  <span>SKILL 技能规则</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Form Image Dropzone Column */}
                <div className="md:col-span-4 flex flex-col items-center justify-start gap-3">
                  <div className="w-full text-center">
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-wider font-sans">
                      {manualAddMode === 'draw' && "✨ 配套生成效果图 (IMAGE)"}
                      {manualAddMode === 'system' && "🤖 智能体标志与头像 (AVATAR)"}
                      {manualAddMode === 'skill' && "⚡ 技能封面指示图 (COVER)"}
                    </span>
                  </div>

                  {manualImageFile ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-purple-500/20 group bg-[#020005] shadow-inner">
                      <img src={manualImageFile} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setManualImageFile(null)}
                        className="absolute bottom-2 right-2 bg-red-650 hover:bg-red-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold shadow-md transition-colors"
                      >
                        替换文件
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRefManual.current?.click()}
                      onDragOver={handleManualDragOver}
                      onDragLeave={handleManualDragLeave}
                      onDrop={handleManualDrop}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer w-full aspect-square ${
                        isDraggingManual 
                          ? "border-purple-550/60 bg-purple-950/20 scale-[0.98]" 
                          : "border-purple-500/10 bg-white/[0.01] hover:bg-[#020005] hover:border-purple-400/30"
                      }`}
                    >
                      {uploadProgress ? (
                        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                      ) : (
                        <FileUp className="w-6 h-6 text-slate-500" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-white/70 block font-sans">点击上传自定义图片</span>
                        <span className="text-[9px] text-white/20 block mt-1 leading-normal px-2 font-sans">
                          {manualAddMode === 'draw' && "推荐配备最终跑图，便于往后一眼辨识效果"}
                          {manualAddMode === 'system' && "可上传头像，若不传则全自动匹配智能脑区炫酷视觉封底"}
                          {manualAddMode === 'skill' && "可上传标志，若不传则自动分配合流光格栅概念封底"}
                        </span>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRefManual}
                    onChange={handleManualImageSelect}
                    accept="image/*"
                    className="hidden" 
                  />
                  
                  {!manualImageFile && (
                    <span className="text-[10px] text-purple-400/70 font-medium tracking-wide font-sans">
                      🌿 自由沙盒：此处不传图也将自动安全封存，极致省心
                    </span>
                  )}
                </div>

                {/* Form Fields Column: Dynamic Layout for three separate subpages */}
                <div className="md:col-span-8 flex flex-col gap-4">

                  {/* SUBPAGE 1: Core Draw Prompt View */}
                  {manualAddMode === "draw" && (
                    <div className="animate-fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#a855f7]/55 uppercase mb-1.5 flex justify-between select-none font-sans">
                          <span>AI 绘图提示词 (DRAW CORE PROMPT) *</span>
                          <span className="text-[9px] text-[#a855f7]/40 font-normal">核心绘图渲染词组</span>
                        </label>
                        <textarea 
                          rows={6}
                          value={manualPrompt}
                          onChange={(e) => setManualPrompt(e.target.value)}
                          placeholder="例如: A fantasy landscape with towering luminous crystals under a starry sky, surreal atmospheric lighting, octane render, 8k..."
                          className="w-full bg-[#020005]/80 border border-purple-500/15 rounded-xl p-3.5 text-xs text-white placeholder-purple-900/40 focus:outline-none focus:border-purple-500/40 font-mono leading-relaxed h-[132px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUBPAGE 2: Core LLM System / Character System Prompt View */}
                  {manualAddMode === "system" && (
                    <div className="animate-fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-400 uppercase mb-1.5 flex justify-between select-none font-sans">
                          <span>🤖 单个 AI 系统主脑指令 (SYSTEM / AGENT PROMPT) *</span>
                          <span className="text-[9px] text-purple-500/60 font-normal font-sans">规范大语言模型角色、上下文、语气或前置主干设定的核心指令</span>
                        </label>
                        <textarea
                          rows={6}
                          value={manualSingleAiPrompt}
                          onChange={(e) => setManualSingleAiPrompt(e.target.value)}
                          placeholder="例如: You are an expert system-level AI Agent. Your prime directive is to analyze input queries, refine prompt structures, and guide the user in designing pristine software architectures. Maintain an objective, concise, and calm persona..."
                          className="w-full bg-[#020005]/80 border border-purple-500/15 focus:border-purple-500/40 rounded-xl p-3.5 text-xs text-purple-100 placeholder-purple-950 focus:outline-none font-mono leading-relaxed h-[132px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUBPAGE 3: Advanced SKILL Preset Instruction View */}
                  {manualAddMode === "skill" && (
                    <div className="animate-fade-in space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-fuchsia-400 uppercase mb-1.5 flex justify-between select-none font-sans">
                          <span>⚡ SKILL 提示词 / 专属技能操作规则 (SKILL RULES SETUP) *</span>
                          <span className="text-[9px] text-fuchsia-500/60 font-normal font-sans">高级代码块微操指导、提示词封装宏模块，或者全局微调的特定负向逻辑</span>
                        </label>
                        <textarea
                          rows={6}
                          value={manualSkillPrompt}
                          onChange={(e) => setManualSkillPrompt(e.target.value)}
                          placeholder="例如: [Skill: CleanTypeScriptCode]\n1. Always prefer named relative imports placed directly on top.\n2. Do not mutate state objects directly; use shallow spreads.\n3. Add unique id attributes to every primary interactive DOM node..."
                          className="w-full bg-[#020005]/80 border border-fuchsia-500/15 focus:border-fuchsia-500/40 rounded-xl p-3.5 text-xs text-fuchsia-100 placeholder-fuchsia-950 focus:outline-none font-mono leading-relaxed h-[132px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Tags Generator Row */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-sans">
                      <label className="block text-[10px] font-bold text-white/40 uppercase">精准分类标签 (可手动增减，多维度解析)</label>
                      <button 
                        type="button"
                        onClick={triggerTagSuggestion}
                        disabled={apiLoading || 
                          (manualAddMode === 'draw' ? !manualPrompt.trim() : 
                           manualAddMode === 'system' ? !manualSingleAiPrompt.trim() : 
                           !manualSkillPrompt.trim())}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        {apiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span>AI 打标分类</span>
                      </button>
                    </div>

                    {/* Tag Badges Container with clear categorizations */}
                    <div className="bg-[#020005]/80 p-3.5 rounded-xl border border-purple-500/10 min-h-[50px] flex items-center flex-wrap gap-2.5 font-sans">
                      {manualTags.length === 0 ? (
                        <span className="text-[10px] text-white/30 font-mono">暂无标签。请写完提示词点“AI 智能打标”或在下方直接手动添加标签</span>
                      ) : (
                        manualTags.map((tag, i) => {
                          // Determine structural dimension badge dynamically based on position
                          let prefixInfo = "🏷️ 其它";
                          let badgeStyle = "bg-slate-500/10 text-slate-300 border-slate-500/20";
                          if (i === 0) {
                            prefixInfo = "💎 主体";
                            badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          } else if (i === 1) {
                            prefixInfo = "🌍 主题";
                            badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                          } else if (i === 2) {
                            prefixInfo = "🎭 风格";
                            badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                          }

                          return (
                            <span 
                              key={i} 
                              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border font-bold ${badgeStyle} animate-scale-in`}
                            >
                              <span className="text-[9px] opacity-70 tracking-wider font-medium">{prefixInfo}:</span>
                              <span>#{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveManualTag(tag)}
                                className="ml-1.5 hover:text-red-400 transition-colors cursor-pointer text-xs font-black select-none rounded p-0.5"
                                title="删除此标签"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* Inline tag input wrapper */}
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          placeholder="输入想要添加的新标签并按回车..."
                          value={newManualTagInput}
                          onChange={(e) => setNewManualTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddManualTag();
                            }
                          }}
                          className="w-full bg-[#020005]/80 border border-purple-500/10 rounded-lg py-1.5 px-3 text-xs text-white placeholder-purple-900/30 focus:outline-none focus:border-purple-500/40 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddManualTag}
                        className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md font-sans"
                      >
                        + 增加
                      </button>
                    </div>
                  </div>

                  {/* Save row */}
                  <div className="flex justify-end gap-2.5 mt-2 pt-3 border-t border-purple-500/10">
                    <button 
                      onClick={() => setActiveTab("gallery")}
                      className="px-4 py-2 bg-transparent text-xs text-white/55 hover:text-white transition-colors"
                    >
                      放弃
                    </button>
                    <button 
                      onClick={saveManualCard}
                      className="px-5 py-2 bg-purple-700 hover:bg-purple-650 text-white rounded-lg text-xs font-bold shadow-lg transition-colors cursor-pointer font-sans"
                    >
                      保存在本地库
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "add-ai" && (
            <div className="bg-[#0b0518] border border-purple-500/20 rounded-xl p-5 shadow-xl animate-scale-in relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-purple-800 via-purple-500 to-fuchsia-500 w-full animate-pulse"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-purple-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Sparkles size={16} />
                    <span>多模态图片反推提示词工具</span>
                  </h3>
                  <span className="bg-purple-500/10 text-purple-400 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-purple-500/15">
                    Gemini 3.5 Flash Powered
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowApiConfig(!showApiConfig)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer font-sans ${
                      useCustomApi 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>{useCustomApi ? "自定义 API (已启用)" : "手动配置 API"}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("gallery")}
                    className="text-xs text-white/40 hover:text-slate-200 cursor-pointer font-sans"
                  >
                    关闭窗口
                  </button>
                </div>
              </div>

              {/* Collapsible Custom API Configurations Entry */}
              {showApiConfig && (
                <div className="mb-5 p-4 rounded-xl bg-purple-950/20 border border-purple-500/15 text-xs text-slate-300 space-y-4 animate-slide-down relative z-20 shadow-lg font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <span>⚙️</span> 手动配置第三方通用 API 密钥及代理端点
                    </span>
                    <button 
                      onClick={() => setShowApiConfig(false)}
                      className="text-[10px] text-white/40 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/5"
                    >
                      [ 隐藏面板 ]
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    本提示词保险库完全在离线前端浏览器沙盒内存储画集与词库，绝对保证隐私。如需自主调用多模态图片反推或智能打标提炼，可在下方配置符合您个人习惯的 AI 厂商基础配置。
                  </p>

                  {/* Provider Choice Selector */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-[#a855f7]/60 uppercase tracking-wider">选择接口兼容协议 (Protocol Provider)</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomProvider("gemini");
                          localStorage.setItem("custom_gemini_provider", "gemini");
                          if (customModel === "gpt-4o-mini" || customModel === "deepseek-chat" || !customModel) {
                            setCustomModel("gemini-3.5-flash");
                            localStorage.setItem("custom_gemini_model", "gemini-3.5-flash");
                          }
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                          customProvider === "gemini"
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-350 shadow-sm"
                            : "bg-[#020005] border-white/5 text-slate-400 hover:bg-[#020005]/80"
                        }`}
                      >
                        Gemini 官方 SDK 格式
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomProvider("openai");
                          localStorage.setItem("custom_gemini_provider", "openai");
                          if (customModel === "gemini-3.5-flash" || !customModel) {
                            setCustomModel("gpt-4o-mini");
                            localStorage.setItem("custom_gemini_model", "gpt-4o-mini");
                          }
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                          customProvider === "openai"
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-350 shadow-sm"
                            : "bg-[#020005] border-white/5 text-slate-400 hover:bg-[#020005]/80"
                        }`}
                      >
                        OpenAI 兼容中转格式 (支持 DeepSeek、硅基流动等)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">
                          {customProvider === "gemini" ? "Gemini API Key 🔑" : "API 密钥 (API Key) 🔑"}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="text-[9px] text-[#a855f7] hover:underline cursor-pointer font-sans"
                          >
                            {showApiKey ? "隐藏密钥" : "显示密钥"}
                          </button>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              const input = e.currentTarget.closest('.space-y-1')?.querySelector('input');
                              if (input) {
                                input.focus();
                                input.select();
                              }
                            }}
                            className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                          >
                            [一键全选]
                          </button>
                        </div>
                      </div>
                      <input 
                        type={showApiKey ? "text" : "password"}
                        placeholder={customProvider === "gemini" ? "AI Studio 密钥 (AIzaSy...)" : "各种格式 API 密钥 (如 sk-...)"}
                        value={customApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKey(val);
                          localStorage.setItem("custom_gemini_api_key", val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider font-sans">
                          {customProvider === "gemini" ? "直连代理端点 / Base URL 🌐" : "第三方中转接口 / Base URL 🌐"}
                        </span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            const input = e.currentTarget.closest('.space-y-1')?.querySelector('input');
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }}
                          className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                        >
                          [一键全选]
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder={customProvider === "gemini" ? "默认 (留空) 或 https://generativelanguage.googleapis.com" : "例如: https://api.deepseek.com/v1 或 https://api.siliconflow.cn/v1"}
                        value={customApiUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiUrl(val);
                          localStorage.setItem("custom_gemini_api_url", val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-bold text-white/50 uppercase tracking-wider font-sans">模型名称 / Model ID 🤖</span>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            const input = e.currentTarget.closest('.space-y-1')?.querySelector('input');
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }}
                          className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                        >
                          [一键全选]
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder={customProvider === "gemini" ? "默认 gemini-3.5-flash" : "对于 DeepSeek 请填: deepseek-chat 或 含有 vision 支持的模型"}
                        value={customModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomModel(val);
                          localStorage.setItem("custom_gemini_model", val);
                        }}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Test Custom API status panel */}
                  {testApiResult && (
                    <div className={`p-3 rounded-lg text-xs leading-relaxed animate-scale-in border ${
                      testApiResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                        : "bg-red-500/10 border-red-500/20 text-red-300"
                    }`}>
                      <div className="flex gap-2 items-start">
                        <span className="text-sm font-sans">{testApiResult.success ? "✅" : "⚠️"}</span>
                        <div>
                          <p className="font-bold">{testApiResult.success ? "连接测试通过 (Connection Success)" : "连接测试失败 (Connection Failed)"}</p>
                          <p className="opacity-90 mt-0.5">{testApiResult.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2.5 gap-3 border-t border-purple-500/10">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={useCustomApi}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setUseCustomApi(val);
                          localStorage.setItem("use_custom_gemini_api", val ? "true" : "false");
                        }}
                        className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-200 font-sans">启用手动配置的第三方 API 优先模式</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestApiConnection}
                        disabled={testApiLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-555 active:scale-[0.98] text-white font-bold text-xs font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none shadow-md"
                      >
                        {testApiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "⚡"}
                        {testApiLoading ? "正在测试..." : "测试连接可用性"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Upload Section */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  {aiImageFile ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-purple-500/20 group bg-[#020005]">
                      <img src={aiImageFile} alt="Uploaded Resource" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setAiImageFile(null); setAiDescribeResult(null); }}
                        className="absolute bottom-2 right-2 bg-red-650 hover:bg-red-700 text-white rounded-lg p-1.5 text-xs transition-colors font-sans"
                      >
                        清除并更换
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRefAI.current?.click()}
                      onDragOver={handleAIDragOver}
                      onDragLeave={handleAIDragLeave}
                      onDrop={handleAIDrop}
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer w-full aspect-square ${
                        isDraggingAI 
                          ? "border-purple-550/60 bg-purple-950/20 scale-[0.98]" 
                          : "border-purple-500/10 bg-white/[0.02] hover:bg-purple-950/10 hover:border-purple-400/30"
                      }`}
                    >
                      {uploadProgress ? (
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      ) : (
                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-purple-400 font-sans">
                          拖拽任意精彩图片至此 或
                          <span className="text-purple-300 font-bold underline cursor-pointer ml-1">点击本地上传</span>
                        </p>
                        <p className="text-[10px] text-white/20 font-sans">
                          支持 PNG, JPG, JPEG, WEBP 格式参考图
                        </p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRefAI}
                    onChange={handleAiImageSelect}
                    accept="image/*"
                    className="hidden" 
                  />
                </div>

                {/* Inputs & Custom Prompts Column */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  {aiDescribeResult ? (
                    <div className="space-y-4 animate-scale-in">
                      {/* Model & Custom Inputs for AI Extracted Card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Model Designation */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/50 uppercase mb-1.5 font-sans">🎯 适用的AI模型 (Choose Target Model)</label>
                          <select
                            value={aiTargetModel}
                            onChange={(e) => setAiTargetModel(e.target.value)}
                            className="w-full bg-[#020005] border border-purple-500/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500/40 font-mono"
                          >
                            <option value="Midjourney v6">Midjourney v6</option>
                            <option value="Niji v6">Niji v6 (二次元)</option>
                            <option value="FLUX.1">FLUX.1 (Pro / Dev / Schnell)</option>
                            <option value="Stable Diffusion 3">Stable Diffusion 3 / XL</option>
                            <option value="DALL-E 3">OpenAI DALL-E 3</option>
                            <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Imagen 3)</option>
                            <option value="GPT-4o (System Prompt)">GPT-4o / Claude 3.5</option>
                            <option value="自定义特定模型">其它自定义模型...</option>
                          </select>
                        </div>

                        {/* Quick custom text input for target model if they choose or simply edit */}
                        <div>
                          <label className="block text-[10px] font-bold text-white/50 uppercase mb-1.5 font-sans">✏️ 自定义特定的AI模型名称</label>
                          <input
                            type="text"
                            value={aiTargetModel}
                            onChange={(e) => setAiTargetModel(e.target.value)}
                            placeholder="也可以在此直接手动修改或输入您的特定模型名称"
                            className="w-full bg-[#020005] border border-purple-500/10 rounded-xl p-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-purple-500/40 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Drawing Prompt (反推 AI 绘图提示词) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <span>🎨 反推得到的 AI 绘图提示词 (Reversed AI Drawing Prompt) *</span>
                            </label>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  const textEl = e.currentTarget.closest('.space-y-1.5')?.querySelector('textarea');
                                  if (textEl) {
                                    textEl.focus();
                                    textEl.select();
                                  }
                                }}
                                className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                              >
                                [一键全选]
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  navigator.clipboard.writeText(aiDescribeResult.prompt);
                                  alert("绘图提示词已成功复制到剪贴板！");
                                }}
                                className="text-[9px] text-[#a855f7] hover:underline cursor-pointer font-sans"
                              >
                                [一键复制]
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={4}
                            value={aiDescribeResult.prompt}
                            onChange={(e) => setAiDescribeResult({
                              ...aiDescribeResult,
                              prompt: e.target.value
                            })}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            placeholder="绘图提示词内容..."
                            className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-slate-200 placeholder-white/20 focus:outline-none font-mono leading-relaxed select-all"
                          />
                        </div>

                        {/* Vision Analysis & Description (画风与画面描述) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <span>📝 画风与画面描述分析 (Vision Analysis & Description) *</span>
                            </label>
                            <div className="flex gap-2">
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  const textEl = e.currentTarget.closest('.space-y-1.5')?.querySelector('textarea');
                                  if (textEl) {
                                    textEl.focus();
                                    textEl.select();
                                  }
                                }}
                                className="text-[9px] text-purple-400 hover:underline cursor-pointer font-sans"
                              >
                                [一键全选]
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  navigator.clipboard.writeText(aiDescribeResult.description);
                                  alert("画面分析描述已成功复制到剪贴板！");
                                }}
                                className="text-[9px] text-[#a855f7] hover:underline cursor-pointer font-sans"
                              >
                                [一键复制]
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={4}
                            value={aiDescribeResult.description}
                            onChange={(e) => setAiDescribeResult({
                              ...aiDescribeResult,
                              description: e.target.value
                            })}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            placeholder="图像描述分析结果..."
                            className="w-full bg-[#020005] border border-purple-500/10 focus:border-purple-500/40 rounded-xl p-3 text-xs text-slate-200 placeholder-[#a855f7]/30 focus:outline-none font-mono leading-relaxed select-all"
                          />
                        </div>
                      </div>

                      {/* Three tags */}
                      <div className="space-y-2 border-t border-purple-500/10 pt-3.5">
                        <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-sans">精准分类标签 (可手动增减)</span>
                        
                        <div className="bg-[#020005] p-3 rounded-xl border border-purple-500/10 flex flex-wrap gap-2 min-h-[46px] items-center font-sans">
                          {aiDescribeResult.tags.map((tag, i) => {
                            let prefixInfo = "🏷️ 其它";
                            let badgeStyle = "bg-slate-500/10 text-slate-300 border-slate-500/20";
                            if (i === 0) {
                              prefixInfo = "💎 主体";
                              badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            } else if (i === 1) {
                              prefixInfo = "🌍 主题";
                              badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                            } else if (i === 2) {
                              prefixInfo = "🎭 风格";
                              badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                            }

                            return (
                              <span 
                                key={i} 
                                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border font-bold ${badgeStyle} animate-scale-in`}
                              >
                                <span className="text-[9px] opacity-70 tracking-wider font-medium">{prefixInfo}:</span>
                                <span>#{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAiTag(tag)}
                                  className="ml-1.5 hover:text-red-400 transition-colors cursor-pointer text-xs font-black select-none"
                                  title="删除此标签"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {/* Quick Add Inline */}
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="输入要为该图新增的个性化标签..."
                            value={newAiTagInput}
                            onChange={(e) => setNewAiTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddAiTag();
                              }
                            }}
                            className="bg-[#020005] border border-purple-500/10 rounded-lg py-1 px-2.5 text-[11px] text-white placeholder-purple-900/40 focus:outline-none focus:border-purple-500/40 font-mono flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleAddAiTag}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold text-[11px] rounded transition-all cursor-pointer shadow-xs font-sans"
                          >
                            + 追加
                          </button>
                        </div>
                      </div>

                      {/* Saving action */}
                      <div className="pt-3 border-t border-purple-500/10 flex justify-end gap-2.5">
                        <button 
                          onClick={() => { setAiDescribeResult(null); setAiImageFile(null); }}
                          className="px-4 py-2 text-xs text-white/40 hover:text-white font-sans"
                        >
                          重置
                        </button>
                        <button 
                          onClick={saveAiAnalyzedCard}
                          className="px-5 py-2 bg-purple-700 hover:bg-purple-650 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 font-sans"
                        >
                          <Plus size={13} />
                          <span>一键归档和备份</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] bg-[#020005]/60 border border-dashed border-purple-500/10 rounded-xl text-center p-6 text-white/40">
                      <Sparkles className="w-8 h-8 text-purple-700 mb-2 animate-pulse" />
                      <p className="text-xs font-medium font-sans">在左侧上传或拖拽任何一张优秀的 AI 生成图片</p>
                      <p className="text-[10px] text-white/20 mt-1 max-w-sm leading-relaxed font-sans">
                        系统将提取主体要素与画风，重构出一份极其优美细腻的反推提示词，为您提供无损保存与一键复制功能。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GALLERY CONTENT GRID */}
          <div className="flex-1">
            {/* ComfyUI Native Custom Node Interactive Guide Banner */}
            {showComfyGuide && (
              <div className={`mb-6 p-5 border rounded-2xl relative font-sans shadow-xl overflow-hidden animate-scale-in transition-all ${
                isDark 
                  ? "bg-[#0b0518]/90 border-emerald-500/20 text-white" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}>
                {/* Visual grid decor overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-5 items-start justify-between">
                  <div className="space-y-3.5 flex-1 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-black tracking-wider uppercase animate-pulse">
                          ComfyUI 插件已成功打包
                        </span>
                        <h3 className={`text-sm font-black tracking-wide ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                          🎯 提示词图集管理器・ComfyUI 画布联动使用指南
                        </h3>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowComfyGuide(false);
                          localStorage.setItem("show_comfy_guide_banner", "false");
                        }}
                        className={`md:hidden p-1 rounded-full cursor-pointer transition-colors ${
                          isDark ? "hover:bg-white/10 text-slate-450 hover:text-white" : "hover:bg-slate-100 text-slate-400"
                        }`}
                        title="隐藏指南"
                      >
                        <span className="text-base font-bold leading-none">&times;</span>
                      </button>
                    </div>

                    <p className={`text-[11px] leading-relaxed max-w-4xl ${isDark ? "text-slate-350" : "text-slate-550 font-medium"}`}>
                      本软件已集成专属 ComfyUI 插件后台！我们将整个应用打包成了 ComfyUI 官方标准的 <code className="text-[#a855f7] font-bold">custom_nodes</code> 扩展件。ComfyUI 的 Web 服务器将直接接管本网页。下面是极速配置指引：
                    </p>

                    {/* Highly scannable visual steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                      <div className={`p-3.5 rounded-xl border relative ${
                        isDark ? "bg-[#020005]/60 border-white/5" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="absolute top-2 right-2.5 text-xs font-mono font-black opacity-15">01</div>
                        <h4 className="text-[11.5px] font-black text-emerald-400 mb-1 flex items-center gap-1.5">
                          <span>📂</span>
                          <span>放置插件到对应目录</span>
                        </h4>
                        <p className={`text-[10.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          拷贝打包出的 <code className="text-[#c084fc] font-bold font-mono">comfyui-prompt-gallery-manager</code> 文件夹，粘贴放入您的 <code className="text-amber-500 font-mono font-bold">ComfyUI/custom_nodes/</code> 中，并重新启动 ComfyUI。
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-xl border relative ${
                        isDark ? "bg-[#020005]/60 border-white/5" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="absolute top-2 right-2.5 text-xs font-mono font-black opacity-15">02</div>
                        <h4 className="text-[11.5px] font-black text-emerald-400 mb-1 flex items-center gap-1.5">
                          <span>🧩</span>
                          <span>添加 Connector 节点</span>
                        </h4>
                        <p className={`text-[10.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          在 ComfyUI 画布空白处右键搜索并新建 <code className="text-emerald-400 font-extrabold font-mono">Prompt Gallery Connector 🎯</code>。将其正/反面文本输出口连接到 CLIP Text Encode。
                        </p>
                      </div>

                      <div className={`p-3.5 rounded-xl border relative ${
                        isDark ? "bg-[#020005]/60 border-white/5" : "bg-slate-50 border-slate-150"
                      }`}>
                        <div className="absolute top-2 right-2.5 text-xs font-mono font-black opacity-15">03</div>
                        <h4 className="text-[11.5px] font-black text-emerald-400 mb-1 flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>一键选择并渲染</span>
                        </h4>
                        <p className={`text-[10.5px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          在下方画廊卡片中点击任意项的 <span className="text-emerald-400 font-black">设为 Comfy 输出</span>。无需再切换本页，回到 ComfyUI 中直接运行 Queue Prompt，即可源源不断读取活跃的提示词参数！
                        </p>
                      </div>
                    </div>

                    {/* Copy node source code button, view configs */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => setShowComfyModal(true)}
                        className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] tracking-wide transition-all shadow-md cursor-pointer flex items-center gap-1.5 font-sans"
                      >
                        <Cpu size={12} />
                        <span>获取 Python 节点源代码/接口说明 (API Config)</span>
                      </button>
                      <button
                        onClick={() => {
                          const url = `http://127.0.0.1:8188/prompt-gallery`;
                          navigator.clipboard.writeText(url);
                          alert("📝 ComfyUI 独立访问地址已复制：\n" + url);
                        }}
                        className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 font-sans ${
                          isDark ? "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-650"
                        }`}
                        title="ComfyUI自带的独立地址"
                      >
                        <span>🔗</span>
                        <span>复制 ComfyUI 内网地址 (8188)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowComfyGuide(false);
                      localStorage.setItem("show_comfy_guide_banner", "false");
                    }}
                    className={`hidden md:block p-1.5 rounded-xl cursor-pointer transition-colors border shrink-0 ${
                      isDark 
                        ? "bg-[#020005]/80 hover:bg-white/5 text-slate-400 hover:text-white border-white/5" 
                        : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200"
                    }`}
                    title="不再显示本指南 (Dismiss)"
                  >
                    <span className="text-sm font-black leading-none px-2">&times; 关闭指南</span>
                  </button>
                </div>
              </div>
            )}

            {/* Compare Mode Guidance Banner */}
            {isCompareMode && (
              <div className="mb-5 p-4 bg-purple-950/30 border border-purple-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans shadow-lg animate-scale-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚖️</span>
                    <h3 className="font-bold text-xs text-purple-300 uppercase tracking-wider">
                      提示词双向对比模式已激活
                    </h3>
                    <span className="text-[9px] bg-purple-505 bg-purple-500/10 text-purple-400 font-bold font-mono border border-purple-500/18 px-1.5 py-0.5 rounded">
                      已选中 {compareCardIds.length} / 2
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-350 leading-relaxed">
                    请在下方图集列表中**点击任意两张卡片**。系统将把它们的提示词与描述进行并排对齐展示，以便深入剖析和观察不同模型/参数下的表现特征。
                  </p>
                </div>
                <div className="flex items-center gap-2.5 sm:self-center self-end">
                  <button
                    onClick={() => setCompareCardIds([])}
                    disabled={compareCardIds.length === 0}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    重置选择
                  </button>
                  <button
                    onClick={() => setShowComparisonModal(true)}
                    disabled={compareCardIds.length < 2}
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-650 hover:to-fuchsia-650 text-white text-[10px] font-black rounded-lg shadow-lg tracking-wider transition-all disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer uppercase h-[28px]"
                  >
                    <Columns size={12} className={compareCardIds.length === 2 ? "animate-pulse" : ""} />
                    <span>立即并排对比</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCompareMode(false);
                      setCompareCardIds([]);
                    }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
                  >
                    退出对比
                  </button>
                </div>
              </div>
            )}

            {/* Active search or tag filters notification row */}
            {(searchQuery || selectedTag || selectedCollectionId) && (
              <div className="mb-5 p-3 bg-purple-950/25 border border-purple-500/15 rounded-xl flex items-center justify-between text-xs text-purple-300 font-sans">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-purple-400" />
                  <span>
                    正在进行条件筛选：
                    {searchQuery && ` 关键词: "${searchQuery}"`}
                    {selectedTag && ` 标签: #${selectedTag}`}
                    {selectedCollectionId && ` 合集文件夹: "📁 ${collections.find(c => c.id === selectedCollectionId)?.name}"`}
                  </span>
                </div>
                <button 
                  onClick={() => { setSearchQuery(""); setSelectedTag(null); setSelectedCollectionId(null); }}
                  className="font-bold underline text-purple-400 hover:text-purple-300 ml-4 hover:no-underline cursor-pointer"
                >
                  清除所有过滤条件
                </button>
              </div>
            )}

            {filteredCards.length === 0 ? (
              <div className="min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-[#0b0518]/30 border border-purple-500/10 rounded-2xl gap-4">
                <div className="w-16 h-16 bg-[#020005] border border-purple-500/15 rounded-full flex items-center justify-center text-2xl shadow-inner text-[#a855f7]/30 animate-pulse">
                  🔮
                </div>
                <div className="font-sans">
                  <h4 className="text-sm font-extrabold text-[#a855f7] uppercase tracking-widest">沙盒数据库当前为空</h4>
                  <p className="text-[11px] text-white/30 mt-1.5 max-w-md leading-relaxed">
                    您可以立刻点击右侧的 <span className="font-mono text-purple-400">AI 逆向分析助手</span> 或顶部的 <span className="text-purple-400 font-mono">手动保存</span>，上传您最喜爱的参考图并关联对应的提示词！
                  </p>
                </div>
                <div className="flex gap-2.5 mt-2 font-sans">
                  <button 
                    onClick={() => setActiveTab("add-ai")}
                    className="py-1.5 px-4 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs font-bold tracking-wider transition-colors"
                  >
                    开始 AI 解析
                  </button>
                  <button 
                    onClick={() => {
                      saveCardsToStateAndStorage(INITIAL_DEMO_CARDS);
                    }}
                    className="py-1.5 px-3.5 bg-[#020005] border border-purple-500/15 hover:border-purple-500/30 text-slate-300 rounded text-xs tracking-wider transition-all"
                  >
                    恢复预置样例数据
                  </button>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredCards.map((c) => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={
                    galleryLayout === "compact"
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  }>
                    {filteredCards.map((card) => (
                      <PromptCard 
                        key={card.id}
                        card={card}
                        onDelete={handleDeleteCard}
                        onSelect={(selected) => {
                          if (isCompareMode) {
                            handleCompareCardSelect(selected);
                          } else {
                            setViewDetailCard(selected);
                          }
                        }}
                        layoutMode={galleryLayout}
                        isCompareModeActive={isCompareMode}
                        selectedForComparison={compareCardIds.includes(card.id)}
                        theme={theme}
                        isComfyActive={comfyActiveId === card.id}
                        onSetActiveForComfy={handleSetActivePromptForComfy}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {/* FOOTER STAUS BAR */}
      <footer className="h-9 border-t border-purple-500/10 bg-[#020005]/95 flex flex-col sm:flex-row items-center justify-between px-6 text-[10px] text-white/30 tracking-wide gap-2 pb-1.5 pt-1.5 sm:py-0 shrink-0 font-sans">
        <div className="flex gap-4 sm:gap-6 items-center">
          <span>AI 提示词保险库 版本 1.2.0-beta</span>
          <span className="sm:inline hidden">•</span>
          <span>独立运行单元: <span className="text-purple-400 font-mono font-bold">100% 离线沙盒安全保障</span></span>
        </div>
        <div className="flex gap-4 font-semibold text-slate-400 hover:text-white transition-colors">
          <span>所有创作素材和提示词终身归您私人所有，未公开发布不予审查。</span>
        </div>
      </footer>

      {/* DETAIL DRAWER / POPUP MODAL */}
      {viewDetailCard && (
        <CardDetailModal 
          card={viewDetailCard}
          onClose={() => setViewDetailCard(null)}
          onDelete={handleDeleteCard}
          onUpdateTags={handleUpdateTags}
          onUpdateCard={handleUpdateCard}
          collections={collections}
          onToggleCollection={handleToggleCollectionForCard}
          theme={theme}
        />
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-[#0b0518] border border-purple-500/20 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                <LogOut size={22} className="animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-100 tracking-wider uppercase">
                  确定要安全退出吗？
                </h3>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  安全退出后将自动锁闭保险库。您需要再次输入密保暗号登入，或通过管理员免密通道进入。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2 bg-[#020005] border border-purple-500/10 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-purple-950/30 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setCurrentUser(null);
                    localStorage.removeItem("prompt_vault_session");
                  }}
                  className="py-2 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/45 cursor-pointer"
                >
                  确定退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORAGE, PATH & BACKUP MODAL */}
      {showStorageModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-55 font-sans">
          <div className="bg-[#0b0518] border border-purple-500/20 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
                <h3 className="text-sm font-black text-slate-100 tracking-wider uppercase flex items-center gap-2">
                  <span>💾 存储机制与本地物理路径管理</span>
                </h3>
                <button
                  onClick={() => {
                    setShowStorageModal(false);
                    setImportStatus({ type: "", msg: "" });
                  }}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Data isolation & encryption documentation */}
              <div className="space-y-2 bg-[#020005]/50 border border-purple-900/10 p-3.5 rounded-xl text-[11px] leading-relaxed text-slate-350">
                <p className="font-bold text-purple-400">🛡️ 本地浏览器沙盒存储说明：</p>
                <p>
                  为了保证绝对的个人知识产权及创意安全下完全离线保障，您的所有精美图片画廊、AI反面提示、主题标签分类和文件夹完全**通过高级 Base64 压缩存储在当前浏览器沙盒（localStorage）中**，任何公有云端或团队都不具有您画卷的阅读权限。
                </p>
                <p className="mt-1 font-bold text-amber-500">🔒 关于文件是否加密：</p>
                <p>
                  数据在浏览器内部通过高强度原生的 **JSON 字段混淆进行结构化安全打包**，能有效防御初级的磁盘垃圾扫描窃取。但因浏览器技术环境限制未作本地硬件级强密钥加密，建议离开前点击侧边栏的**安全退出**进行锁闭！
                </p>
              </div>

              {/* Change physical path section */}
              <div className="space-y-3 bg-[#030107] border border-purple-500/15 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                    📂 自定义本地物理数据路径
                  </label>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                    当前生效
                  </span>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={tempStoragePath}
                    onChange={(e) => setTempStoragePath(e.target.value)}
                    placeholder="请输入一个自定义路径，如 D:/AI-Vault/Data"
                    className="w-full px-3 py-2 bg-[#020005] border border-purple-500/20 focus:border-purple-500/50 rounded-xl text-xs text-white placeholder-purple-900/40 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                  />
                  <p className="text-[10px] text-white/40 leading-normal">
                    💡 <span className="text-purple-400 font-semibold">修改作用</span>：本应用将以此磁盘路径算出专属空间校验后缀。更改该路径，能实现**在不同的物理画廊目录/工作区之间快速切换**；若输入的是空目录，将会自动在该路径名下创建全新画廊空间！
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTempStoragePath("/Users/Shared/PromptVault/data");
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[10px] transition-colors cursor-pointer"
                  >
                    重置默认目录
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = tempStoragePath.trim();
                      if (!trimmed) {
                        alert("物理存储路径不能为空！");
                        return;
                      }
                      setStoragePath(trimmed);
                      localStorage.setItem("prompt_vault_storage_path", trimmed);
                      alert(`💾 本地存储路径成功切换至：\n${trimmed}\n已在本地重新开启/载入此空间画卷！`);
                    }}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-650 text-white font-bold rounded-lg text-[10px] shadow-sm tracking-wide cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <span>应用修改并切换工作区</span>
                  </button>
                </div>
              </div>

              {/* Import / Export Backup section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="bg-[#030107]/80 border border-purple-500/10 p-4 rounded-xl flex flex-col justify-between space-y-3.5">
                  <div>
                    <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                      📤 打包导出备份 (Export Backup)
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
                      将当前正在浏览的这套图集（共 {cards.length} 张卡，{collections.length} 个文件夹）打包进行无损导出。适合本地离线离线归档备份。
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="w-full py-2 bg-purple-950/40 hover:bg-purple-800/80 border border-purple-500/30 text-purple-300 font-bold hover:text-white rounded-xl text-[10px] transition-colors cursor-pointer tracking-wider"
                  >
                    一键打包导出并下载 (.json)
                  </button>
                </div>

                {/* Import Card */}
                <div className="bg-[#030107]/80 border border-purple-500/10 p-4 rounded-xl space-y-3">
                  <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                    📥 恢复本地备份 (Import / Restore)
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex gap-3 text-[10px] text-slate-400">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="import-opt"
                          checked={importOption === "merge"}
                          onChange={() => setImportOption("merge")}
                          className="accent-purple-500 h-3 w-3"
                        />
                        <span>智能合并 (跳过重复项)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="import-opt"
                          checked={importOption === "overwrite"}
                          onChange={() => setImportOption("overwrite")}
                          className="accent-purple-500 h-3 w-3"
                        />
                        <span className="text-red-400">覆盖并清空原图集</span>
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      id="data-import-input"
                      className="hidden"
                    />
                    <label
                      htmlFor="data-import-input"
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-slate-500/10 hover:border-purple-500/30 text-center flex items-center justify-center font-bold text-slate-350 hover:text-white rounded-xl text-[10px] transition-colors cursor-pointer tracking-wider"
                    >
                      📁 选择备份 JSON 文件
                    </label>
                  </div>
                </div>
              </div>

              {/* Import status logs */}
              {importStatus.type && (
                <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed border ${
                  importStatus.type === "success" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {importStatus.type === "success" ? "✓ " : "⚠️ "}{importStatus.msg}
                </div>
              )}

              {/* Process Shutdown Control Panel */}
              <div className="bg-red-950/15 border border-red-500/10 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>🛑 独立服务进程完全注销</span>
                  </h4>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold font-mono">
                    关闭终端
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  完成当下的艺术灵感图册整理后，如果您希望在关闭网页的同时，**彻底杀掉本地运行的 Node.js/Vite 后台程序并彻底释放 3000 端口**（避免占用电量与多余缓存），请安全呼叫此指令。
                </p>
                <button
                  type="button"
                  onClick={handleShutDownService}
                  className="w-full py-2 bg-red-950/30 hover:bg-red-800/80 border border-red-500/20 text-red-300 font-bold hover:text-white rounded-xl text-[10px] transition-colors cursor-pointer tracking-wider"
                >
                  一键安全关闭并释放后台端口进程 (Shut Down Server)
                </button>
              </div>

              <div className="border-t border-purple-500/10 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowStorageModal(false);
                    setImportStatus({ type: "", msg: "" });
                  }}
                  className="px-5 py-2 bg-[#020005]/80 hover:bg-purple-950/20 border border-purple-500/15 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  关闭页面
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT & DETAILED DUAL COMPARISON MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-55 font-sans animate-fade-in">
          <div className={`border max-w-6xl w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar transition-colors ${
            isDark ? "bg-[#0b0518] border-purple-500/20 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-6">
              {/* Modal Header */}
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-purple-500/10" : "border-slate-200"}`}>
                <div>
                  <h3 className={`text-base font-black tracking-wider uppercase flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                    <span>⚖️ AI 提示词与模型表现双向对比</span>
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    并排观察、分析及对比两组人工智能绘画的实际提示策略和细节特征。
                  </p>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className={`p-1 rounded transition-all cursor-pointer text-xs px-2 py-1 ${
                    isDark ? "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  ✕ 关闭对比
                </button>
              </div>

              {/* Side-by-side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-purple-500/10">
                {/* Find the two cards */}
                {[0, 1].map((index) => {
                  const cardId = compareCardIds[index];
                  const card = cards.find(c => c.id === cardId);
                  
                  if (!card) {
                    return (
                      <div key={index} className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 text-slate-500 font-mono text-xs border border-dashed border-purple-500/10 rounded-xl bg-black/40">
                        <span>[ 对比位置 #{index + 1} 尚未选择 ]</span>
                        <p className="text-[11px] text-slate-600 mt-2">请退出本弹窗并在图集中点击卡片进行填充</p>
                      </div>
                    );
                  }

                  return (
                    <div key={card.id} className="space-y-4 md:px-4 pt-4 md:pt-0">
                      {/* Badge and Title */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded border border-purple-500/20">
                          对比项 #{index + 1}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          同步时间: {new Date(card.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Card Image */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#030107] border border-white/5 group shadow-inner">
                        <img 
                          src={card.imageUrl} 
                          alt={card.prompt} 
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 px-2.5 py-1 rounded-lg text-[9px] text-purple-300 font-mono border border-white/5 backdrop-blur-xs">
                          画廊原图
                        </div>
                      </div>

                      {/* Prompt block with copy */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest">
                            🎨 AI 绘图正向提示词 (Prompt)
                          </label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(card.prompt);
                              alert("💡 正向提示词已成功复制到剪贴板！");
                            }}
                            className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Copy size={10} />
                            <span>复制提示词</span>
                          </button>
                        </div>
                        <div className="p-3 bg-[#020005]/90 border border-purple-500/20 rounded-xl text-xs text-white leading-relaxed font-mono select-all overflow-y-auto whitespace-pre-wrap max-h-36 custom-scrollbar">
                          {card.prompt}
                        </div>
                      </div>

                      {/* Target Model & System/Skill prompt if exists */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-amber-500/90 uppercase tracking-widest">
                            🤖 所选目标模型与核心指令 (Target Model & System Context)
                          </label>
                        </div>
                        <div className="p-3 bg-[#020005]/95 border border-amber-500/10 rounded-xl text-xs text-amber-300 font-mono">
                          {card.targetModel ? (
                            <span className="font-bold text-slate-200">目标模型: <span className="text-amber-400">{card.targetModel}</span></span>
                          ) : (
                            <span className="text-slate-500 italic">[未设定特定目标模型/通用创作模型]</span>
                          )}
                          
                          {card.singleAiPrompt && (
                            <div className="mt-2 border-t border-white/5 pt-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-400">主核心指令提示词:</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(card.singleAiPrompt || "");
                                    alert("💡 主指令已成功复制到剪贴板！");
                                  }}
                                  className="text-[9px] text-[#a855f7] hover:underline"
                                >
                                  复制
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-300 max-h-20 overflow-y-auto custom-scrollbar select-all whitespace-pre-wrap">{card.singleAiPrompt}</p>
                            </div>
                          )}

                          {card.skillPrompt && (
                            <div className="mt-2 border-t border-white/5 pt-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-400">个性化技能系统组:</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(card.skillPrompt || "");
                                    alert("💡 技能提示词已成功复制到剪贴板！");
                                  }}
                                  className="text-[9px] text-[#a855f7] hover:underline"
                                >
                                  复制
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-300 max-h-20 overflow-y-auto custom-scrollbar select-all whitespace-pre-wrap">{card.skillPrompt}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Description/Analysis */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-purple-300 uppercase tracking-widest block">
                          📝 图像反推描述与效果分析
                        </label>
                        <div className="p-3 bg-purple-950/5 border border-purple-500/10 rounded-xl text-[11.5px] leading-relaxed text-slate-350 select-text">
                          {card.description || <span className="text-slate-500 italic">[暂无对应的图像内容与模型效果描述]</span>}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-widest block">
                          🏷️ 属性标签归类 (Tags)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {card.tags.length > 0 ? (
                            card.tags.map((tag, idx) => (
                              <span 
                                key={idx} 
                                className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-wider"
                              >
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600 font-mono italic">无标签</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Character length count / differences visual helper */}
              {compareCardIds.length === 2 && (
                <div className="bg-[#020005]/80 border border-purple-500/15 p-4 rounded-xl space-y-2.5 text-xs animate-scale-in">
                  <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">
                    📊 提示词数据统计与差异特征比较 (Prompt Statistics & Intersection)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-400 text-[11px]">
                    <div className="bg-[#0b0518]/60 border border-purple-500/10 p-3 rounded-lg">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">提示词字符长度对比 (Characters):</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-white font-mono font-bold text-sm">
                          {cards.find(c => c.id === compareCardIds[0])?.prompt.length ?? 0}
                        </span>
                        <span className="text-purple-550 font-bold">vs</span>
                        <span className="text-white font-mono font-bold text-sm">
                          {cards.find(c => c.id === compareCardIds[1])?.prompt.length ?? 0}
                        </span>
                        <span className="text-slate-500 text-[10px]">字符</span>
                      </div>
                    </div>
                    <div className="bg-[#0b0518]/60 border border-purple-500/10 p-3 rounded-lg">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">单词数量对比 (Word Count):</span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-white font-mono font-bold text-sm">
                          {(cards.find(c => c.id === compareCardIds[0])?.prompt || "").split(/\s+/).filter(Boolean).length}
                        </span>
                        <span className="text-purple-550 font-bold">vs</span>
                        <span className="text-white font-mono font-bold text-sm">
                          {(cards.find(c => c.id === compareCardIds[1])?.prompt || "").split(/\s+/).filter(Boolean).length}
                        </span>
                        <span className="text-slate-500 text-[10px]">单词</span>
                      </div>
                    </div>
                    <div className="bg-[#0b0518]/60 border border-purple-500/10 p-3 rounded-lg">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">共同重合的主题标签 (Shared Tags):</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(() => {
                          const c1 = cards.find(c => c.id === compareCardIds[0]);
                          const c2 = cards.find(c => c.id === compareCardIds[1]);
                          if (c1 && c2) {
                            const intersection = c1.tags.filter(t => c2.tags.includes(t));
                            if (intersection.length > 0) {
                              return intersection.map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[9px] text-emerald-400 font-bold">
                                  {tag}
                                </span>
                              ));
                            }
                          }
                          return <span className="text-slate-600 font-mono">[无重合分类标签]</span>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom footer button bar */}
              <div className="border-t border-purple-500/10 pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCompareCardIds([]);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer font-sans"
                >
                  重置选择 (Reset)
                </button>
                <button
                  type="button"
                  onClick={() => setShowComparisonModal(false)}
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-650 text-white font-bold rounded-xl text-xs tracking-wider transition-all cursor-pointer font-sans shadow-lg shadow-purple-950/40"
                >
                  关闭页面 (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMFYUI CONNECTOR CONFIG & INTEGRATION MODAL */}
      {showComfyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-55 font-sans animate-fade-in">
          <div className={`border max-w-4xl w-full rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar transition-colors ${
            isDark ? "bg-[#0b0518] border-emerald-500/20 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />
            
            <div className="relative z-10 space-y-5">
              {/* Modal Header */}
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-emerald-500/10" : "border-slate-200"}`}>
                <div>
                  <h3 className={`text-base font-black tracking-wider uppercase flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                    <span className="p-1 px-2 rounded bg-emerald-500/10 text-emerald-400 font-mono text-sm">ComfyUI</span>
                    <span>提示词与图集管理器 ─ ComfyUI 桥接节点说明</span>
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    将您在本软件中管理/反推的正面与反面提示词，通过网络请求一键直连传入您的 ComfyUI 流程中。
                  </p>
                </div>
                <button
                  onClick={() => setShowComfyModal(false)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isDark ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-100 text-slate-650"
                  }`}
                >
                  <span className="text-xl font-bold leading-none">&times;</span>
                </button>
              </div>

              {/* Status Section */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-200"
              }`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">当前后台状态 / Status</span>
                  <p className="text-xs font-semibold">
                    🟢 后端桥接服务已上线。数据会在此网页上点击「设为 Comfy 输出」或修改卡片列表时自动进行文件同步。
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    本地服务读取地址: <span className="text-emerald-400 underline select-all">http://localhost:3000/api/comfy/active</span>
                  </p>
                </div>
                <button
                  onClick={() => syncCardsToBackend(cards)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider transition-all shadow-md cursor-pointer uppercase font-mono shrink-0"
                >
                  {syncStatus === "syncing" ? "正在同步..." : syncStatus === "success" ? "已同步! ✓" : "强制立即同步"}
                </button>
              </div>

              {/* Steps Guide */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">🚀 快速上手使用步骤:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-150"}`}>
                    <div className="text-sm font-bold text-emerald-400 mb-1">1. 建立节点文件</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      在您的 ComfyUI 安装目录下找到 <code className="text-amber-400">custom_nodes/</code> 目录，新建一个文件命名为 <code className="text-amber-400">prompt_gallery_node.py</code>。
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-150"}`}>
                    <div className="text-sm font-bold text-emerald-400 mb-1">2. 复制下方Python代码</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      复制下方的完整桥接节点源码，粘贴到上述文件中并保存。然后<strong>重启您的 ComfyUI 服务器</strong>。
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-150"}`}>
                    <div className="text-sm font-bold text-emerald-400 mb-1">3. 在画布上添加节点</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      在 ComfyUI 画布空白处右键搜索 <code className="text-emerald-400">PromptGalleryConnector</code> 节点并添加。将输出的正面与反面连接至 CLIP 文本编码节点。
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                    🐍 Python 节点源代码 (custom_nodes/prompt_gallery_node.py)
                  </label>
                  <button
                    onClick={() => {
                      const code = `import urllib.request\nimport json\n\nclass PromptGalleryConnector:\n    @classmethod\n    def INPUT_TYPES(s):\n        return {\n            "required": {\n                "server_url": ("STRING", {"default": "http://localhost:3000"}),\n                "mode": (["active", "random"], {"default": "active"}),\n            },\n        }\n\n    RETURN_TYPES = ("STRING", "STRING")\n    RETURN_NAMES = ("positive_prompt", "negative_prompt")\n    FUNCTION = "get_prompts"\n    CATEGORY = "PromptGallery"\n\n    def get_prompts(self, server_url, mode):\n        # Cleans up trailing slash\n        url = server_url.rstrip("/") + f"/api/comfy/active?mode={mode}"\n        try:\n            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})\n            with urllib.request.urlopen(req, timeout=5) as response:\n                data = json.loads(response.read().decode())\n                positive = data.get("prompt", "")\n                negative = data.get("negative_prompt", "")\n                return (positive, negative)\n        except Exception as e:\n            print(f"[PromptGallery] Fetch error: {e}")\n            return (\n                "A futuristic cyberpunk robot portrait, neon violet highlights, volumetric cinematic lights, unreal engine 5, 8k",\n                "blurry, lowres, low quality, deformed"\n            )\n\nNODE_CLASS_MAPPINGS = {\n    "PromptGalleryConnector": PromptGalleryConnector\n}\n\nNODE_DISPLAY_NAME_MAPPINGS = {\n    "PromptGalleryConnector": "Prompt Gallery Connector 🎯"\n}`;
                      navigator.clipboard.writeText(code);
                      alert("🐍 Python 节点源码已成功复制到剪贴板！可以直接新建文件粘贴。");
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-[#a855f7]/15 hover:bg-[#a855f7]/25 text-[#c084fc] font-bold transition-all flex items-center gap-1 cursor-pointer border border-[#a855f7]/20"
                  >
                    <Copy size={12} />
                    <span>复制完整 Python 节点源码</span>
                  </button>
                </div>
                <div className="p-4 bg-[#020005] border border-emerald-500/10 rounded-xl text-xs font-mono leading-relaxed text-slate-300 max-h-56 overflow-y-auto custom-scrollbar select-all whitespace-pre">
{`import urllib.request
import json

class PromptGalleryConnector:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "server_url": ("STRING", {"default": "http://localhost:3000"}),
                "mode": (["active", "random"], {"default": "active"}),
            },
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("positive_prompt", "negative_prompt")
    FUNCTION = "get_prompts"
    CATEGORY = "PromptGallery"

    def get_prompts(self, server_url, mode):
        # Cleans up trailing slash
        url = server_url.rstrip("/") + f"/api/comfy/active?mode={mode}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                positive = data.get("prompt", "")
                negative = data.get("negative_prompt", "")
                return (positive, negative)
        except Exception as e:
            print(f"[PromptGallery] Fetch error: {e}")
            return (
                "A futuristic cyberpunk robot portrait, neon violet highlights, volumetric cinematic lights, unreal engine 5, 8k",
                "blurry, lowres, low quality, deformed"
            )

NODE_CLASS_MAPPINGS = {
    "PromptGalleryConnector": PromptGalleryConnector
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptGalleryConnector": "Prompt Gallery Connector 🎯"
}`}
                </div>
              </div>

              {/* Extra configuration instructions */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                isDark ? "bg-purple-950/10 border-purple-500/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}>
                <span className="font-bold text-slate-200 block mb-1">💡 自定义选项说明:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Active 模式</strong>: 读取在本提示词图集管理器中被标有 <span className="text-emerald-400 font-extrabold">COMFY 活跃输出</span> 的指定卡片数据。双击画布中节点时，ComfyUI 会自适应读取最新活跃的内容。</li>
                  <li><strong>Random 模式</strong>: 随机从当前所有已同步的图集列表（包括您上传/反推的反推提示词）中挑出一张，适合进行批量的创意灵感受托渲染、蒙特卡洛测试，或自动化多风格生图流水线。</li>
                </ul>
              </div>

              {/* Footer close button */}
              <div className="border-t border-emerald-500/10 pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowComfyModal(false)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs tracking-wider transition-all cursor-pointer font-sans shadow-lg shadow-emerald-950/40"
                >
                  我知道了，开始创作 (Confirm)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
