import { create } from "zustand";
import type { SelfieData } from "../types/selfie";

interface SelfieState {
  selfie?: SelfieData;
  isProcessing: boolean;
  error?: string;
  setSelfie: (selfie: SelfieData) => void;
  setProcessing: (processing: boolean) => void;
  setError: (message?: string) => void;
  clear: () => void;
}

export const useSelfieStore = create<SelfieState>((set) => ({
  selfie: undefined,
  isProcessing: false,
  error: undefined,
  setSelfie: (selfie) => set({ selfie, error: undefined }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (message) => set({ error: message }),
  clear: () => set({ selfie: undefined, isProcessing: false, error: undefined }),
}));
