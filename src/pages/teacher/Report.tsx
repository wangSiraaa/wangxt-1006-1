import { useState, useMemo } from 'react'
import {
  FileText, Star, CheckCircle, X, Edit3, Calendar, Clock
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useReportStore } from '@/stores/reportStore'
import { useAuditStore } from '@/stores/auditStore'
import type { AbilityScore } from '@/types'

export default function Report() {
  const [openBookingId, setOpenBookingId] = useState<string | null>(null)
  const [performance, setPerformance] = useState('')
  const [abilityScores, setAbilityScores] = useState<AbilityScore[]>([])
  const [courseSuggestion, setCourseSuggestion] = useState('')
  const [teacherNote, setTeacherNote] = useState('')

  const bookingStore = useBookingStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()
  const reportStore = useReportStore()
  const auditStore = useAuditStore()

  const completedBookings = useMemo(
    () => bookingStore.bookings.filter((b) => b.status === 'completed'),
    [bookingStore.bookings]
  )

  function handleOpenForm(bookingId: string) {
    const booking = bookingStore.bookings.find((b) => b.id === bookingId)
    if (!booking) return
    const schedule = scheduleStore.schedules.find((s) => s.id === booking.scheduleId)
    if (!schedule) return
    const course = courseStore.courses.find((c) => c.id === schedule.courseId)
    if (!course) return

    const existingReport = reportStore.getReportByBooking(bookingId)
    if (existingReport) {
      setPerformance(existingReport.performance)
      setAbilityScores(existingReport.abilityScores)
      setCourseSuggestion(existingReport.courseSuggestion)
      setTeacherNote(existingReport.teacherNote)
    } else {
      setPerformance('')
      setAbilityScores(course.tags.map((t) => ({ tagName: t.name, score: 3 })))
      setCourseSuggestion('')
      setTeacherNote('')
    }
    setOpenBookingId(bookingId)
  }

  function handleScoreChange(tagName: string, score: number) {
    setAbilityScores((prev) =>
      prev.map((s) => (s.tagName === tagName ? { ...s, score } : s))
    )
  }

  function handleSubmit() {
    if (!openBookingId) return
    const existingReport = reportStore.getReportByBooking(openBookingId)

    if (existingReport) {
      reportStore.updateReport(existingReport.id, {
        performance,
        abilityScores,
        courseSuggestion,
        teacherNote,
      })
    } else {
      reportStore.addReport({
        id: `r${Date.now()}`,
        bookingId: openBookingId,
        performance,
        abilityScores,
        courseSuggestion,
        teacherNote,
      })
      auditStore.addLog('report_submitted', 'teacher', 'system', openBookingId, '提交试听报告')
    }
    setOpenBookingId(null)
  }

  const openBooking = bookingStore.bookings.find((b) => b.id === openBookingId)
  const openSchedule = openBooking ? scheduleStore.schedules.find((s) => s.id === openBooking.scheduleId) : undefined
  const openCourse = openSchedule ? courseStore.courses.find((c) => c.id === openSchedule.courseId) : undefined

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">试听报告</h1>

        <div className="space-y-3">
          {completedBookings.map((booking) => {
            const schedule = scheduleStore.schedules.find((s) => s.id === booking.scheduleId)
            const course = schedule ? courseStore.courses.find((c) => c.id === schedule.courseId) : undefined
            const baby = bookingStore.babies.find((b) => b.id === booking.babyId)
            const parent = bookingStore.parents.find((p) => p.id === booking.parentId)
            const hasReport = !!reportStore.getReportByBooking(booking.id)

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-gray-800">{baby?.name ?? '-'}</span>
                    <span className="text-sm text-gray-500 ml-2">{course?.name ?? '-'}</span>
                  </div>
                  {hasReport ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> 已填写
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenForm(booking.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 填写报告
                    </button>
                  )}
                </div>
                {schedule && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {schedule.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {schedule.startTime}-{schedule.endTime}
                    </span>
                    {parent && <span>{parent.name}</span>}
                  </div>
                )}
              </div>
            )
          })}

          {completedBookings.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">暂无已完成的试听课</p>
            </div>
          )}
        </div>

        {openBookingId && openCourse && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">填写试听报告</h3>
                <button
                  onClick={() => setOpenBookingId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课堂表现</label>
                  <textarea
                    value={performance}
                    onChange={(e) => setPerformance(e.target.value)}
                    placeholder="请描述宝宝课堂表现..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">能力评分</label>
                  <div className="space-y-3">
                    {abilityScores.map((as) => (
                      <div key={as.tagName} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{as.tagName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleScoreChange(as.tagName, s)}
                              className="p-0.5 transition"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  s <= as.score
                                    ? 'text-orange-400 fill-orange-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程建议</label>
                  <textarea
                    value={courseSuggestion}
                    onChange={(e) => setCourseSuggestion(e.target.value)}
                    placeholder="对课程的建议..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教师备注</label>
                  <textarea
                    value={teacherNote}
                    onChange={(e) => setTeacherNote(e.target.value)}
                    placeholder="内部备注..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
                <button
                  onClick={handleSubmit}
                  disabled={!performance.trim()}
                  className={`w-full py-3 rounded-xl text-white font-semibold transition ${
                    performance.trim()
                      ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  提交报告
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
