import { useState, useMemo } from 'react'
import {
  Users, Baby, RotateCcw, TrendingUp, Clock, CheckCircle,
  AlertCircle, ChevronRight, Calendar, Phone, Star,
  UserPlus, UserCheck, Zap, Ticket
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useReportStore } from '@/stores/reportStore'
import type { BookingCategory, FollowUpTodo, Booking } from '@/types'

const CATEGORY_INFO: Record<BookingCategory, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  new_customer: { label: '新客试听', icon: UserPlus, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  sibling: { label: '兄弟姐妹同约', icon: Baby, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  noshow_recovery: { label: '爽约恢复', icon: RotateCcw, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  conversion_followup: { label: '转正跟进', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
}

const PRIORITY_COLOR = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PRIORITY_LABEL = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

const TODO_TYPE_LABEL: Record<FollowUpTodo['type'], string> = {
  transfer: '转班跟进',
  conversion: '转正跟进',
  noshow: '爽约回访',
  general: '一般跟进',
}

export default function TrialOverview() {
  const { bookings, babies, parents, getSiblingGroup } = useBookingStore()
  const { schedules, teachers } = useScheduleStore()
  const { courses } = useCourseStore()
  const { todos, completeTodo } = useReportStore()
  const [activeCategory, setActiveCategory] = useState<BookingCategory | 'all'>('all')
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)

  const activeBookings = useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'cancelled')
    if (activeCategory === 'all') return active
    return active.filter((b) => b.category === activeCategory)
  }, [bookings, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<BookingCategory, number> = {
      new_customer: 0,
      sibling: 0,
      noshow_recovery: 0,
      conversion_followup: 0,
    }
    bookings.forEach((b) => {
      if (b.status !== 'cancelled') {
        counts[b.category]++
      }
    })
    return counts
  }, [bookings])

  const pendingTodos = useMemo(() =>
    todos.filter((t) => t.status === 'pending').sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  , [todos])

  const teacherWorkload = useMemo(() => {
    return teachers.map((teacher) => {
      const teacherSchedules = schedules.filter((s) => s.teacherId === teacher.id)
      const totalBooked = teacherSchedules.reduce((sum, s) => sum + s.bookedCount, 0)
      const totalCapacity = teacherSchedules.reduce((sum, s) => sum + s.maxCapacity, 0)
      return {
        ...teacher,
        scheduleCount: teacherSchedules.length,
        totalBooked,
        totalCapacity,
        loadPercent: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
      }
    })
  }, [teachers, schedules])

  function getParent(parentId: string) {
    return parents.find((p) => p.id === parentId)
  }

  function getBaby(babyId: string) {
    return babies.find((b) => b.id === babyId)
  }

  function getSchedule(scheduleId: string) {
    return schedules.find((s) => s.id === scheduleId)
  }

  function getCourse(courseId: string) {
    return courses.find((c) => c.id === courseId)
  }

  function getTeacher(teacherId: string) {
    return teachers.find((t) => t.id === teacherId)
  }

  function getBookingTodos(bookingId: string) {
    return todos.filter((t) => t.bookingId === bookingId && t.status === 'pending')
  }

  function handleCompleteTodo(todoId: string) {
    completeTodo(todoId)
  }

  const totalBookings = bookings.filter((b) => b.status !== 'cancelled').length

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">试听总览</h1>
            <p className="mt-1 text-sm text-gray-500">管理试听预约、跟进回访和老师排班</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">今日共 {totalBookings} 个有效预约</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          {(Object.keys(CATEGORY_INFO) as BookingCategory[]).map((cat) => {
            const info = CATEGORY_INFO[cat]
            const count = categoryCounts[cat]
            const Icon = info.icon
            return (
              <div
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  activeCategory === cat
                    ? `${info.borderColor} ${info.bgColor} shadow-md`
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${info.bgColor}`}>
                    <Icon className={`h-5 w-5 ${info.color}`} />
                  </div>
                  <span className={`text-2xl font-bold ${info.color}`}>{count}</span>
                </div>
                <p className={`mt-2 text-sm font-medium ${info.color}`}>{info.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeCategory === 'all' ? '全部预约' : CATEGORY_INFO[activeCategory].label}
              </h2>
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  查看全部
                </button>
              )}
            </div>

            {activeBookings.length === 0 ? (
              <div className="rounded-xl border border-orange-100 bg-white p-12 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-400">暂无预约记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBookings.map((booking) => {
                  const parent = getParent(booking.parentId)
                  const baby = getBaby(booking.babyId)
                  const schedule = getSchedule(booking.scheduleId)
                  const course = schedule ? getCourse(schedule.courseId) : undefined
                  const teacher = schedule ? getTeacher(schedule.teacherId) : undefined
                  const categoryInfo = CATEGORY_INFO[booking.category]
                  const CatIcon = categoryInfo.icon
                  const bookingTodos = getBookingTodos(booking.id)
                  const siblingGroup = booking.siblingGroupId ? getSiblingGroup(booking.siblingGroupId) : []
                  const isExpanded = expandedBookingId === booking.id

                  return (
                    <div
                      key={booking.id}
                      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
                        isExpanded ? categoryInfo.borderColor : 'border-gray-100'
                      }`}
                    >
                      <div
                        className="cursor-pointer p-4 hover:bg-gray-50"
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${categoryInfo.bgColor}`}>
                              <CatIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{baby?.name ?? '未知'}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                                  {categoryInfo.label}
                                </span>
                                {booking.isAgeMismatch && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                    <AlertCircle className="h-3 w-3" /> 年龄不匹配
                                  </span>
                                )}
                                {booking.isPromotionSlot && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                                    <Ticket className="h-3 w-3" /> 促销名额
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {parent?.name ?? '未知家长'} · {parent?.phone ?? ''}
                              </p>
                              <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {schedule?.date ?? '-'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {schedule?.startTime ?? '-'}-{schedule?.endTime ?? '-'}
                                </span>
                                <span>{course?.name ?? '-'}</span>
                                <span>{teacher?.name ?? '-'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {bookingTodos.length > 0 && (
                              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                                <Clock className="h-3 w-3" /> {bookingTodos.length} 项待办
                              </span>
                            )}
                            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">宝宝信息</h4>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">姓名</span>
                                  <span className="font-medium text-gray-800">{baby?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">月龄</span>
                                  <span className="font-medium text-gray-800">{baby?.ageMonths}个月</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">家长</span>
                                  <span className="font-medium text-gray-800">{parent?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">电话</span>
                                  <span className="font-medium text-gray-800 flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {parent?.phone}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">课程信息</h4>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">课程</span>
                                  <span className="font-medium text-gray-800">{course?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">老师</span>
                                  <span className="font-medium text-gray-800">{teacher?.avatar} {teacher?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">教室</span>
                                  <span className="font-medium text-gray-800">
                                    {schedule ? schedules.find(s => s.id === schedule.id)?.classroomId : '-'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">状态</span>
                                  <span className={`font-medium ${
                                    booking.status === 'confirmed' ? 'text-blue-600' :
                                    booking.status === 'completed' ? 'text-green-600' :
                                    booking.status === 'noshow' ? 'text-red-600' : 'text-gray-500'
                                  }`}>
                                    {booking.status === 'confirmed' ? '已确认' :
                                     booking.status === 'completed' ? '已完成' :
                                     booking.status === 'noshow' ? '已爽约' : '已取消'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {siblingGroup.length > 0 && (
                            <div className="mt-4">
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">兄弟姐妹同约</h4>
                              <div className="space-y-2">
                                {siblingGroup.filter((sb) => sb.id !== booking.id).map((sb) => {
                                  const sbBaby = getBaby(sb.babyId)
                                  const sbSchedule = getSchedule(sb.scheduleId)
                                  const sbCourse = sbSchedule ? getCourse(sbSchedule.courseId) : undefined
                                  return (
                                    <div key={sb.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Baby className="h-4 w-4 text-purple-500" />
                                        <span className="font-medium text-gray-800">{sbBaby?.name}</span>
                                        <span className="text-gray-400">{sbBaby?.ageMonths}个月</span>
                                      </div>
                                      <div className="text-gray-500">
                                        {sbCourse?.name} · {sbSchedule?.date}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {bookingTodos.length > 0 && (
                            <div className="mt-4">
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">待办事项</h4>
                              <div className="space-y-2">
                                {bookingTodos.map((todo) => (
                                  <div key={todo.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLOR[todo.priority]}`}>
                                        {PRIORITY_LABEL[todo.priority]}
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">{todo.title}</span>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCompleteTodo(todo.id) }}
                                      className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100"
                                    >
                                      <CheckCircle className="h-3 w-3" /> 完成
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {booking.transferSuggestion && (
                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-700">转班建议</span>
                              </div>
                              <p className="mt-1 text-xs text-amber-600">{booking.transferSuggestion.reason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">待办事项</h2>
              {pendingTodos.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-300" />
                  <p className="text-sm text-gray-400">暂无待办</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTodos.slice(0, 5).map((todo) => {
                    const baby = getBaby(todo.babyId)
                    return (
                      <div key={todo.id} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className={`mt-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLOR[todo.priority]}`}>
                              {PRIORITY_LABEL[todo.priority]}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{todo.title}</p>
                              <p className="text-xs text-gray-500">
                                {baby?.name ?? ''} · {TODO_TYPE_LABEL[todo.type]}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCompleteTodo(todo.id)}
                            className="rounded p-1 hover:bg-gray-100"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </button>
                        </div>
                        {todo.dueDate && (
                          <p className="mt-1 text-[10px] text-gray-400">截止：{todo.dueDate}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {pendingTodos.length > 5 && (
                <p className="mt-3 text-center text-xs text-gray-400">还有 {pendingTodos.length - 5} 项待办</p>
              )}
            </div>

            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">老师接待压力</h2>
              <div className="space-y-3">
                {teacherWorkload.map((teacher) => (
                  <div key={teacher.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{teacher.avatar}</span>
                        <span className="font-medium text-gray-800">{teacher.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        teacher.loadPercent >= 80 ? 'text-red-500' :
                        teacher.loadPercent >= 50 ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {teacher.totalBooked}/{teacher.totalCapacity} 人
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            teacher.loadPercent >= 80 ? 'bg-red-400' :
                            teacher.loadPercent >= 50 ? 'bg-amber-400' : 'bg-green-400'
                          }`}
                          style={{ width: `${teacher.loadPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">{teacher.loadPercent}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {teacher.skills.map((skill) => (
                        <span key={skill} className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-600">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">快速统计</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">总预约数</span>
                  <span className="font-semibold text-gray-800">{totalBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">新客占比</span>
                  <span className="font-semibold text-blue-600">
                    {totalBookings > 0 ? Math.round((categoryCounts.new_customer / totalBookings) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">兄弟姐妹同约</span>
                  <span className="font-semibold text-purple-600">{categoryCounts.sibling}组</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">待处理转班</span>
                  <span className="font-semibold text-amber-600">
                    {todos.filter((t) => t.type === 'transfer' && t.status === 'pending').length}个
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">促销名额使用</span>
                  <span className="font-semibold text-purple-600">
                    {bookings.filter((b) => b.isPromotionSlot && b.status !== 'cancelled').length}个
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
