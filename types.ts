
export enum StudioMode {
  HOME = 'HOME',
  NORMAL_CHAT = 'NORMAL_CHAT',
  ANALYZED = 'ANALYZED',
  CREATIVE = 'CREATIVE',
  CODE = 'CODE',
  VISION = 'VISION',
  LIVE = 'LIVE',
  ONE_TO_ONE = 'ONE_TO_ONE',
  ABOUT = 'ABOUT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'video' | 'code';
  assetUrl?: string;
  mimeType?: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progressMessage: string;
}

export interface ActiveAlarm {
  id: string;
  time: string;
  label: string;
  triggered: boolean;
}
