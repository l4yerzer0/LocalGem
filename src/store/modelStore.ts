import { create } from 'zustand';

export interface AIModel {
  name: string;
  path: string;
  size: number;
}

interface ModelStore {
  models: AIModel[];
  activeModel: AIModel | null;
  setModels: (models: AIModel[]) => void;
  setActiveModel: (model: AIModel) => void;
  addModel: (model: AIModel) => void;
  removeModel: (name: string) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  activeModel: null,
  setModels: (models) => set({ models }),
  setActiveModel: (model) => set({ activeModel: model }),
  addModel: (model) => set((state) => ({ models: [...state.models, model], activeModel: state.activeModel || model })),
  removeModel: (name) => set((state) => ({
    models: state.models.filter(m => m.name !== name),
    activeModel: state.activeModel?.name === name ? null : state.activeModel
  })),
}));
