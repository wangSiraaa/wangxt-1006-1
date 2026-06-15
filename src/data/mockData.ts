import type {
  Parent, Baby, Course, Teacher, Classroom, Schedule,
  Booking, WaitlistEntry, TrialReport, FunnelRecord,
  AuditLog, FrequencyRule, FollowUpTodo,
} from '@/types'

const today = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export const DEMO_PARENTS: Parent[] = [
  { id: 'p1', name: '王芳', phone: '13800001111', isBlacklisted: false, freezeUntil: null, freezeReason: null },
  { id: 'p2', name: '李丽', phone: '13800002222', isBlacklisted: false, freezeUntil: null, freezeReason: null },
  { id: 'p3', name: '张伟', phone: '13800003333', isBlacklisted: false, freezeUntil: null, freezeReason: null },
  { id: 'p4', name: '陈静', phone: '13800004444', isBlacklisted: false, freezeUntil: fmt(addDays(today, 5)), freezeReason: '爽约冻结' },
  { id: 'p5', name: '刘洋', phone: '13800005555', isBlacklisted: true, freezeUntil: null, freezeReason: '多次爽约' },
  { id: 'p6', name: '赵敏', phone: '13800006666', isBlacklisted: false, freezeUntil: null, freezeReason: null },
]

export const DEMO_BABIES: Baby[] = [
  { id: 'b1', parentId: 'p1', name: '小橙子', ageMonths: 10 },
  { id: 'b2', parentId: 'p2', name: '小柠檬', ageMonths: 18 },
  { id: 'b3', parentId: 'p3', name: '小葡萄', ageMonths: 8 },
  { id: 'b4', parentId: 'p4', name: '小苹果', ageMonths: 14 },
  { id: 'b5', parentId: 'p5', name: '小芒果', ageMonths: 22 },
  { id: 'b6', parentId: 'p6', name: '小桃子', ageMonths: 9 },
  { id: 'b7', parentId: 'p1', name: '小柚子', ageMonths: 20 },
]

export const DEMO_COURSES: Course[] = [
  {
    id: 'c1', name: '感统启蒙课', durationMinutes: 45, description: '适合6-12月宝宝，通过触觉、前庭觉刺激促进神经系统发育',
    ageRanges: [{ id: 'ar1', courseId: 'c1', minMonths: 6, maxMonths: 12, label: '6-12月' }],
    tags: [
      { id: 't1', courseId: 'c1', name: '大运动', color: '#F97316' },
      { id: 't2', courseId: 'c1', name: '感统训练', color: '#10B981' },
    ],
  },
  {
    id: 'c2', name: '音乐律动课', durationMinutes: 40, description: '适合12-24月宝宝，通过音乐和律动培养节奏感和社交能力',
    ageRanges: [{ id: 'ar2', courseId: 'c2', minMonths: 12, maxMonths: 24, label: '12-24月' }],
    tags: [
      { id: 't3', courseId: 'c2', name: '音乐启蒙', color: '#8B5CF6' },
      { id: 't4', courseId: 'c2', name: '社交能力', color: '#3B82F6' },
    ],
  },
  {
    id: 'c3', name: '精细动作课', durationMinutes: 35, description: '适合6-18月宝宝，锻炼手眼协调和精细操作能力',
    ageRanges: [
      { id: 'ar3', courseId: 'c3', minMonths: 6, maxMonths: 18, label: '6-18月' },
    ],
    tags: [
      { id: 't5', courseId: 'c3', name: '精细动作', color: '#EC4899' },
      { id: 't6', courseId: 'c3', name: '手眼协调', color: '#F59E0B' },
    ],
  },
  {
    id: 'c4', name: '语言探索课', durationMinutes: 40, description: '适合18-36月宝宝，通过绘本和互动游戏激发语言表达',
    ageRanges: [{ id: 'ar4', courseId: 'c4', minMonths: 18, maxMonths: 36, label: '18-36月' }],
    tags: [
      { id: 't7', courseId: 'c4', name: '语言发展', color: '#06B6D4' },
      { id: 't8', courseId: 'c4', name: '认知能力', color: '#84CC16' },
    ],
  },
]

export const DEMO_TEACHERS: Teacher[] = [
  { id: 'tch1', name: '周老师', avatar: '👩‍🏫', skills: ['大运动', '感统训练', '精细动作'], workload: 3 },
  { id: 'tch2', name: '吴老师', avatar: '👨‍🏫', skills: ['音乐启蒙', '社交能力', '语言发展'], workload: 4 },
  { id: 'tch3', name: '郑老师', avatar: '👩‍🎨', skills: ['精细动作', '手眼协调', '认知能力'], workload: 2 },
]

export const DEMO_CLASSROOMS: Classroom[] = [
  { id: 'cr1', name: '向日葵教室', capacity: 3 },
  { id: 'cr2', name: '小星星教室', capacity: 4 },
  { id: 'cr3', name: '彩虹教室', capacity: 3 },
]

