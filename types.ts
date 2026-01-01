export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  parts?: Array<{ text?: string; inlineData?: Attachment }>; // Storing raw structure if needed
  attachments?: Attachment[];
  timestamp: number;
  isStreaming?: boolean;
  thought?: string; // Extracted thought content
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number; // Last updated
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  input: string;
}

export interface AppConfig {
  apiKey?: string; // In a real app this might be dynamic, here we assume env
}

export type AppView = 'chat' | 'image-gen';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}