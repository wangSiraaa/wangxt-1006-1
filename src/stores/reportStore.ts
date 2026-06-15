import { create } from 'zustand'
import type { TrialReport, FunnelRecord, FunnelStage, FollowUpNote, FollowUpTodo, TransferSuggestion } from '@/types'
import { DEMO_REPORTS, DEMO_FUNNEL, DEMO_TODOS } from '@/data/mockData'

interface ReportState {
  reports: TrialReport[]
  funnels: FunnelRecord[]
  todos: FollowUpTodo[]
  addReport: (r: TrialReport) => void
  updateReport: (id: string, data: Partial<TrialReport>) => void
  getReportByBooking: (bookingId: string) => TrialReport | undefined
  addFunnel: (f: FunnelRecord) => void
  updateFunnelStage: (id: string, stage: FunnelStage) => void
  addFunnelNote: (funnelId: string, note: FollowUpNote) => void
  updateFunnelCoupon: (id: string, code: string) => void
  addTodo: (todo: FollowUpTodo) => void
  updateTodo: (id: string, data: Partial<FollowUpTodo>) => void
  completeTodo: (id: string) => void
  getTodosByBooking: (bookingId: string) => FollowUpTodo[]
  getPendingTodos: (assigneeId?: string) => FollowUpTodo[]
  getTodosByType: (type: FollowUpTodo['type']) => FollowUpTodo[]
  addTransferSuggestion: (t: TransferSuggestion, bookingId: string) => void
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: DEMO_REPORTS,
  funnels: DEMO_FUNNEL,
  todos: DEMO_TODOS,

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

  addTodo: (todo) => set((s) => ({ todos: [...s.todos, todo] })),
  updateTodo: (id, data) => set((s) => ({
    todos: s.todos.map((t) => (t.id === id ? { ...t, ...data } : t)),
  })),
  completeTodo: (id) => set((s) => ({
    todos: s.todos.map((t) =>
      t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString().slice(0, 10) } : t
    ),
  })),
  getTodosByBooking: (bookingId) => get().todos.filter((t) => t.bookingId === bookingId),
  getPendingTodos: (assigneeId) => {
    const pending = get().todos.filter((t) => t.status === 'pending')
    if (assigneeId) return pending.filter((t) => t.assigneeId === assigneeId)
    return pending
  },
  getTodosByType: (type) => get().todos.filter((t) => t.type === type),

  addTransferSuggestion: (suggestion, bookingId) => {
    const booking = get().todos.find((t) => t.bookingId === bookingId)
    if (booking) {
      const todo: FollowUpTodo = {
        id: `td_${Date.now()}`,
        bookingId,
        parentId: booking.parentId,
        babyId: booking.babyId,
        type: 'transfer',
        title: '转班建议待跟进',
        content: suggestion.reason,
        priority: 'high',
        status: 'pending',
        assigneeId: 'consultant1',
        dueDate: null,
        createdAt: new Date().toISOString().slice(0, 10),
        completedAt: null,
      }
      set((s) => ({ todos: [...s.todos, todo] }))
    }
  },
}))
