import { create } from 'zustand';

export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
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
  activeView: 'chat' | 'models' | 'settings';
  setActiveView: (view: 'chat' | 'models' | 'settings') => void;
  addChat: (title: string) => string;
  addMessage: (chatId: string, role: Role, content: string) => void;
  updateLastMessage: (chatId: string, content: string) => void;
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

  setCurrentChat: (id) => set({ currentChatId: id }),

  deleteChat: (id) => set((state) => ({
    chats: state.chats.filter(c => c.id !== id),
    currentChatId: state.currentChatId === id ? (state.chats[0]?.id || null) : state.currentChatId
  })),
}));
