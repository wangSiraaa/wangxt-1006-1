import { create } from 'zustand'
import type { Parent, Baby, Booking, WaitlistEntry, BookingStatus, WaitlistStatus, BookingCategory, TransferSuggestion } from '@/types'
import { DEMO_PARENTS, DEMO_BABIES, DEMO_BOOKINGS, DEMO_WAITLIST } from '@/data/mockData'

interface BookingState {
  parents: Parent[]
  babies: Baby[]
  bookings: Booking[]
  waitlist: WaitlistEntry[]
  transferSuggestions: TransferSuggestion[]
  addParent: (p: Parent) => void
  updateParent: (id: string, data: Partial<Parent>) => void
  addBaby: (b: Baby) => void
  updateBaby: (id: string, data: Partial<Baby>) => void
  addBooking: (b: Booking) => void
  updateBooking: (id: string, data: Partial<Booking>) => void
  updateBookingStatus: (id: string, status: BookingStatus) => void
  addWaitlist: (w: WaitlistEntry) => void
  updateWaitlistStatus: (id: string, status: WaitlistStatus) => void
  convertWaitlistToBooking: (waitlistId: string, booking: Booking) => void
  getParentByPhone: (phone: string) => Parent | undefined
  getOrCreateParent: (phone: string, name: string) => Parent
  getOrCreateBaby: (parentId: string, name: string, ageMonths: number, existingBabyId?: string | null) => Baby
  getBookingsByPhoneThisWeek: (phone: string) => Booking[]
  getBabiesByParent: (parentId: string) => Baby[]
  isPhoneFrozen: (phone: string) => { frozen: boolean; reason: string | null; until: string | null }
  isPhoneBlacklisted: (phone: string) => boolean
  getSiblingGroup: (siblingGroupId: string) => Booking[]
  getBookingsByCategory: (category: BookingCategory) => Booking[]
  addTransferSuggestion: (t: TransferSuggestion) => void
  getBookingsWithSiblings: (parentId: string) => Booking[]
  createSiblingBookings: (parentId: string, siblingGroupId: string, bookings: Omit<Booking, 'siblingGroupId' | 'category'>[]) => Booking[]
}

const getWeekStart = (d: Date) => {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  r.setHours(0, 0, 0, 0)
  return r
}

export const useBookingStore = create<BookingState>((set, get) => ({
  parents: DEMO_PARENTS,
  babies: DEMO_BABIES,
  bookings: DEMO_BOOKINGS,
  waitlist: DEMO_WAITLIST,
  transferSuggestions: [],

  addParent: (p) => set((s) => ({ parents: [...s.parents, p] })),
  updateParent: (id, data) => set((s) => ({
    parents: s.parents.map((pp) => (pp.id === id ? { ...pp, ...data } : pp)),
  })),
  addBaby: (b) => set((s) => ({ babies: [...s.babies, b] })),
  updateBaby: (id, data) => set((s) => ({
    babies: s.babies.map((bb) => (bb.id === id ? { ...bb, ...data } : bb)),
  })),
  addBooking: (b) => set((s) => ({ bookings: [...s.bookings, b] })),
  updateBooking: (id, data) => set((s) => ({
    bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...data } : b)),
  })),
  updateBookingStatus: (id, status) => set((s) => ({
    bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
  })),
  addWaitlist: (w) => set((s) => ({ waitlist: [...s.waitlist, w] })),
  updateWaitlistStatus: (id, status) => set((s) => ({
    waitlist: s.waitlist.map((w) => (w.id === id ? { ...w, status } : w)),
  })),
  convertWaitlistToBooking: (waitlistId, booking) =>
    set((s) => ({
      waitlist: s.waitlist.map((w) =>
        w.id === waitlistId ? { ...w, status: 'converted' as WaitlistStatus } : w
      ),
      bookings: [...s.bookings, booking],
    })),

  getParentByPhone: (phone) => get().parents.find((p) => p.phone === phone),

  getOrCreateParent: (phone, name) => {
    const existing = get().getParentByPhone(phone)
    if (existing) return existing
    const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newParent: Parent = {
      id,
      name,
      phone,
      isBlacklisted: false,
      freezeUntil: null,
      freezeReason: null,
    }
    set((s) => ({ parents: [...s.parents, newParent] }))
    return newParent
  },

  getOrCreateBaby: (parentId, name, ageMonths, existingBabyId) => {
    if (existingBabyId) {
      const found = get().babies.find((b) => b.id === existingBabyId)
      if (found) return found
    }
    const sameName = get().babies.find(
      (b) => b.parentId === parentId && b.name === name && Math.abs(b.ageMonths - ageMonths) <= 1
    )
    if (sameName) return sameName
    const id = `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newBaby: Baby = {
      id,
      parentId,
      name,
      ageMonths,
    }
    set((s) => ({ babies: [...s.babies, newBaby] }))
    return newBaby
  },

  getBookingsByPhoneThisWeek: (phone) => {
    const parent = get().getParentByPhone(phone)
    if (!parent) return []
    const weekStart = getWeekStart(new Date())
    return get().bookings.filter(
      (b) =>
        b.parentId === parent.id &&
        new Date(b.createdAt) >= weekStart &&
        b.status !== 'cancelled'
    )
  },

  isPhoneFrozen: (phone) => {
    const parent = get().getParentByPhone(phone)
    if (!parent) return { frozen: false, reason: null, until: null }
    if (!parent.freezeUntil) return { frozen: false, reason: null, until: null }
    if (new Date(parent.freezeUntil) <= new Date()) {
      return { frozen: false, reason: null, until: null }
    }
    return { frozen: true, reason: parent.freezeReason, until: parent.freezeUntil }
  },

  isPhoneBlacklisted: (phone) => {
    const parent = get().getParentByPhone(phone)
    return parent?.isBlacklisted ?? false
  },

  getBabiesByParent: (parentId) => get().babies.filter((b) => b.parentId === parentId),

  getSiblingGroup: (siblingGroupId) =>
    get().bookings.filter((b) => b.siblingGroupId === siblingGroupId),

  getBookingsByCategory: (category) =>
    get().bookings.filter((b) => b.category === category),

  addTransferSuggestion: (t) =>
    set((s) => ({ transferSuggestions: [...s.transferSuggestions, t] })),

  getBookingsWithSiblings: (parentId) =>
    get().bookings.filter((b) => b.parentId === parentId && b.siblingGroupId),

  createSiblingBookings: (parentId, siblingGroupId, bookings) => {
    const newBookings = bookings.map((b) => ({
      ...b,
      siblingGroupId,
      category: 'sibling' as BookingCategory,
    }))
    set((s) => ({ bookings: [...s.bookings, ...newBookings] }))
    return newBookings
  },
}))