export const DEMO_SCHEDULES: Schedule[] = [
  {
    id: 's1', courseId: 'c1', teacherId: 'tch1', classroomId: 'cr1',
    date: fmt(addDays(today, 1)), startTime: '09:00', endTime: '09:45',
    maxCapacity: 3, bookedCount: 3,
  },
  {
    id: 's2', courseId: 'c2', teacherId: 'tch2', classroomId: 'cr2',
    date: fmt(addDays(today, 1)), startTime: '10:00', endTime: '10:40',
    maxCapacity: 4, bookedCount: 2,
  },
  {
    id: 's3', courseId: 'c3', teacherId: 'tch3', classroomId: 'cr3',
    date: fmt(addDays(today, 2)), startTime: '09:30', endTime: '10:05',
    maxCapacity: 3, bookedCount: 0,
  },
  {
    id: 's4', courseId: 'c1', teacherId: 'tch1', classroomId: 'cr1',
    date: fmt(addDays(today, 3)), startTime: '09:00', endTime: '09:45',
    maxCapacity: 3, bookedCount: 1,
  },
  {
    id: 's5', courseId: 'c4', teacherId: 'tch2', classroomId: 'cr2',
    date: fmt(addDays(today, 3)), startTime: '14:00', endTime: '14:40',
    maxCapacity: 4, bookedCount: 0,
  },
  {
    id: 's6', courseId: 'c2', teacherId: 'tch3', classroomId: 'cr3',
    date: fmt(addDays(today, 4)), startTime: '10:00', endTime: '10:40',
    maxCapacity: 3, bookedCount: 2,
  },
]

export const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'bk1', scheduleId: 's1', babyId: 'b1', parentId: 'p1',
    status: 'confirmed', createdAt: fmt(addDays(today, -1)), isAgeMismatch: false,
    category: 'sibling', siblingGroupId: 'sg1', isPromotionSlot: false, transferSuggestion: null,
  },
  {
    id: 'bk2', scheduleId: 's1', babyId: 'b3', parentId: 'p3',
    status: 'confirmed', createdAt: fmt(addDays(today, -1)), isAgeMismatch: false,
    category: 'new_customer', siblingGroupId: null, isPromotionSlot: true, transferSuggestion: null,
  },
  {
    id: 'bk3', scheduleId: 's1', babyId: 'b6', parentId: 'p6',
    status: 'confirmed', createdAt: fmt(addDays(today, -1)), isAgeMismatch: false,
    category: 'new_customer', siblingGroupId: null, isPromotionSlot: false, transferSuggestion: null,
  },
  {
    id: 'bk4', scheduleId: 's2', babyId: 'b2', parentId: 'p2',
    status: 'confirmed', createdAt: fmt(addDays(today, -1)), isAgeMismatch: false,
    category: 'conversion_followup', siblingGroupId: null, isPromotionSlot: true, transferSuggestion: null,
  },
  {
    id: 'bk5', scheduleId: 's2', babyId: 'b4', parentId: 'p4',
    status: 'confirmed', createdAt: fmt(addDays(today, -1)), isAgeMismatch: true,
    category: 'noshow_recovery', siblingGroupId: null, isPromotionSlot: false, transferSuggestion: null,
  },
  {
    id: 'bk6', scheduleId: 's6', babyId: 'b2', parentId: 'p2',
    status: 'completed', createdAt: fmt(addDays(today, -7)), isAgeMismatch: false,
    category: 'new_customer', siblingGroupId: null, isPromotionSlot: false, transferSuggestion: null,
  },
  {
    id: 'bk7', scheduleId: 's4', babyId: 'b7', parentId: 'p1',
    status: 'confirmed', createdAt: fmt(addDays(today, -1)), isAgeMismatch: true,
    category: 'sibling', siblingGroupId: 'sg1', isPromotionSlot: false, transferSuggestion: null,
  },
]

export const DEMO_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wl1', scheduleId: 's1', babyId: 'b4', parentId: 'p4',
    position: 1, status: 'waiting', createdAt: fmt(addDays(today, -1)),
  },
]

export const DEMO_REPORTS: TrialReport[] = [
  {
    id: 'r1', bookingId: 'bk6',
    performance: '宝宝对音乐节奏反应积极，愿意与其他小朋友互动',
    abilityScores: [
      { tagName: '音乐启蒙', score: 4 },
      { tagName: '社交能力', score: 3 },
    ],
    courseSuggestion: '建议报名音乐律动课正式课程',
    teacherNote: '宝宝表现很好，可以尝试进阶课程',
    isClassSuitable: true,
    unsuitableReason: null,
    transferSuggestionId: null,
  },
]

