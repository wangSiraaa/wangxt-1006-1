import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle, UserX, Clock,
  Phone, Baby, AlertCircle, Users, Star, Zap, Ticket
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useAuditStore } from '@/stores/auditStore'
import { useRuleStore } from '@/stores/ruleStore'
import { useReportStore } from '@/stores/reportStore'
import type { BookingStatus, BookingCategory } from '@/types'

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

const CATEGORY_LABEL: Record<BookingCategory, string> = {
  new_customer: '新客',
  sibling: '兄弟姐妹',
  noshow_recovery: '爽约恢复',
  conversion_followup: '转正跟进',
}

const CATEGORY_COLOR: Record<BookingCategory, string> = {
  new_customer: 'bg-blue-100 text-blue-700',
  sibling: 'bg-purple-100 text-purple-700',
  noshow_recovery: 'bg-amber-100 text-amber-700',
  conversion_followup: 'bg-green-100 text-green-700',
}

export default function Roster() {
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()))
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | 'all'>('all')

  const bookingStore = useBookingStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()
  const auditStore = useAuditStore()
  const ruleStore = useRuleStore()
  const reportStore = useReportStore()

  const schedulesOnDate = useMemo(
    () => {
      let schedules = scheduleStore.schedules.filter((s) => s.date === selectedDate)
      if (selectedTeacherId !== 'all') {
        schedules = schedules.filter((s) => s.teacherId === selectedTeacherId)
      }
      return schedules
    },
    [selectedDate, selectedTeacherId, scheduleStore.schedules]
  )

  const teacherWorkload = useMemo(() => {
    return scheduleStore.teachers.map((teacher) => {
      const teacherSchedules = scheduleStore.schedules.filter(
        (s) => s.date === selectedDate && s.teacherId === teacher.id
      )
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
  }, [scheduleStore.teachers, scheduleStore.schedules, selectedDate])

  function changeDate(offset: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(fmtDate(d))
  }

  function handleStatusChange(bookingId: string, scheduleId: string, newStatus: BookingStatus) {
    const booking = bookingStore.bookings.find((b) => b.id === bookingId)
    if (!booking) return

    bookingStore.updateBookingStatus(bookingId, newStatus)

    if (newStatus === 'noshow') {
      const parent = bookingStore.parents.find((p) => p.id === booking.parentId)
      if (parent) {
        const freezeRule = ruleStore.getRuleByType('freeze_duration')
        const freezeDays = freezeRule ? freezeRule.value : 7
        const until = new Date()
        until.setDate(until.getDate() + freezeDays)

        bookingStore.updateParent(parent.id, {
          freezeUntil: fmtDate(until),
          freezeReason: '爽约冻结',
        })
        auditStore.addLog(
          'freeze_applied',
          'teacher',
          'system',
          parent.id,
          `${parent.name}因爽约被冻结${freezeDays}天`
        )

        const todo = {
          id: `td_${Date.now()}`,
          bookingId,
          parentId: booking.parentId,
          babyId: booking.babyId,
          type: 'noshow' as const,
          title: '爽约回访',
          content: '宝宝爽约未到，需要跟进确认原因并提醒冻结规则',
          priority: 'high' as const,
          status: 'pending' as const,
          assigneeId: 'consultant1',
          dueDate: null,
          createdAt: fmtDate(new Date()),
          completedAt: null,
        }
        reportStore.addTodo(todo)
      }
      auditStore.addLog('booking_noshow', 'teacher', 'system', bookingId, '标记爽约')
    }

    if (newStatus === 'completed') {
      auditStore.addLog('booking_completed', 'teacher', 'system', bookingId, '标记已到')
    }
  }

  const dateLabel = (() => {
    const d = new Date(selectedDate)
    const today = new Date()
    const todayStr = fmtDate(today)
    const tomorrowStr = fmtDate(new Date(today.getTime() + 86400000))
    const yesterdayStr = fmtDate(new Date(today.getTime() - 86400000))
    if (selectedDate === todayStr) return '今天'
    if (selectedDate === tomorrowStr) return '明天'
    if (selectedDate === yesterdayStr) return '昨天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  })()

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">试听课花名册</h1>

        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between mb-6">
          <button
            onClick={() => changeDate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">{dateLabel}</p>
            <p className="text-xs text-gray-400">{selectedDate}</p>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> 老师接待压力
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedTeacherId('all')}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedTeacherId === 'all'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <p className="text-sm font-medium text-gray-800">全部老师</p>
              <p className="text-xs text-gray-500 mt-1">
                共 {scheduleStore.schedules.filter(s => s.date === selectedDate).length} 节课
              </p>
            </button>
            {teacherWorkload.map((teacher) => (
              <button
                key={teacher.id}
                onClick={() => setSelectedTeacherId(teacher.id)}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  selectedTeacherId === teacher.id
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{teacher.avatar}</span>
                  <span className="text-sm font-medium text-gray-800">{teacher.name}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        teacher.loadPercent >= 80 ? 'bg-red-400' :
                        teacher.loadPercent >= 50 ? 'bg-amber-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${teacher.loadPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{teacher.loadPercent}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {teacher.totalBooked}/{teacher.totalCapacity} 人 · {teacher.scheduleCount}节课
                </p>
              </button>
            ))}
          </div>
        </div>

        {schedulesOnDate.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">该日无课程安排</p>
          </div>
        )}

        {schedulesOnDate.map((schedule) => {
          const course = courseStore.courses.find((c) => c.id === schedule.courseId)
          const teacher = scheduleStore.teachers.find((t) => t.id === schedule.teacherId)
          const bookingsForSchedule = bookingStore.bookings.filter(
            (b) => b.scheduleId === schedule.id && b.status !== 'cancelled'
          )
          const classroom = scheduleStore.classrooms.find((c) => c.id === schedule.classroomId)

          return (
            <div key={schedule.id} className="mb-6">
              <div className="bg-orange-500 rounded-t-xl px-4 py-3 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{course?.name ?? '未知课程'}</span>
                    <span className="text-sm ml-2 opacity-80">{teacher?.avatar} {teacher?.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm opacity-90">
                    <Clock className="w-3.5 h-3.5" /> {schedule.startTime}-{schedule.endTime}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs opacity-75">
                  <span>{classroom?.name}</span>
                  <span>{schedule.bookedCount}/{schedule.maxCapacity} 人</span>
                  {teacher?.skills && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> {teacher.skills.slice(0, 2).join('、')}
                    </span>
                  )}
                </div>
              </div>

              {bookingsForSchedule.length === 0 ? (
                <div className="bg-white rounded-b-xl p-4 text-center text-gray-400 text-sm">
                  暂无预约
                </div>
              ) : (
                <div className="bg-white rounded-b-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-4 py-2 text-left font-medium">宝宝</th>
                        <th className="px-4 py-2 text-left font-medium">月龄</th>
                        <th className="px-4 py-2 text-left font-medium">分类标签</th>
                        <th className="px-4 py-2 text-left font-medium">家长</th>
                        <th className="px-4 py-2 text-center font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsForSchedule.map((booking) => {
                        const baby = bookingStore.babies.find((b) => b.id === booking.babyId)
                        const parent = bookingStore.parents.find((p) => p.id === booking.parentId)
                        const siblingGroup = booking.siblingGroupId
                          ? bookingStore.getSiblingGroup(booking.siblingGroupId)
                          : []
                        const hasSibling = siblingGroup.length > 1

                        return (
                          <tr key={booking.id} className="border-t border-gray-100">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Baby className="w-3.5 h-3.5 text-orange-400" />
                                <span className="font-medium text-gray-800">{baby?.name ?? '-'}</span>
                                {booking.isAgeMismatch && (
                                  <span title="年龄不匹配">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                  </span>
                                )}
                                {booking.isPromotionSlot && (
                                  <span title="促销名额">
                                    <Ticket className="w-3.5 h-3.5 text-purple-500" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`${booking.isAgeMismatch ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                                {baby?.ageMonths ?? '-'}月
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[booking.category]}`}>
                                  {CATEGORY_LABEL[booking.category]}
                                </span>
                                {hasSibling && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                    第{siblingGroup.findIndex(s => s.id === booking.id) + 1}宝
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-gray-600">{parent?.name ?? '-'}</p>
                                <span className="flex items-center gap-1 text-gray-400 text-xs">
                                  <Phone className="w-3 h-3" /> {parent?.phone ?? '-'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleStatusChange(booking.id, schedule.id, 'completed')}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                                    booking.status === 'completed'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  }`}
                                >
                                  <CheckCircle className="w-3 h-3 inline mr-0.5" /> 已到
                                </button>
                                <button
                                  onClick={() => handleStatusChange(booking.id, schedule.id, 'noshow')}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                                    booking.status === 'noshow'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                                  }`}
                                >
                                  <UserX className="w-3 h-3 inline mr-0.5" /> 爽约
                                </button>
                                {booking.status === 'confirmed' && (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                    未到
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
