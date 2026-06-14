import { create } from 'zustand'
import type { Teacher, Classroom, Schedule } from '@/types'
import { DEMO_TEACHERS, DEMO_CLASSROOMS, DEMO_SCHEDULES } from '@/data/mockData'

interface ScheduleState {
  teachers: Teacher[]
  classrooms: Classroom[]
  schedules: Schedule[]
  addTeacher: (t: Teacher) => void
  addClassroom: (c: Classroom) => void
  updateClassroom: (id: string, data: Partial<Classroom>) => void
  addSchedule: (s: Schedule) => void
  updateSchedule: (id: string, data: Partial<Schedule>) => void
  removeSchedule: (id: string) => void
  incrementBooked: (scheduleId: string) => void
  decrementBooked: (scheduleId: string) => void
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  teachers: DEMO_TEACHERS,
  classrooms: DEMO_CLASSROOMS,
  schedules: DEMO_SCHEDULES,
  addTeacher: (t) => set((s) => ({ teachers: [...s.teachers, t] })),
  addClassroom: (c) => set((s) => ({ classrooms: [...s.classrooms, c] })),
  updateClassroom: (id, data) => set((s) => ({
    classrooms: s.classrooms.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),
  addSchedule: (sch) => set((s) => ({ schedules: [...s.schedules, sch] })),
  updateSchedule: (id, data) => set((s) => ({
    schedules: s.schedules.map((sc) => (sc.id === id ? { ...sc, ...data } : sc)),
  })),
  removeSchedule: (id) => set((s) => ({
    schedules: s.schedules.filter((sc) => sc.id !== id),
  })),
  incrementBooked: (scheduleId) => set((s) => ({
    schedules: s.schedules.map((sc) =>
      sc.id === scheduleId ? { ...sc, bookedCount: sc.bookedCount + 1 } : sc
    ),
  })),
  decrementBooked: (scheduleId) => set((s) => ({
    schedules: s.schedules.map((sc) =>
      sc.id === scheduleId ? { ...sc, bookedCount: Math.max(0, sc.bookedCount - 1) } : sc
    ),
  })),
}))
