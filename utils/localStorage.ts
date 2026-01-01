import { ChatSession } from '../types';

const STORAGE_KEY = 'gemini_chat_sessions_v1';

export const saveSessionsToStorage = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to local storage:', error);
  }
};

export const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load sessions from local storage:', error);
    return [];
  }
};

export const clearAllSessions = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear sessions from local storage:', error);
  }
};