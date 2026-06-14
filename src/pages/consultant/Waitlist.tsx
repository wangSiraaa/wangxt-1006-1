import { useMemo } from 'react'
import { Users, ArrowRightToLine } from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import type { WaitlistEntry, Booking } from '@/types'

export default function Waitlist() {
  const { waitlist, parents, babies, convertWaitlistToBooking, updateWaitlistStatus } = useBookingStore()
  const { schedules } = useScheduleStore()
  const { courses } = useCourseStore()

  const grouped = useMemo(() => {
    const map = new Map<string, WaitlistEntry[]>()
    waitlist.forEach((w) => {
      const list = map.get(w.scheduleId) ?? []
      list.push(w)
      map.set(w.scheduleId, list)
    })
    return Array.from(map.entries()).map(([scheduleId, entries]) => {
      const schedule = schedules.find((s) => s.id === scheduleId)
      const course = schedule ? courses.find((c) => c.id === schedule.courseId) : null
      return {
        scheduleId,
        schedule,
        course,
        entries: entries.sort((a, b) => a.position - b.position),
      }
    })
  }, [waitlist, schedules, courses])

  const getParent = (id: string) => parents.find((p) => p.id === id)
  const getBaby = (id: string) => babies.find((b) => b.id === id)

  const handleConvert = (entry: WaitlistEntry) => {
    const schedule = schedules.find((s) => s.id === entry.scheduleId)
    if (!schedule) return
    const booking: Booking = {
      id: `bk${Date.now()}`,
      scheduleId: entry.scheduleId,
      babyId: entry.babyId,
      parentId: entry.parentId,
      status: 'confirmed',
      createdAt: new Date().toISOString().slice(0, 10),
      isAgeMismatch: false,
    }
    convertWaitlistToBooking(entry.id, booking)
  }

  const handleCancel = (entryId: string) => {
    updateWaitlistStatus(entryId, 'cancelled')
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">候补管理</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} className="text-[#F97316]" />
            <span>共 {waitlist.filter((w) => w.status === 'waiting').length} 人候补中</span>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white p-12 text-center">
            <p className="text-gray-400">暂无候补记录</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ scheduleId, schedule, course, entries }) => (
              <div key={scheduleId} className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
                <div className="bg-orange-50 px-5 py-3 border-b border-orange-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-800">
                      {course?.name ?? '未知课程'}
                    </span>
                    {schedule && (
                      <span className="text-sm text-gray-500">
                        {schedule.date} {schedule.startTime}-{schedule.endTime}
                      </span>
                    )}
                  </div>
                  {schedule && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>已预约 {schedule.bookedCount}/{schedule.maxCapacity}</span>
                      {schedule.bookedCount >= schedule.maxCapacity && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-600 font-medium">已满</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="divide-y divide-gray-50">
                  {entries.map((entry) => {
                    const parent = getParent(entry.parentId)
                    const baby = getBaby(entry.babyId)
                    const isConverted = entry.status === 'converted'
                    const isCancelled = entry.status === 'cancelled'
                    const isInactive = isConverted || isCancelled

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-5 py-3 ${
                          isInactive ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              isConverted
                                ? 'bg-green-100 text-green-600'
                                : isCancelled
                                ? 'bg-red-100 text-red-500'
                                : 'bg-orange-100 text-[#F97316]'
                            }`}
                          >
                            {entry.position}
                          </div>
                          <div className={isInactive ? 'line-through' : ''}>
                            <div className="text-sm font-medium text-gray-800">
                              {baby?.name ?? '未知'}
                              <span className="ml-2 text-xs text-gray-400">
                                {baby ? `${baby.ageMonths}个月` : ''}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {parent?.name ?? '未知'} · {parent?.phone ?? ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isConverted && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600">
                              已转正
                            </span>
                          )}
                          {isCancelled && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-500">
                              已取消
                            </span>
                          )}
                          {entry.status === 'waiting' && (
                            <>
                              <button
                                onClick={() => handleCancel(entry.id)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleConvert(entry)}
                                className="flex items-center gap-1 rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
                              >
                                <ArrowRightToLine size={12} />
                                转正
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
