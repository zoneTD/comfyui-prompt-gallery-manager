export interface User {
  id: string;
  email: string;
}

export interface AIPromptCard {
  id: string;
  imageUrl: string; // base64 URL
  prompt: string; // drawing prompt
  description?: string; // AI description of the image
  tags: string[]; // 3 tags
  createdAt: number; // timestamp
  singleAiPrompt?: string; // 单个AI提示词/主指令
  skillPrompt?: string; // SKILL提示词/个性化技能组
  targetModel?: string; // 选择用于什么模型/目标模型
}

export interface AIPromptCollection {
  id: string;
  name: string; // collection/folder name
  cardIds: string[]; // cards belonging to this collection
  createdAt: number;
}

export interface AIReverseResult {
  description: string;
  prompt: string;
  tags: string[];
}
