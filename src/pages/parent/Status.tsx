import { useState, useMemo } from 'react'
import {
  Phone, Search, Calendar, Clock, AlertTriangle,
  CheckCircle, XCircle, UserX, BookOpen, X
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useAuditStore } from '@/stores/auditStore'
import type { BookingStatus } from '@/types'

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500', icon: XCircle },
  noshow: { label: '爽约', color: 'bg-red-100 text-red-600', icon: UserX },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-600', icon: BookOpen },
}

export default function Status() {
  const [phone, setPhone] = useState('')
  const [searched, setSearched] = useState(false)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const bookingStore = useBookingStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()
  const auditStore = useAuditStore()

  const parent = useMemo(
    () => (searched ? bookingStore.getParentByPhone(phone) : undefined),
    [searched, phone, bookingStore.parents]
  )

  const freezeInfo = useMemo(
    () => (parent ? bookingStore.isPhoneFrozen(parent.phone) : { frozen: false, reason: null, until: null }),
    [parent, bookingStore.parents]
  )

  const bookings = useMemo(() => {
    if (!parent) return []
    return bookingStore.bookings
      .filter((b) => b.parentId === parent.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [parent, bookingStore.bookings])

  const waitlistEntries = useMemo(() => {
    if (!parent) return []
    return bookingStore.waitlist.filter((w) => w.parentId === parent.id && w.status === 'waiting')
  }, [parent, bookingStore.waitlist])

  function handleSearch() {
    setSearched(true)
  }

  function handleCancelBooking(bookingId: string, scheduleId: string) {
    bookingStore.updateBookingStatus(bookingId, 'cancelled')
    scheduleStore.decrementBooked(scheduleId)

    const waitingEntries = bookingStore.waitlist.filter(
      (w) => w.scheduleId === scheduleId && w.status === 'waiting'
    )
    if (waitingEntries.length > 0) {
      const firstWaitlist = waitingEntries.sort((a, b) => a.position - b.position)[0]
      const baby = bookingStore.babies.find((b) => b.id === firstWaitlist.babyId)
      const schedule = scheduleStore.schedules.find((s) => s.id === scheduleId)
      const course = schedule ? courseStore.courses.find((c) => c.id === schedule.courseId) : undefined

      const ageMismatch = course
        ? !course.ageRanges.some((ar) => baby && baby.ageMonths >= ar.minMonths && baby.ageMonths <= ar.maxMonths)
        : false

      bookingStore.convertWaitlistToBooking(firstWaitlist.id, {
        id: `bk${Date.now()}`,
        scheduleId,
        babyId: firstWaitlist.babyId,
        parentId: firstWaitlist.parentId,
        status: 'confirmed',
        createdAt: new Date().toISOString().slice(0, 10),
        isAgeMismatch: ageMismatch,
        category: 'new_customer',
        siblingGroupId: null,
        isPromotionSlot: false,
        transferSuggestion: null,
      })
      scheduleStore.incrementBooked(scheduleId)
      auditStore.addLog('waitlist_converted', 'system', 'system', firstWaitlist.id, '候补自动转正')
    }

    if (parent) {
      auditStore.addLog('booking_cancelled', 'parent', parent.id, bookingId, `${parent.name}取消了预约`)
    }
    setConfirmCancelId(null)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">我的预约</h1>

        {!searched && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-sm text-gray-500">输入手机号查询您的预约记录</p>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={phone.length < 11}
              className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition ${
                phone.length >= 11
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <Search className="w-4 h-4" /> 查询
            </button>
          </div>
        )}

        {searched && !parent && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500">未找到该手机号的预约记录</p>
            <button
              onClick={() => { setSearched(false); setPhone('') }}
              className="mt-3 text-orange-500 text-sm font-medium hover:underline"
            >
              重新查询
            </button>
          </div>
        )}

        {parent && (
          <div className="space-y-4">
            {freezeInfo.frozen && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">
                  该手机号因{freezeInfo.reason}被冻结，解冻日期：{freezeInfo.until}
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-lg">{parent.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{parent.name}</p>
                <p className="text-sm text-gray-500">{parent.phone}</p>
              </div>
              <button
                onClick={() => { setSearched(false); setPhone('') }}
                className="ml-auto text-orange-500 text-xs font-medium hover:underline"
              >
                切换账号
              </button>
            </div>

            {bookings.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">预约记录</h2>
                <div className="space-y-3">
                  {bookings.map((booking) => {
                    const schedule = scheduleStore.schedules.find((s) => s.id === booking.scheduleId)
                    const course = schedule ? courseStore.courses.find((c) => c.id === schedule.courseId) : undefined
                    const teacher = schedule ? scheduleStore.teachers.find((t) => t.id === schedule.teacherId) : undefined
                    const baby = bookingStore.babies.find((b) => b.id === booking.babyId)
                    const cfg = statusConfig[booking.status]
                    const StatusIcon = cfg.icon

                    return (
                      <div key={booking.id} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-semibold text-gray-800">{course?.name ?? '未知课程'}</span>
                            {baby && <span className="text-sm text-gray-500 ml-2">{baby.name}</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </div>
                        {schedule && (
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {schedule.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {schedule.startTime}-{schedule.endTime}
                            </span>
                            {teacher && <span>{teacher.avatar} {teacher.name}</span>}
                          </div>
                        )}
                        {booking.isAgeMismatch && (
                          <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 月龄不在课程范围内
                          </p>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => setConfirmCancelId(booking.id)}
                            className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> 取消预约
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {waitlistEntries.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">候补队列</h2>
                <div className="space-y-3">
                  {waitlistEntries.map((wl) => {
                    const schedule = scheduleStore.schedules.find((s) => s.id === wl.scheduleId)
                    const course = schedule ? courseStore.courses.find((c) => c.id === schedule.courseId) : undefined
                    const baby = bookingStore.babies.find((b) => b.id === wl.babyId)

                    return (
                      <div key={wl.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-400">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-gray-800">{course?.name ?? '未知课程'}</span>
                            {baby && <span className="text-sm text-gray-500 ml-2">{baby.name}</span>}
                          </div>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            候补第{wl.position}位
                          </span>
                        </div>
                        {schedule && (
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {schedule.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {schedule.startTime}-{schedule.endTime}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {bookings.length === 0 && waitlistEntries.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400">暂无预约记录</p>
              </div>
            )}
          </div>
        )}

        {confirmCancelId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">确认取消</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">确定要取消该预约吗？取消后不可恢复。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmCancelId(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
                >
                  返回
                </button>
                <button
                  onClick={() => {
                    const booking = bookingStore.bookings.find((b) => b.id === confirmCancelId)
                    if (booking) handleCancelBooking(booking.id, booking.scheduleId)
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition"
                >
                  确认取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
