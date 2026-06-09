import React, { useState, useEffect } from "react";
import { AIPromptCard, AIPromptCollection } from "../types";
import { X, Copy, Download, Trash2, CheckCircle2, Globe, Clock, ShieldCheck, Folder } from "lucide-react";
import { downloadCardFiles } from "../utils";

interface CardDetailModalProps {
  card: AIPromptCard | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateTags?: (id: string, newTags: string[]) => void;
  onUpdateCard?: (updatedCard: AIPromptCard) => void;
  collections?: AIPromptCollection[];
  onToggleCollection?: (cardId: string, collectionId: string) => void;
  theme?: "dark" | "light";
}

export function CardDetailModal({ 
  card, 
  onClose, 
  onDelete, 
  onUpdateTags,
  onUpdateCard,
  collections = [],
  onToggleCollection,
  theme = "dark"
}: CardDetailModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedSingleAi, setCopiedSingleAi] = useState(false);
  const [copiedSkill, setCopiedSkill] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedSingleAiPrompt, setEditedSingleAiPrompt] = useState("");
  const [editedSkillPrompt, setEditedSkillPrompt] = useState("");
  const [editedTargetModel, setEditedTargetModel] = useState("");

  const isDark = theme === "dark";

  // Sync edits state when card changes
  useEffect(() => {
    if (card) {
      setEditedPrompt(card.prompt || "");
      setEditedDescription(card.description || "");
      setEditedSingleAiPrompt(card.singleAiPrompt || "");
      setEditedSkillPrompt(card.skillPrompt || "");
      setEditedTargetModel(card.targetModel || "Midjourney v6");
      setIsEditing(false);
    }
  }, [card]);

  if (!card) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(card.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyDesc = () => {
    if (card.description) {
      navigator.clipboard.writeText(card.description);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const handleCopySingleAi = () => {
    if (card.singleAiPrompt) {
      navigator.clipboard.writeText(card.singleAiPrompt);
      setCopiedSingleAi(true);
      setTimeout(() => setCopiedSingleAi(false), 2000);
    }
  };

  const handleCopySkill = () => {
    if (card.skillPrompt) {
      navigator.clipboard.writeText(card.skillPrompt);
      setCopiedSkill(true);
      setTimeout(() => setCopiedSkill(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadCardFiles(card);
  };

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        id="detail-modal"
        className={`relative w-full max-w-5xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[85vh] animate-scale-in ${
          isDark ? "bg-[#070311] border-purple-500/20" : "bg-white border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Large Image */}
        <div className={`relative flex-1 flex items-center justify-center overflow-hidden h-[40vh] md:h-auto ${isDark ? "bg-black" : "bg-slate-105 bg-slate-100"}`}>
          <img 
            src={card.imageUrl} 
            alt={card.prompt} 
            className="w-full h-full object-contain max-h-[45vh] md:max-h-[75vh]"
            referrerPolicy="no-referrer"
          />
          {/* Subtle logo or overlay */}
          <div className={`absolute top-4 left-4 border backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider flex items-center gap-1.5 shadow-lg ${
            isDark ? "bg-[#070311]/95 border-purple-500/15 text-white/80" : "bg-white/95 border-slate-200 text-slate-700"
          }`}>
            <ShieldCheck size={12} className="text-purple-500" /> CLIENT CRYPT VAULT
          </div>
        </div>

        {/* Right Side: Detailed Info Panel */}
        <div className={`w-full md:w-[450px] flex flex-col border-l overflow-y-auto ${
          isDark ? "border-white/5 bg-[#070311]" : "border-slate-200 bg-white"
        }`}>
          {/* Header with edit toggling options */}
          <div className={`sticky top-0 p-4 border-b flex items-center justify-between z-10 ${
            isDark ? "bg-[#070311] border-[#070311]/10 border-b-white/5" : "bg-white border-b-slate-100"
          }`}>
            <h3 className={`font-semibold flex items-center gap-2 text-base ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              <Globe size={18} className="text-purple-500" />
              <span className={`uppercase tracking-wider font-extrabold text-xs ${isDark ? "text-white/50" : "text-slate-450"}`}>图集详细解析</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`py-1 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isEditing
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : (isDark 
                        ? "bg-white/5 text-slate-350 border-white/5 hover:bg-white/10"
                        : "bg-slate-100 text-slate-705 border-slate-200 hover:bg-slate-200")
                }`}
              >
                {isEditing ? "取消编辑" : "📝 编辑修改"}
              </button>
              <button 
                onClick={onClose}
                className={`rounded-lg p-1.5 transition-colors cursor-pointer ${isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"}`}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {isEditing ? (
            /* ==============================================
               EDIT MODE LAYOUT
               ============================================== */
            <div className="flex-1 p-6 space-y-4 font-sans text-start">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-600 dark:text-amber-300 leading-normal mb-1.5 font-normal">
                💡 正在进入本地编辑模式。您可以任意修改该提示词卡片的所有属性（绘图提示词、描述说明、AI特定指令、SKILL快捷技能或适用模型）。
              </div>

              {/* Edit Model */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>🎯 适用的 AI 模型名称</label>
                <input
                  type="text"
                  value={editedTargetModel}
                  onChange={(e) => setEditedTargetModel(e.target.value)}
                  placeholder="如 Midjourney v6、FLUX.1、Stable Diffusion 3"
                  className={`w-full border focus:ring-1 focus:ring-purple-550/20 rounded-xl py-2 px-3 text-xs focus:outline-none font-mono ${
                    isDark ? "bg-[#130728] border-purple-500/10 text-white focus:border-purple-500/40" : "bg-slate-50 border-slate-200 text-slate-805 focus:border-purple-400"
                  }`}
                />
              </div>

              {/* Edit Draw Prompt */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>AI 绘图提示词 (PROMPT)</label>
                <textarea
                  rows={4}
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className={`w-full border focus:ring-1 focus:ring-purple-550/20 rounded-xl p-3 text-xs focus:outline-none font-mono leading-relaxed ${
                    isDark ? "bg-[#130728] border-purple-500/10 text-white focus:border-purple-500/40" : "bg-slate-50 border-slate-200 text-slate-805 focus:border-purple-400"
                  }`}
                />
              </div>

              {/* Edit AI Image Description */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>AI 图像分析描述</label>
                <textarea
                  rows={2}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="输入图像风格细节和内容描述..."
                  className={`w-full border focus:ring-1 focus:ring-purple-550/20 rounded-xl p-3 text-xs focus:outline-none leading-relaxed ${
                    isDark ? "bg-[#130728] border-purple-500/10 text-white focus:border-purple-500/40" : "bg-slate-50 border-slate-200 text-slate-805 focus:border-purple-400"
                  }`}
                />
              </div>

              {/* Edit Single AI Prompt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-500 uppercase block tracking-wider">🤖 单个 AI 提示词 / 系统主指令</label>
                <textarea
                  rows={3}
                  value={editedSingleAiPrompt}
                  onChange={(e) => setEditedSingleAiPrompt(e.target.value)}
                  placeholder="在此输入生成本提示词所采用的 AI 主脑或系统 System Prompt..."
                  className={`w-full border focus:ring-1 focus:ring-purple-550/20 rounded-xl p-3 text-xs focus:outline-none font-mono leading-relaxed ${
                    isDark ? "bg-[#130728] border-purple-500/10 text-white focus:border-purple-500/40" : "bg-slate-50 border-slate-200 text-slate-805 focus:border-purple-400"
                  }`}
                />
              </div>

              {/* Edit SKILL style prompt */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-cyan-600 block tracking-wider uppercase">⚡ SKILL 提示词 / 高级个性化技能组</label>
                <textarea
                  rows={3}
                  value={editedSkillPrompt}
                  onChange={(e) => setEditedSkillPrompt(e.target.value)}
                  placeholder="在此输入所选用的 SKILL 提示词组..."
                  className={`w-full border focus:ring-1 focus:ring-purple-550/20 rounded-xl p-3 text-xs focus:outline-none font-mono leading-relaxed ${
                    isDark ? "bg-[#130728] border-purple-500/10 text-white focus:border-purple-500/40" : "bg-slate-50 border-slate-200 text-slate-805 focus:border-cyan-500/40"
                  }`}
                />
              </div>

              {/* Action buttons inside edit panel */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const hasPrompt = editedPrompt.trim().length > 0;
                    const hasSingle = editedSingleAiPrompt.trim().length > 0;
                    const hasSkill = editedSkillPrompt.trim().length > 0;

                    if (!hasPrompt && !hasSingle && !hasSkill) {
                      alert("请至少填入“AI 绘图提示词”、“单个 AI 提示词”或“SKILL 提示词”中的任意一项以进行保存！");
                      return;
                    }
                    if (onUpdateCard) {
                      onUpdateCard({
                        ...card,
                        prompt: editedPrompt.trim() || "(无绘图提示词)",
                        description: editedDescription.trim() || undefined,
                        singleAiPrompt: editedSingleAiPrompt.trim() || undefined,
                        skillPrompt: editedSkillPrompt.trim() || undefined,
                        targetModel: editedTargetModel.trim() || undefined
                      });
                      setIsEditing(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-605 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  💾 保存修改信息
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isDark ? "bg-white/5 hover:bg-white/10 text-slate-350 border-white/5" : "bg-slate-100 hover:bg-slate-150 border-slate-200 text-slate-600"
                  }`}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            /* ==============================================
               VIEW MODE LAYOUT
               ============================================== */
            <div className="flex-1 p-6 space-y-5 font-sans text-start">
              {/* Generation Date / Meta */}
              <div className={`flex items-center gap-4 text-xs font-mono p-3 rounded-xl border shadow-2xs ${
                isDark ? "bg-[#130728] text-white/50 border-purple-500/10" : "bg-slate-50 text-slate-505 border-slate-200/85"
              }`}>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="opacity-40" />
                  <span>{new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={`w-px h-3 ${isDark ? "bg-white/10" : "bg-slate-200"}`}></div>
                <span>ID: {card.id.substring(0, 8)}</span>
              </div>

              {/* Model info badge */}
              <div className={`flex items-center gap-2 text-xs border px-3.5 py-2.5 rounded-xl font-mono ${
                isDark ? "bg-purple-500/5 border-purple-500/15 text-purple-400" : "bg-purple-50/60 border-purple-150 text-purple-700"
              }`}>
                <span className="font-bold text-[10px] uppercase tracking-wide">🎯 适用模型:</span>
                <span className={`font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{card.targetModel || "未指定模型 (默认多用途)"}</span>
              </div>

              {/* Prompt Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? "text-white/40" : "text-slate-500"}`}>AI 绘图提示词 (PROMPT)</label>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 text-xs text-purple-505 hover:text-purple-650 font-bold transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="text-emerald-500 text-[11px]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span className="text-[11px]">复制</span>
                      </>
                    )}
                  </button>
                </div>
                <div className={`rounded-xl border p-4 shadow-sm font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words ${
                  isDark ? "bg-[#130728] border-purple-500/10 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}>
                  {card.prompt}
                </div>
              </div>

              {/* AI Description (if available) */}
              {card.description && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? "text-white/40" : "text-slate-500"}`}>AI 图像分析描述</label>
                    <button
                      onClick={handleCopyDesc}
                      className="flex items-center gap-1 text-xs text-purple-505 hover:text-purple-650 font-bold transition-colors cursor-pointer"
                    >
                      {copiedDesc ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span className="text-emerald-500 text-[11px]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">复制</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className={`rounded-xl border p-4 text-xs leading-relaxed antialiased ${
                    isDark ? "bg-[#130728]/50 border-purple-500/10 text-white/70" : "bg-slate-50/50 border-slate-200 text-slate-700"
                  }`}>
                    {card.description}
                  </div>
                </div>
              )}

              {/* Single AI Prompt Block (if available) */}
              {card.singleAiPrompt && (
                <div className={`space-y-2 border-t pt-4 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-purple-500 tracking-widest uppercase flex items-center gap-1">
                      <span>🤖 单个 AI 提示词 / 系统指令</span>
                    </label>
                    <button
                      onClick={handleCopySingleAi}
                      className="flex items-center gap-1 text-xs text-purple-505 hover:text-purple-650 font-bold transition-colors cursor-pointer"
                    >
                      {copiedSingleAi ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span className="text-emerald-500 text-[11px]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">复制指令</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className={`rounded-xl border p-4 shadow-sm font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words ${
                    isDark ? "bg-purple-950/10 border-purple-500/15 text-purple-200" : "bg-purple-50/50 border-purple-150 text-purple-800"
                  }`}>
                    {card.singleAiPrompt}
                  </div>
                </div>
              )}

              {/* SKILL Prompt Block (if available) */}
              {card.skillPrompt && (
                <div className={`space-y-2 border-t pt-4 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-cyan-600 tracking-widest uppercase flex items-center gap-1">
                      <span>⚡ SKILL 提示词 / 专属技能规则</span>
                    </label>
                    <button
                      onClick={handleCopySkill}
                      className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-705 font-bold transition-colors cursor-pointer"
                    >
                      {copiedSkill ? (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span className="text-emerald-500 text-[11px]">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">复制SKILL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className={`rounded-xl border p-4 shadow-sm font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words ${
                    isDark ? "bg-cyan-950/10 border-cyan-500/15 text-cyan-300" : "bg-cyan-50/50 border-cyan-150 text-cyan-800"
                  }`}>
                    {card.skillPrompt}
                  </div>
                </div>
              )}

              {/* Tags Box */}
              <div className="space-y-3">
                <label className={`text-[10px] font-bold tracking-widest uppercase block mb-1 ${isDark ? "text-white/40" : "text-slate-500"}`}>
                  精准分类标签 (可手动点击删除/在最后直接回车增加)
                </label>

                <div className={`flex flex-wrap gap-2 items-center border p-3 rounded-xl min-h-[46px] ${
                  isDark ? "bg-[#130728]/40 border-purple-500/10" : "bg-slate-55 bg-slate-50 border-slate-200"
                }`}>
                  {card.tags.map((tag, idx) => {
                    let prefixInfo = "🏷️ 其它";
                    let badgeStyle = isDark ? "bg-slate-500/10 text-slate-300 border-slate-500/20" : "bg-slate-100 text-slate-705 border-slate-250";
                    if (idx === 0) {
                      prefixInfo = "💎 主体";
                      badgeStyle = isDark ? "bg-emerald-500/10 text-emerald-455 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-250";
                    } else if (idx === 1) {
                      prefixInfo = "🌍 主题";
                      badgeStyle = isDark ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-700 border-purple-250";
                    } else if (idx === 2) {
                      prefixInfo = "🎭 风格";
                      badgeStyle = isDark ? "bg-amber-500/10 text-amber-505 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-250";
                    }

                    return (
                      <span 
                        key={idx} 
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${badgeStyle} shadow-2xs animate-scale-in`}
                      >
                        <span className="text-[9px] opacity-70 font-medium tracking-wide">{prefixInfo}:</span>
                        <span>#{tag}</span>
                        {onUpdateTags && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = card.tags.filter(t => t !== tag);
                              onUpdateTags(card.id, newTags);
                            }}
                            className={`ml-1 px-1 text-sm font-bold leading-none cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-red-400" : "text-slate-500 hover:text-red-500"}`}
                            title="删除该标签"
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    );
                  })}

                  {/* Inline direct add input */}
                  {onUpdateTags && (
                    <input
                      type="text"
                      placeholder="+ 回车新增"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const target = e.currentTarget;
                          const val = target.value.trim().replace(/#/g, "");
                          if (val && !card.tags.includes(val)) {
                            onUpdateTags(card.id, [...card.tags, val]);
                            target.value = "";
                          }
                        }
                      }}
                      className={`border rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 w-24 font-mono transition-all ${
                        isDark 
                          ? "bg-[#070311]/85 border-purple-500/10 text-white placeholder-white/20 focus:border-purple-400 focus:ring-purple-550/20" 
                          : "bg-white border-slate-250 text-slate-800 placeholder-slate-400 focus:border-purple-405 focus:ring-purple-500/20"
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Custom Collections Selector */}
              <div className={`space-y-2 border-t pt-4 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                <label className={`text-[10px] font-bold tracking-widest uppercase block ${isDark ? "text-white/40" : "text-slate-500"}`}>
                  所属自定义合集 (分类子文件夹)
                </label>
                
                {collections.length === 0 ? (
                  <div className={`text-[11px] italic p-3 rounded-xl border ${
                    isDark ? "bg-[#130728]/30 border-purple-500/10 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    暂无可用自定义文件夹合集。可在左主控面板快速新建子合集。
                  </div>
                ) : (
                  <div className={`grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto custom-scrollbar rounded-xl p-2.5 border ${
                    isDark ? "bg-[#130728]/30 border-purple-500/10" : "bg-slate-50/80 border-slate-205"
                  }`}>
                    {collections.map((coll) => {
                      const isInCollection = coll.cardIds.includes(card.id);
                      return (
                        <button
                          key={coll.id}
                          type="button"
                          onClick={() => onToggleCollection?.(card.id, coll.id)}
                          className={`flex items-center gap-2 text-left px-2 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            isInCollection
                              ? (isDark 
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold" 
                                  : "bg-purple-50 text-purple-700 border-purple-250 font-extrabold shadow-xs")
                              : (isDark 
                                  ? "bg-[#070311]/55 text-slate-400 border-white/5 hover:border-white/10 hover:text-white" 
                                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:text-slate-805")
                          }`}
                        >
                          <Folder size={12} className={isInCollection ? "text-purple-500 fill-purple-500/20" : "text-slate-400"} />
                          <span className="truncate flex-1">{coll.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className={`p-4 border-t sticky bottom-0 z-10 transition-all ${
            isDark ? "bg-[#070311] border-white/5" : "bg-white border-slate-100"
          }`}>
            {confirmingDelete ? (
              <div className="bg-red-50/50 dark:bg-red-950/15 border border-red-500/20 p-3 rounded-xl flex flex-col gap-2.5 animate-scale-in">
                <p className="text-[11px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 leading-tight">
                  <Trash2 size={13} className="text-red-500 animate-bounce" />
                  <span>您确实要彻底删除该卡片及所有关联信息吗？</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isDark ? "bg-[#130728] text-slate-300 border-white/5 hover:bg-slate-800" : "bg-slate-100 hover:bg-slate-150 border-slate-200 text-slate-600"
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      onDelete(card.id);
                      onClose();
                    }}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-750 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    确认彻底删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownload}
                  className="col-span-1 py-2.5 px-4 bg-purple-700 hover:bg-purple-655 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>一键下载</span>
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className={`col-span-1 py-2.5 px-4 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDark 
                      ? "bg-transparent border-red-500/20 text-red-400 hover:bg-red-950/20" 
                      : "bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Trash2 size={15} />
                  <span>删除记录</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
