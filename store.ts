import { create } from 'zustand';
import { TreeState } from './types';

interface AppState {
  treeState: TreeState;
  isMorphing: boolean;
  toggleState: () => void;
  setMorphing: (isMorphing: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  treeState: TreeState.SCATTERED,
  isMorphing: false,
  toggleState: () => set((state) => ({
    treeState: state.treeState === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE,
    isMorphing: true
  })),
  setMorphing: (isMorphing) => set({ isMorphing })
}));