export const DEMO_TODOS: FollowUpTodo[] = [
  {
    id: 'td1', bookingId: 'bk6', parentId: 'p2', babyId: 'b2',
    type: 'conversion', title: '试听后跟进回访',
    content: '小柠檬试听音乐律动课后表现良好，建议跟进回访推荐正式课程',
    priority: 'high', status: 'pending', assigneeId: 'consultant1',
    dueDate: fmt(addDays(today, 2)), createdAt: fmt(addDays(today, -1)), completedAt: null,
  },
  {
    id: 'td2', bookingId: 'bk5', parentId: 'p4', babyId: 'b4',
    type: 'transfer', title: '年龄不匹配转班建议',
    content: '小苹果年龄偏小，建议从音乐律动课转到感统启蒙课',
    priority: 'medium', status: 'pending', assigneeId: 'consultant1',
    dueDate: fmt(addDays(today, 1)), createdAt: fmt(addDays(today, -1)), completedAt: null,
  },
  {
    id: 'td3', bookingId: 'bk2', parentId: 'p3', babyId: 'b3',
    type: 'general', title: '促销名额确认',
    content: '小葡萄使用了促销名额，请确认家长是否已知晓优惠详情',
    priority: 'low', status: 'completed', assigneeId: 'consultant1',
    dueDate: fmt(addDays(today, -1)), createdAt: fmt(addDays(today, -2)), completedAt: fmt(addDays(today, -1)),
  },
]

export const DEMO_FUNNEL: FunnelRecord[] = [
  {
    id: 'f1', bookingId: 'bk6', parentId: 'p2', babyId: 'b2',
    stage: 'coupon_sent',
    notes: [
      { id: 'fn1', content: '试听后家长表现积极，推荐12课时包', createdAt: fmt(addDays(today, -5)), operatorId: 'consultant1' },
      { id: 'fn2', content: '已发放200元优惠券', createdAt: fmt(addDays(today, -4)), operatorId: 'consultant1' },
    ],
    couponCode: 'YX200',
    createdAt: fmt(addDays(today, -7)),
    updatedAt: fmt(addDays(today, -4)),
    todoIds: ['td1'],
    isPromotionCustomer: true,
    siblingGroupId: null,
    category: 'conversion_followup',
    transferSuggestion: null,
  },
]

export const DEMO_AUDIT: AuditLog[] = [
  { id: 'a1', action: 'booking_created', operatorRole: 'parent', operatorId: 'p1', targetId: 'bk1', detail: '王芳为小橙子预约感统启蒙课', createdAt: new Date(addDays(today, -1).getTime() + 3600000 * 9).toISOString() },
  { id: 'a2', action: 'booking_created', operatorRole: 'parent', operatorId: 'p3', targetId: 'bk2', detail: '张伟为小葡萄预约感统启蒙课', createdAt: new Date(addDays(today, -1).getTime() + 3600000 * 10).toISOString() },
  { id: 'a3', action: 'waitlist_joined', operatorRole: 'system', operatorId: 'p4', targetId: 'wl1', detail: '陈静为小苹果进入候补队列（感统启蒙课已满）', createdAt: new Date(addDays(today, -1).getTime() + 3600000 * 11).toISOString() },
  { id: 'a4', action: 'freeze_applied', operatorRole: 'system', operatorId: 'system', targetId: 'p4', detail: '陈静因爽约被冻结7天', createdAt: new Date(addDays(today, -2).getTime() + 3600000 * 15).toISOString() },
  { id: 'a5', action: 'blacklist_added', operatorRole: 'consultant', operatorId: 'consultant1', targetId: 'p5', detail: '刘洋因多次爽约加入黑名单', createdAt: new Date(addDays(today, -10).getTime() + 3600000 * 14).toISOString() },
  { id: 'a6', action: 'funnel_updated', operatorRole: 'consultant', operatorId: 'consultant1', targetId: 'f1', detail: '李丽转正状态更新为"已发优惠券"', createdAt: new Date(addDays(today, -4).getTime() + 3600000 * 16).toISOString() },
]

export const DEMO_RULES: FrequencyRule[] = [
  { id: 'r1', name: '手机号每周预约限制', type: 'phone_weekly', value: 1, unit: 'times', enabled: true },
  { id: 'r2', name: '爽约冻结天数', type: 'freeze_duration', value: 7, unit: 'days', enabled: true },
  { id: 'r3', name: '黑名单规则', type: 'blacklist', value: 3, unit: 'times', enabled: true },
  { id: 'r4', name: '爽约转手机号预约', type: 'phone_transfer_allowed', value: 1, unit: 'boolean', enabled: true },
  { id: 'r5', name: '每月促销名额', type: 'promotion_slots', value: 20, unit: 'count', enabled: true },
  { id: 'r6', name: '兄弟姐妹优惠', type: 'sibling_discount', value: 10, unit: 'times', enabled: true },
]
