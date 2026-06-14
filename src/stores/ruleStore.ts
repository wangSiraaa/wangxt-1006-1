import { create } from 'zustand'
import type { FrequencyRule } from '@/types'
import { DEMO_RULES } from '@/data/mockData'

interface RuleState {
  rules: FrequencyRule[]
  updateRule: (id: string, data: Partial<FrequencyRule>) => void
  getRuleByType: (type: FrequencyRule['type']) => FrequencyRule | undefined
}

export const useRuleStore = create<RuleState>((set, get) => ({
  rules: DEMO_RULES,
  updateRule: (id, data) => set((s) => ({
    rules: s.rules.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  getRuleByType: (type) => get().rules.find((r) => r.type === type && r.enabled),
}))
