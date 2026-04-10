import { create } from 'zustand';

export type BackendType = 'CPU' | 'GPU' | 'NPU';

interface SettingsStore {
  backend: BackendType;
  temperature: number;
  topK: number;
  topP: number;
  maxTokens: number;
  isThinkingEnabled: boolean;
  setBackend: (backend: BackendType) => void;
  setTemperature: (temp: number) => void;
  setTopK: (k: number) => void;
  setTopP: (p: number) => void;
  setMaxTokens: (tokens: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  backend: 'GPU',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxTokens: 1024,
  isThinkingEnabled: true,

  setBackend: (backend) => set({ backend }),
  setTemperature: (temperature) => set({ temperature }),
  setTopK: (topK) => set({ topK }),
  setTopP: (topP) => set({ topP }),
  setMaxTokens: (maxTokens) => set({ maxTokens }),
  setThinkingEnabled: (isThinkingEnabled) => set({ isThinkingEnabled }),
}));
