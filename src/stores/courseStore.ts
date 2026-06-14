import { create } from 'zustand'
import type { Course, CourseAgeRange, CourseTag } from '@/types'
import { DEMO_COURSES } from '@/data/mockData'

interface CourseState {
  courses: Course[]
  addCourse: (course: Course) => void
  updateCourse: (id: string, data: Partial<Course>) => void
  deleteCourse: (id: string) => void
  addAgeRange: (courseId: string, range: CourseAgeRange) => void
  removeAgeRange: (courseId: string, rangeId: string) => void
  addTag: (courseId: string, tag: CourseTag) => void
  removeTag: (courseId: string, tagId: string) => void
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: DEMO_COURSES,
  addCourse: (course) => set((s) => ({ courses: [...s.courses, course] })),
  updateCourse: (id, data) => set((s) => ({
    courses: s.courses.map((c) => (c.id === id ? { ...c, ...data } : c)),
  })),
  deleteCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),
  addAgeRange: (courseId, range) => set((s) => ({
    courses: s.courses.map((c) =>
      c.id === courseId ? { ...c, ageRanges: [...c.ageRanges, range] } : c
    ),
  })),
  removeAgeRange: (courseId, rangeId) => set((s) => ({
    courses: s.courses.map((c) =>
      c.id === courseId
        ? { ...c, ageRanges: c.ageRanges.filter((ar) => ar.id !== rangeId) }
        : c
    ),
  })),
  addTag: (courseId, tag) => set((s) => ({
    courses: s.courses.map((c) =>
      c.id === courseId ? { ...c, tags: [...c.tags, tag] } : c
    ),
  })),
  removeTag: (courseId, tagId) => set((s) => ({
    courses: s.courses.map((c) =>
      c.id === courseId
        ? { ...c, tags: c.tags.filter((t) => t.id !== tagId) }
        : c
    ),
  })),
}))
