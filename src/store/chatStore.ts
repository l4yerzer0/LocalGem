import { create } from 'zustand';
import { databaseService } from '../services/DatabaseService';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  thinking?: string;
  image?: string;
  timestamp: number;
  stats?: {
    totalTime: number;
    firstTokenTime: number;
    tokenCount: number;
    tps: number;
    backend: string;
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  isGeneratingTitle?: boolean;
  pendingMessage?: { text: string; image?: string } | null;
}

interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  activeView: 'chat' | 'models' | 'settings' | 'device';
  isLoading: boolean;
  isContextSynced: boolean;
  setActiveView: (view: 'chat' | 'models' | 'settings' | 'device') => void;
  setContextSynced: (synced: boolean) => void;
  loadChats: () => Promise<void>;
  loadChatMessages: (chatId: string) => Promise<void>;
  addChat: (title: string) => string;
  addMessage: (chatId: string, role: Role, content: string) => void;
  addMessageWithImage: (chatId: string, content: string, image: string) => void;
  updateLastMessage: (chatId: string, content: string) => void;
  updateLastMessageWithThinking: (chatId: string, thinking: string) => void;
  updateLastMessageWithStats: (chatId: string, content: string, stats: Message['stats']) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  setGeneratingTitle: (chatId: string, isGenerating: boolean) => void;
  setPendingMessage: (chatId: string, message: { text: string; image?: string } | null) => void;
  setCurrentChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChatId: null,
  activeView: 'chat',
  isLoading: true,
  isContextSynced: false,

  setActiveView: (view) => set({ activeView: view }),
  setContextSynced: (synced) => set({ isContextSynced: synced }),

  loadChats: async () => {
    set({ isLoading: true });
    try {
      const chats = await databaseService.loadChats();
      set({ chats, isLoading: false });
    } catch (error) {
      console.error('Failed to load chats:', error);
      set({ isLoading: false });
    }
  },

  loadChatMessages: async (chatId) => {
    try {
      const messages = await databaseService.loadMessages(chatId, 30);
      set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, messages } : chat
        ),
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  addChat: (title) => {
    const id = Date.now().toString();
    const newChat: Chat = { id, title, messages: [], createdAt: Date.now() };
    set((state) => ({ 
      chats: [newChat, ...state.chats],
      currentChatId: id 
    }));
    databaseService.saveChat(newChat);
    return id;
  },

  addMessage: (chatId, role, content) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };
    set((state) => ({
      chats: state.chats.map((chat) => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      )
    }));
    databaseService.saveMessage(chatId, message);
  },

  addMessageWithImage: (chatId, content, image) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      image,
      timestamp: Date.now(),
    };
    set((state) => ({
      chats: state.chats.map((chat) => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      )
    }));
    databaseService.saveMessage(chatId, message);
  },

  updateLastMessage: (chatId, content) => {
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id === chatId && chat.messages.length > 0) {
          const newMessages = [...chat.messages];
          newMessages[newMessages.length - 1].content = content;
          return { ...chat, messages: newMessages };
        }
        return chat;
      })
    }));
  },

  updateLastMessageWithThinking: (chatId, thinking) => {
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id === chatId && chat.messages.length > 0) {
          const newMessages = [...chat.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            newMessages[newMessages.length - 1] = { ...lastMsg, thinking: (lastMsg.thinking || "") + thinking };
          }
          return { ...chat, messages: newMessages };
        }
        return chat;
      })
    }));
  },

  updateLastMessageWithStats: (chatId, content, stats) => {
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id === chatId && chat.messages.length > 0) {
          const newMessages = [...chat.messages];
          const lastIndex = newMessages.length - 1;
          const updatedMessage = { ...newMessages[lastIndex], content, stats };
          newMessages[lastIndex] = updatedMessage;
          databaseService.saveMessage(chatId, updatedMessage);
          return { ...chat, messages: newMessages };
        }
        return chat;
      })
    }));
  },

  updateChatTitle: (chatId, title) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat
      ),
    }));
    databaseService.updateChatTitle(chatId, title);
  },

  setGeneratingTitle: (chatId, isGenerating) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, isGeneratingTitle: isGenerating } : chat
      ),
    }));
  },

  setPendingMessage: (chatId, message) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, pendingMessage: message } : chat
      ),
    }));
  },

  setCurrentChat: (id) => {
    set({ currentChatId: id });
    const chat = get().chats.find(c => c.id === id);
    if (chat && chat.messages.length === 0) {
      get().loadChatMessages(id);
    }
  },

  deleteChat: async (id) => {
    await databaseService.deleteChat(id);
    set((state) => ({
      chats: state.chats.filter(c => c.id !== id),
      currentChatId: state.currentChatId === id ? (state.chats[0]?.id || null) : state.currentChatId
    }));
  },
}));
