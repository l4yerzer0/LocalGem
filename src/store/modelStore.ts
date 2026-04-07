import { create } from 'zustand';

export interface AIModel {
  name: string;
  path: string;
  size: number;
}

interface ModelStore {
  models: AIModel[];
  activeModel: AIModel | null;
  isInitialized: boolean; // Флаг, готова ли модель к работе
  setModels: (models: AIModel[]) => void;
  setActiveModel: (model: AIModel | null) => void;
  setInitialized: (val: boolean) => void;
  addModel: (model: AIModel) => void;
  removeModel: (name: string) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: [],
  activeModel: null,
  isInitialized: false,

  setModels: (models) => set({ models }),

  setActiveModel: (model) => {
    set({ activeModel: model, isInitialized: false }); // Сбрасываем инициализацию при смене модели
  },

  setInitialized: (val) => set({ isInitialized: val }),

  addModel: (model) => {
    const { models, activeModel } = get();
    set({ models: [...models, model] });
    if (!activeModel) {
      set({ activeModel: model });
    }
  },

  removeModel: (name) => set((state) => ({
    models: state.models.filter(m => m.name !== name),
    activeModel: state.activeModel?.name === name ? null : state.activeModel,
    isInitialized: state.activeModel?.name === name ? false : state.isInitialized
  })),
}));
