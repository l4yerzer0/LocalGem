import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BackendType = 'CPU' | 'GPU' | 'NPU';
export type ThemeMode = 'dark' | 'light' | 'system';

interface SettingsStore {
  backend: BackendType;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  isThinkingEnabled: boolean;
  themeMode: ThemeMode;
  setBackend: (backend: BackendType) => void;
  setTemperature: (temp: number) => void;
  setTopK: (k: number) => void;
  setTopP: (p: number) => void;
  setMaxTokens: (tokens: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      backend: 'GPU',
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxTokens: 1024,
      isThinkingEnabled: true,
      themeMode: 'system',

      setBackend: (backend) => set({ backend }),
      setTemperature: (temperature) => set({ temperature }),
      setTopK: (topK) => set({ topK }),
      setTopP: (topP) => set({ topP }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setThinkingEnabled: (isThinkingEnabled) => set({ isThinkingEnabled }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'localgem-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
