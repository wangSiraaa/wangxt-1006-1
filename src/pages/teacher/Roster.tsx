import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, CheckCircle, UserX, Clock,
  Phone, Baby
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useAuditStore } from '@/stores/auditStore'
import { useRuleStore } from '@/stores/ruleStore'
import type { BookingStatus } from '@/types'

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

export default function Roster() {
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()))

  const bookingStore = useBookingStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()
  const auditStore = useAuditStore()
  const ruleStore = useRuleStore()

  const schedulesOnDate = useMemo(
    () => scheduleStore.schedules.filter((s) => s.date === selectedDate),
    [selectedDate, scheduleStore.schedules]
  )

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
      <div className="max-w-2xl mx-auto px-4 py-6">
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
                <p className="text-xs opacity-75 mt-1">
                  {schedule.bookedCount}/{schedule.maxCapacity} 人
                </p>
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
                        <th className="px-4 py-2 text-left font-medium">家长</th>
                        <th className="px-4 py-2 text-left font-medium">电话</th>
                        <th className="px-4 py-2 text-center font-medium">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsForSchedule.map((booking) => {
                        const baby = bookingStore.babies.find((b) => b.id === booking.babyId)
                        const parent = bookingStore.parents.find((p) => p.id === booking.parentId)

                        return (
                          <tr key={booking.id} className="border-t border-gray-100">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Baby className="w-3.5 h-3.5 text-orange-400" />
                                <span className="font-medium text-gray-800">{baby?.name ?? '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{baby?.ageMonths ?? '-'}月</td>
                            <td className="px-4 py-3 text-gray-600">{parent?.name ?? '-'}</td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Phone className="w-3 h-3" /> {parent?.phone ?? '-'}
                              </span>
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
