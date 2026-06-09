import { AIPromptCard } from "./types";

/**
 * Resizes and compresses an image to fit safely in localStorage.
 * Downscales to max width/height of 800px, keeping good quality.
 */
export function compressAndStoreImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG with 0.8 quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error("图片加载失败"));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Downloads the card's image AND the prompt meta text file simultaneously.
 */
export function downloadCardFiles(card: AIPromptCard) {
  // 1. Download image
  const imgLink = document.createElement("a");
  imgLink.href = card.imageUrl;
  // Use first tag or simplified prompt for file name
  const safeTitle = (card.tags[0] || "ai-prompt-vault").replace(/[\\/:*?"<>|]/g, "");
  imgLink.download = `${safeTitle}-${card.id}.jpg`;
  document.body.appendChild(imgLink);
  imgLink.click();
  document.body.removeChild(imgLink);

  // 2. Download prompt as txt
  const textContent = `【AI画集提示词及关联信息】
========================================
生成的标签: ${card.tags.join(", ")}
保存时间: ${new Date(card.createdAt).toLocaleString()}

========================================
【AI 绘图提示词 (PROMPT)】:
${card.prompt}

========================================
【AI 图像分析描述】:
${card.description || "无详细描述"}

========================================
* 本文件由「AI 提示词与图集管理器」生成，所有创作内容完全归您私人所有。
`;

  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
  const textUrl = URL.createObjectURL(blob);
  
  const textLink = document.createElement("a");
  textLink.href = textUrl;
  textLink.download = `${safeTitle}-${card.id}-info.txt`;
  document.body.appendChild(textLink);
  textLink.click();
  document.body.removeChild(textLink);
  
  URL.revokeObjectURL(textUrl);
}
