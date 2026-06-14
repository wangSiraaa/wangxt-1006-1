import { create } from 'zustand'
import type { AuditLog, AuditAction, AuditOperatorRole } from '@/types'
import { DEMO_AUDIT } from '@/data/mockData'

interface AuditState {
  logs: AuditLog[]
  addLog: (action: AuditAction, operatorRole: AuditOperatorRole, operatorId: string, targetId: string, detail: string) => void
}

let logCounter = DEMO_AUDIT.length + 1

export const useAuditStore = create<AuditState>((set) => ({
  logs: DEMO_AUDIT,
  addLog: (action, operatorRole, operatorId, targetId, detail) =>
    set((s) => ({
      logs: [
        ...s.logs,
        {
          id: `a${logCounter++}`,
          action,
          operatorRole,
          operatorId,
          targetId,
          detail,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
}))
