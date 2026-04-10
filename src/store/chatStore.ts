import { create } from 'zustand';

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
}

interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  activeView: 'chat' | 'models' | 'settings' | 'device';
  setActiveView: (view: 'chat' | 'models' | 'settings' | 'device') => void;
  addChat: (title: string) => string;
  addMessage: (chatId: string, role: Role, content: string) => void;
  addMessageWithImage: (chatId: string, content: string, image: string) => void;
  updateLastMessage: (chatId: string, content: string) => void;
  updateLastMessageWithThinking: (chatId: string, thinking: string) => void;
  updateLastMessageWithStats: (chatId: string, content: string, stats: Message['stats']) => void;
  setCurrentChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  currentChatId: null,
  activeView: 'chat',

  setActiveView: (view) => set({ activeView: view }),

  addChat: (title) => {
    const id = Date.now().toString();
    const newChat: Chat = { id, title, messages: [], createdAt: Date.now() };
    set((state) => ({ 
      chats: [newChat, ...state.chats],
      currentChatId: id 
    }));
    return id;
  },

  addMessage: (chatId, role, content) => {
    set((state) => ({
      chats: state.chats.map((chat) => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, { id: Date.now().toString(), role, content, timestamp: Date.now() }] }
          : chat
      )
    }));
  },

  addMessageWithImage: (chatId, content, image) => {
    set((state) => ({
      chats: state.chats.map((chat) => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, { id: Date.now().toString(), role: 'user', content, image, timestamp: Date.now() }] }
          : chat
      )
    }));
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
          newMessages[lastIndex] = { ...newMessages[lastIndex], content, stats };
          return { ...chat, messages: newMessages };
        }
        return chat;
      })
    }));
  },

  setCurrentChat: (id) => set({ currentChatId: id }),

  deleteChat: (id) => set((state) => ({
    chats: state.chats.filter(c => c.id !== id),
    currentChatId: state.currentChatId === id ? (state.chats[0]?.id || null) : state.currentChatId
  })),
}));
