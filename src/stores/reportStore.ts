import { create } from 'zustand'
import type { TrialReport, FunnelRecord, FunnelStage, FollowUpNote } from '@/types'
import { DEMO_REPORTS, DEMO_FUNNEL } from '@/data/mockData'

interface ReportState {
  reports: TrialReport[]
  funnels: FunnelRecord[]
  addReport: (r: TrialReport) => void
  updateReport: (id: string, data: Partial<TrialReport>) => void
  getReportByBooking: (bookingId: string) => TrialReport | undefined
  addFunnel: (f: FunnelRecord) => void
  updateFunnelStage: (id: string, stage: FunnelStage) => void
  addFunnelNote: (funnelId: string, note: FollowUpNote) => void
  updateFunnelCoupon: (id: string, code: string) => void
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: DEMO_REPORTS,
  funnels: DEMO_FUNNEL,

  addReport: (r) => set((s) => ({ reports: [...s.reports, r] })),
  updateReport: (id, data) => set((s) => ({
    reports: s.reports.map((r) => (r.id === id ? { ...r, ...data } : r)),
  })),
  getReportByBooking: (bookingId) => get().reports.find((r) => r.bookingId === bookingId),

  addFunnel: (f) => set((s) => ({ funnels: [...s.funnels, f] })),
  updateFunnelStage: (id, stage) => set((s) => ({
    funnels: s.funnels.map((f) =>
      f.id === id ? { ...f, stage, updatedAt: new Date().toISOString().slice(0, 10) } : f
    ),
  })),
  addFunnelNote: (funnelId, note) => set((s) => ({
    funnels: s.funnels.map((f) =>
      f.id === funnelId ? { ...f, notes: [...f.notes, note], updatedAt: new Date().toISOString().slice(0, 10) } : f
    ),
  })),
  updateFunnelCoupon: (id, code) => set((s) => ({
    funnels: s.funnels.map((f) =>
      f.id === id ? { ...f, couponCode: code, updatedAt: new Date().toISOString().slice(0, 10) } : f
    ),
  })),
}))
