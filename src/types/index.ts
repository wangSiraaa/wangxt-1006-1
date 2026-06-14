export interface Parent {
  id: string
  name: string
  phone: string
  isBlacklisted: boolean
  freezeUntil: string | null
  freezeReason: string | null
}

export interface Baby {
  id: string
  parentId: string
  name: string
  ageMonths: number
}

export interface Course {
  id: string
  name: string
  durationMinutes: number
  description: string
  ageRanges: CourseAgeRange[]
  tags: CourseTag[]
}

export interface CourseAgeRange {
  id: string
  courseId: string
  minMonths: number
  maxMonths: number
  label: string
}

export interface CourseTag {
  id: string
  courseId: string
  name: string
  color: string
}

export interface Teacher {
  id: string
  name: string
  avatar: string
}

export interface Classroom {
  id: string
  name: string
  capacity: number
}

export interface Schedule {
  id: string
  courseId: string
  teacherId: string
  classroomId: string
  date: string
  startTime: string
  endTime: string
  maxCapacity: number
  bookedCount: number
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'noshow' | 'completed'

export interface Booking {
  id: string
  scheduleId: string
  babyId: string
  parentId: string
  status: BookingStatus
  createdAt: string
  isAgeMismatch: boolean
}

export type WaitlistStatus = 'waiting' | 'converted' | 'cancelled'

export interface WaitlistEntry {
  id: string
  scheduleId: string
  babyId: string
  parentId: string
  position: number
  status: WaitlistStatus
  createdAt: string
}

export interface TrialReport {
  id: string
  bookingId: string
  performance: string
  abilityScores: AbilityScore[]
  courseSuggestion: string
  teacherNote: string
}

export interface AbilityScore {
  tagName: string
  score: number
}

export type FunnelStage = 'trial' | 'interested' | 'coupon_sent' | 'signed' | 'lost'

export interface FunnelRecord {
  id: string
  bookingId: string
  parentId: string
  babyId: string
  stage: FunnelStage
  notes: FollowUpNote[]
  couponCode: string | null
  createdAt: string
  updatedAt: string
}

export interface FollowUpNote {
  id: string
  content: string
  createdAt: string
  operatorId: string
}

export type AuditAction =
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_noshow'
  | 'booking_completed'
  | 'waitlist_joined'
  | 'waitlist_converted'
  | 'freeze_applied'
  | 'freeze_expired'
  | 'blacklist_added'
  | 'blacklist_removed'
  | 'course_created'
  | 'course_updated'
  | 'schedule_created'
  | 'report_submitted'
  | 'funnel_updated'

export type AuditOperatorRole = 'consultant' | 'teacher' | 'system' | 'parent'

export interface AuditLog {
  id: string
  action: AuditAction
  operatorRole: AuditOperatorRole
  operatorId: string
  targetId: string
  detail: string
  createdAt: string
}

export interface FrequencyRule {
  id: string
  name: string
  type: 'phone_weekly' | 'freeze_duration' | 'blacklist'
  value: number
  unit: 'days' | 'times'
  enabled: boolean
}

export type Role = 'consultant' | 'parent' | 'teacher'
