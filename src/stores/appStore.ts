import { create } from 'zustand'
import type { Role } from '@/types'

interface AppState {
  currentRole: Role | null
  setRole: (role: Role) => void
  clearRole: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: null,
  setRole: (role) => set({ currentRole: role }),
  clearRole: () => set({ currentRole: null }),
}))
