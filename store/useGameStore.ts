import { create } from 'zustand';

interface GameState {
  score: number;
  frame: number;
  isRolling: boolean;
  pinsDown: number;
  resetKey: number; // Used to respawn pins
  rollBall: () => void;
  registerPinDown: () => void;
  nextFrame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  frame: 1,
  isRolling: false,
  pinsDown: 0,
  resetKey: 0,
  rollBall: () => set({ isRolling: true }),
  registerPinDown: () => set((state) => ({ pinsDown: state.pinsDown + 1, score: state.score + 1 })),
  nextFrame: () => set((state) => ({ 
    frame: state.frame + 1, 
    isRolling: false, 
    pinsDown: 0, 
    resetKey: state.resetKey + 1 // Forces pins to remount
  })),
}));