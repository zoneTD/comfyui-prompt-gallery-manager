import React, { useState } from "react";
import { AIPromptCard } from "../types";
import { Copy, Download, Trash2, Eye, CheckCircle2, GripVertical } from "lucide-react";
import { downloadCardFiles } from "../utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PromptCardProps {
  card: AIPromptCard;
  onDelete: (id: string) => void;
  onSelect: (card: AIPromptCard) => void;
  layoutMode?: "complete" | "compact";
  selectedForComparison?: boolean;
  isCompareModeActive?: boolean;
  theme?: "dark" | "light";
  isComfyActive?: boolean;
  onSetActiveForComfy?: (card: AIPromptCard) => void;
}

export function PromptCard({ 
  card, 
  onDelete, 
  onSelect, 
  layoutMode = "complete",
  selectedForComparison = false,
  isCompareModeActive = false,
  theme = "dark",
  isComfyActive = false,
  onSetActiveForComfy
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isDark = theme === "dark";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 55 : undefined,
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadCardFiles(card);
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDelete(true);
  };

  if (layoutMode === "compact") {
    return (
      <div 
        id={`card-${card.id}`}
        ref={setNodeRef}
        style={style}
        className={`group relative aspect-square overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
          selectedForComparison 
            ? (isDark 
                ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.45)] bg-[#120729]" 
                : "border-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-purple-50")
            : (isDark 
                ? "border-white/5 bg-[#0d051c]/95 hover:bg-[#0c031a] hover:border-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]" 
                : "border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300/30 hover:shadow-[0_4px_20px_rgba(147,51,234,0.08)]")
        } ${isDragging ? "shadow-[0_0_30px_rgba(168,85,247,0.5)] border-purple-500/50" : ""}`}
        onClick={() => onSelect(card)}
      >
        {/* Comparison mode selection circle */}
        {isCompareModeActive && (
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
            {selectedForComparison ? (
              <div className="w-5 h-5 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center text-[10px] text-white font-bold select-none shadow animate-scale-in">
                ✓
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-[10px] text-white backdrop-blur-xs">
              </div>
            )}
          </div>
        )}
        {isComfyActive && !isCompareModeActive && (
          <span className="absolute top-2 right-2 z-24 px-1.5 py-0.5 rounded bg-emerald-500/95 text-[8.5px] text-white font-extrabold tracking-wide shadow-md flex items-center gap-1 font-sans animate-pulse">
            <span className="w-1 h-1 rounded-full bg-white animate-ping" />
            <span>COMFY</span>
          </span>
        )}
        {/* Tactile drag handle */}
        <div 
          {...attributes} 
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 z-20 p-1.5 rounded-lg bg-black/75 hover:bg-purple-650 border border-white/15 text-white/85 hover:text-white transition-all cursor-grab active:cursor-grabbing backdrop-blur-md shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 duration-200"
          title="按住拖拽排序"
        >
          <GripVertical size={13} />
        </div>

        {/* Image */}
        <img 
          src={card.imageUrl} 
          alt={card.prompt} 
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Hover overlay for Compact Cards */}
        {!isCompareModeActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 z-10">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={handleCopy}
                className="rounded-lg bg-zinc-900/95 hover:bg-purple-650/90 p-1.5 text-white/95 border border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer"
                title="复制提示词"
              >
                {copied ? (
                  <CheckCircle2 size={13} className="text-emerald-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="rounded-lg bg-zinc-900/95 hover:bg-purple-650/90 p-1.5 text-white/95 border border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer"
                title="一键下载图片和提示词"
              >
                <Download size={13} />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 font-sans text-start">
              <p className="text-[11px] font-mono text-white/95 line-clamp-2 leading-relaxed tracking-wide antialiased">
                &ldquo;{card.prompt}&rdquo;
              </p>
              <div className="flex items-center justify-between border-t border-white/10 pt-2 mt-1">
                <span className="text-[9px] font-mono text-white/40">
                  {new Date(card.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={handleDeleteTrigger}
                  className="rounded-lg bg-red-650/95 hover:bg-red-650 p-1 text-white transition-colors duration-200 cursor-pointer"
                  title="删除卡片"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Overlays */}
        {confirmingDelete && (
          <div 
            className={`absolute inset-0 ${isDark ? "bg-[#030107]/95" : "bg-white/98"} backdrop-blur-md flex flex-col items-center justify-center p-3 text-center z-25 animate-fade-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-8 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mb-1.5">
              <Trash2 className="w-4 h-4 text-red-500 animate-pulse" />
            </div>
            <p className={`text-[11px] font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>确认删除？</p>
            <div className="flex gap-1.5 mt-3 w-full px-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isDark ? "bg-white/5 hover:bg-white/10 border border-white/5 text-slate-350" : "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600"
                }`}
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                  setConfirmingDelete(false);
                }}
                className="flex-1 py-1.5 bg-red-500 hover:bg-red-650 text-white rounded-lg text-[10px] font-bold transition-all shadow-md cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id={`card-${card.id}`}
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
        selectedForComparison 
          ? (isDark 
              ? "border-purple-500 shadow-[0_0_22px_rgba(168,85,247,0.45)] bg-[#120729]" 
              : "border-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-purple-55")
          : (isDark 
              ? "border-white/5 bg-[#0d051c]/90 hover:bg-[#0c031a] hover:border-purple-500/25 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]" 
              : "border-slate-200 bg-white hover:border-purple-305/35 hover:shadow-[0_6px_22px_rgba(147,51,234,0.06)]")
      } ${isDragging ? "shadow-[0_0_30px_rgba(168,85,247,0.5)] border-purple-500/50" : ""}`}
      onClick={() => onSelect(card)}
    >
      {/* Tactile drag handle - always visible on mobile/touch, hidden and fades in on desktop hover */}
      <div 
        {...attributes} 
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/60 hover:bg-purple-650 border border-white/10 text-white/60 hover:text-white transition-all cursor-grab active:cursor-grabbing backdrop-blur-md shadow-md opacity-100 sm:opacity-0 group-hover:opacity-100 duration-200"
        title="按住拖拽排序"
      >
        <GripVertical size={13} />
      </div>

      {/* Image box */}
      <div className={`relative aspect-square w-full overflow-hidden ${isDark ? "bg-[#030107]/50 border-b border-white/5" : "bg-slate-50 border-b border-slate-100"}`}>
        {/* Comparison mode selection circle */}
        {isCompareModeActive && (
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center justify-center">
            {selectedForComparison ? (
              <div className="w-5.5 h-5.5 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center text-[10px] text-white font-bold select-none shadow-md animate-scale-in">
                ✓
              </div>
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-[10px] text-white backdrop-blur-xs">
              </div>
            )}
          </div>
        )}
        {isComfyActive && !isCompareModeActive && (
          <span className="absolute top-2.5 right-2.5 z-24 px-2 py-0.5 rounded bg-emerald-500/95 text-[9px] text-white font-extrabold tracking-wide shadow-md flex items-center gap-1 font-sans animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>COMFY 活跃输出</span>
          </span>
        )}
        <img 
          src={card.imageUrl} 
          alt={card.prompt} 
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Floating gradient overlay */}
        {!isCompareModeActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 z-10">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={handleCopy}
                className="rounded-lg bg-zinc-900/90 hover:bg-purple-650/90 p-2 text-white/90 border border-white/10 backdrop-blur-md transition-colors duration-200 cursor-pointer"
                title="复制提示词"
              >
                {copied ? (
                  <CheckCircle2 size={15} className="text-emerald-400" />
                ) : (
                  <Copy size={15} />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="rounded-lg bg-zinc-900/90 hover:bg-purple-650/90 p-2 text-white/90 border border-white/10 backdrop-blur-md transition-colors duration-200 cursor-pointer"
                title="一键下载图片及提示词"
              >
                <Download size={15} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded-md border border-white/5 backdrop-blur-xs">
                点击查看 AI 解析
              </span>
              <button
                onClick={handleDeleteTrigger}
                className="rounded-lg bg-red-650/90 hover:bg-red-600 p-1.5 text-white/90 transition-colors duration-200 cursor-pointer"
                title="删除卡片"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Custom Confirmation Overlay */}
        {confirmingDelete && (
          <div 
            className={`absolute inset-0 ${isDark ? "bg-[#030107]/95" : "bg-white/98"} backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20 animate-fade-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-2.5">
              <Trash2 className="w-5 h-5 text-red-555 animate-pulse" />
            </div>
            <p className={`text-xs font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>确认删除这张提示词？</p>
            <p className={`text-[10px] mt-1 max-w-[150px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>删除后将无法从本地沙盒中恢复。</p>
            <div className="flex gap-2 mt-4 w-full px-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  isDark ? "bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300" : "bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-650"
                }`}
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                  setConfirmingDelete(false);
                }}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-750 text-white rounded-lg text-[11px] font-bold transition-all shadow-lg cursor-pointer"
              >
                彻底删除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className={`flex flex-1 flex-col p-4.5 text-start ${isDark ? "bg-[#0d051c]" : "bg-white"}`}>
        {/* Prompt line (truncated) */}
        <p className={`line-clamp-2 text-[13px] font-mono leading-relaxed antialiased mt-1 ${isDark ? "text-white/80" : "text-slate-700"}`} title={card.prompt}>
          &ldquo;{card.prompt}&rdquo;
        </p>
        
        {/* Tags line */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {card.tags.map((tag, idx) => (
            <span 
              key={idx}
              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide border ${
                isDark 
                  ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                  : "bg-purple-50 border-purple-100 text-purple-600"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Comfy & Date/Detail row */}
        <div className={`mt-3.5 flex items-center justify-between border-t pt-3.5 text-[11px] ${
          isDark ? "border-white/5" : "border-slate-100"
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetActiveForComfy?.(card);
            }}
            className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 border ${
              isComfyActive 
                ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400 font-black animate-scale-in shadow-sm shadow-emerald-950/20"
                : (isDark 
                    ? "bg-white/5 border-white/5 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/20 text-slate-400" 
                    : "bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500")
            }`}
            title="设为 ComfyUI 流程中的直接输入节点内容"
          >
            <span>🎯</span>
            <span>{isComfyActive ? "Comfy 活跃输出" : "设为 Comfy 输出"}</span>
          </button>
          
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] opacity-40">{new Date(card.createdAt).toLocaleDateString()}</span>
            <span className={`flex items-center gap-1 font-bold text-xs transition-colors shrink-0 ${
              isDark ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-550"
            }`}>
              <Eye size={12} /> 详细
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
