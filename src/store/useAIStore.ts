import { create } from "zustand";

interface AIState {
    strictMode: boolean;
    totalAnomalies: number;
    totalOverloaded: number;
    burnoutRiskCount: number;
    overallConfidence: number;
    toggleStrictMode: () => void;
    setAIMetrics: (metrics: Partial<AIState>) => void;
}

export const useAIStore = create<AIState>((set) => ({
    strictMode: false,
    totalAnomalies: 12,
    totalOverloaded: 4,
    burnoutRiskCount: 3,
    overallConfidence: 87.5,
    toggleStrictMode: () => set((s) => ({ strictMode: !s.strictMode })),
    setAIMetrics: (metrics) => set((s) => ({ ...s, ...metrics })),
}));
