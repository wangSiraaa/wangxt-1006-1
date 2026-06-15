import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, CheckCircle, Star, AlertTriangle,
  ArrowRightLeft, ClipboardList, Baby, Calendar, Clock, Send
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useReportStore } from '@/stores/reportStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import type { BookingCategory } from '@/types'

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

const performanceOptions = [
  { value: 'good', label: '很好', color: 'text-green-600 bg-green-50' },
  { value: 'average', label: '一般', color: 'text-amber-600 bg-amber-50' },
  { value: 'needs_improvement', label: '待提升', color: 'text-red-600 bg-red-50' },
]

const unsuitableReasons = [
  '年龄偏小，跟不上节奏',
  '年龄偏大，内容太简单',
  '专注力不够，需要更小班级',
  '发展水平超前，需要升级班型',
  '性格内向，需要一对一辅导',
  '其他原因',
]

export default function Report() {
  const [selectedDate, setSelectedDate] = useState(fmtDate(new Date()))
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferToCourseId, setTransferToCourseId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const bookingStore = useBookingStore()
  const reportStore = useReportStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()

  const completedBookings = useMemo(() => {
    return bookingStore.bookings.filter((b) => {
      const schedule = scheduleStore.schedules.find((s) => s.id === b.scheduleId)
      return schedule?.date === selectedDate && b.status === 'completed' && !b.isFree
    })
  }, [selectedDate, bookingStore.bookings, scheduleStore.schedules])

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId) return null
    return bookingStore.bookings.find((b) => b.id === selectedBookingId)
  }, [selectedBookingId, bookingStore.bookings])

  const selectedBaby = useMemo(() => {
    if (!selectedBooking) return null
    return bookingStore.babies.find((b) => b.id === selectedBooking.babyId)
  }, [selectedBooking, bookingStore.babies])

  const selectedCourse = useMemo(() => {
    if (!selectedBooking) return null
    const schedule = scheduleStore.schedules.find((s) => s.id === selectedBooking.scheduleId)
    return courseStore.courses.find((c) => c.id === schedule?.courseId)
  }, [selectedBooking, scheduleStore.schedules, courseStore.courses])

  const existingReport = useMemo(() => {
    if (!selectedBookingId) return null
    return reportStore.reports.find((r) => r.bookingId === selectedBookingId)
  }, [selectedBookingId, reportStore.reports])

  const siblingGroup = useMemo(() => {
    if (!selectedBooking?.siblingGroupId) return []
    return bookingStore.getSiblingGroup(selectedBooking.siblingGroupId)
  }, [selectedBooking, bookingStore])

  function changeDate(offset: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(fmtDate(d))
  }

  function updateDraft(field: string, value: any) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleClassSuitableChange(suitable: boolean) {
    updateDraft('isClassSuitable', suitable)
    if (!suitable) {
      setShowTransferModal(true)
    }
  }

  function handleAddTransferSuggestion() {
    if (!selectedBooking || !transferToCourseId) return

    const suggestion = {
      id: `ts_${Date.now()}`,
      fromCourseId: selectedCourse?.id || '',
      toCourseId: transferToCourseId,
      reason: transferReason,
      suggestedBy: 'teacher1',
      createdAt: fmtDate(new Date()),
    }
    bookingStore.addTransferSuggestion(suggestion)
    bookingStore.updateBooking(selectedBooking.id, {
      transferSuggestion: suggestion,
      category: 'conversion_followup',
    })

    const todo = {
      id: `td_${Date.now()}`,
      bookingId: selectedBooking.id,
      parentId: selectedBooking.parentId,
      babyId: selectedBooking.babyId,
      type: 'transfer' as const,
      title: '转班跟进',
      content: `老师建议从${selectedCourse?.name}转到${courseStore.courses.find(c => c.id === transferToCourseId)?.name}，原因：${transferReason}`,
      priority: 'high' as const,
      status: 'pending' as const,
      assigneeId: 'consultant1',
      dueDate: null,
      createdAt: fmtDate(new Date()),
      completedAt: null,
    }
    reportStore.addTodo(todo)

    setShowTransferModal(false)
    setTransferToCourseId('')
    setTransferReason('')
    updateDraft('transferSuggestionId', suggestion.id)
    updateDraft('unsuitableReason', transferReason)
  }

  function handleSubmit() {
    if (!selectedBookingId) return
    setShowConfirm(true)
  }

  function confirmSubmit() {
    if (!selectedBookingId || !selectedBaby) return

    const score = calculateScore()
    const now = fmtDate(new Date())

    if (existingReport) {
      reportStore.updateReport(existingReport.id, {
        ...draft,
        score,
        updatedAt: now,
      })
    } else {
      reportStore.addReport({
        id: `rpt_${Date.now()}`,
        bookingId: selectedBookingId,
        babyId: selectedBooking!.babyId,
        courseId: selectedCourse?.id || '',
        reportDate: selectedDate,
        score,
        focusDuration: draft.focusDuration || 0,
        performance: draft.performance || 'average',
        strengths: draft.strengths || '',
        improvements: draft.improvements || '',
        nextAction: draft.nextAction || '',
        signedByTeacher: false,
        signedByParent: false,
        teacherId: 'teacher1',
        createdAt: now,
        updatedAt: now,
        isClassSuitable: draft.isClassSuitable ?? true,
        unsuitableReason: draft.unsuitableReason || '',
        transferSuggestionId: draft.transferSuggestionId || null,
      })
    }

    bookingStore.updateBooking(selectedBookingId, { isReportDone: true })
    setShowConfirm(false)
    setSelectedBookingId(null)
    setDraft({})
  }

  function calculateScore() {
    const perfScores: Record<string, number> = { good: 90, average: 70, needs_improvement: 50 }
    return perfScores[draft.performance || 'average']
  }

  function selectBooking(id: string) {
    setSelectedBookingId(id)
    const report = reportStore.reports.find((r) => r.bookingId === id)
    if (report) {
      setDraft({
        focusDuration: report.focusDuration,
        performance: report.performance,
        strengths: report.strengths,
        improvements: report.improvements,
        nextAction: report.nextAction,
        isClassSuitable: report.isClassSuitable,
        unsuitableReason: report.unsuitableReason,
        transferSuggestionId: report.transferSuggestionId,
      })
    } else {
      setDraft({})
    }
  }

  const dateLabel = (() => {
    const d = new Date(selectedDate)
    const today = new Date()
    const todayStr = fmtDate(today)
    if (selectedDate === todayStr) return '今天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  })()

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-orange-500" /> 体验报告
        </h1>

        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => changeDate(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 text-sm">{dateLabel}</p>
                  <p className="text-xs text-gray-400">{selectedDate}</p>
                </div>
                <button
                  onClick={() => changeDate(1)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  已签到宝宝 ({completedBookings.length})
                </h3>
              </div>
              {completedBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  暂无已签到记录
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {completedBookings.map((booking) => {
                    const baby = bookingStore.babies.find((b) => b.id === booking.babyId)
                    const schedule = scheduleStore.schedules.find((s) => s.id === booking.scheduleId)
                    const course = courseStore.courses.find((c) => c.id === schedule?.courseId)
                    const hasReport = reportStore.reports.some((r) => r.bookingId === booking.id)
                    const hasTransfer = !!booking.transferSuggestion

                    return (
                      <button
                        key={booking.id}
                        onClick={() => selectBooking(booking.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition ${
                          selectedBookingId === booking.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Baby className="w-4 h-4 text-orange-400" />
                            <span className="font-medium text-gray-800">{baby?.name}</span>
                          </div>
                          {hasReport ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-orange-500 font-medium">待填写</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{course?.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[booking.category]}`}>
                            {CATEGORY_LABEL[booking.category]}
                          </span>
                          {hasTransfer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">
                              需转班
                            </span>
                          )}
                        </div>
                        {booking.siblingGroupId && siblingGroup.length > 1 && (
                          <div className="mt-1 text-[10px] text-purple-500">
                            👨‍👩‍👧 兄弟姐妹同约
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            {!selectedBooking ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">请从左侧选择一位宝宝填写体验报告</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Baby className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-800">
                            {selectedBaby?.name}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {selectedBaby?.ageMonths}个月 · {selectedCourse?.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[selectedBooking.category]}`}>
                        {CATEGORY_LABEL[selectedBooking.category]}
                      </span>
                      {selectedBooking.isPromotionSlot && (
                        <span className="text-xs text-purple-500">🎫 促销名额</span>
                      )}
                    </div>
                  </div>

                  {siblingGroup.length > 1 && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-700 mb-2">
                        👨‍👩‍👧 兄弟姐妹同约
                      </p>
                      <div className="flex gap-2">
                        {siblingGroup.map((sib, idx) => {
                          const sibBaby = bookingStore.babies.find((b) => b.id === sib.babyId)
                          const sibCourse = courseStore.courses.find((c) => {
                            const s = scheduleStore.schedules.find(s => s.id === sib.scheduleId)
                            return c.id === s?.courseId
                          })
                          return (
                            <div key={sib.id} className="flex-1 bg-white rounded p-2 text-center">
                              <p className="text-xs font-medium text-gray-800">{sibBaby?.name}</p>
                              <p className="text-[10px] text-gray-500">{sibBaby?.ageMonths}月 · {sibCourse?.name}</p>
                              <p className="text-[10px] text-purple-500 mt-0.5">第{idx + 1}宝</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      整体表现
                    </label>
                    <div className="flex gap-3">
                      {performanceOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateDraft('performance', opt.value)}
                          className={`flex-1 py-3 rounded-lg font-medium text-sm transition ${
                            draft.performance === opt.value
                              ? `${opt.color} ring-2 ring-offset-1`
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                          } ${draft.performance === opt.value ? 'ring-orange-400' : ''}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      专注力时长（分钟）
                    </label>
                    <input
                      type="number"
                      value={draft.focusDuration || ''}
                      onChange={(e) => updateDraft('focusDuration', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                      placeholder="请输入专注力时长"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      优点和亮点
                    </label>
                    <textarea
                      value={draft.strengths || ''}
                      onChange={(e) => updateDraft('strengths', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="描述宝宝在课堂上的优点和亮点..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      待提升方面
                    </label>
                    <textarea
                      value={draft.improvements || ''}
                      onChange={(e) => updateDraft('improvements', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="描述宝宝需要提升的方面..."
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500 inline mr-1" />
                      班型适配判断
                    </label>
                    <div className="flex gap-3 mb-3">
                      <button
                        onClick={() => handleClassSuitableChange(true)}
                        className={`flex-1 py-3 rounded-lg font-medium text-sm transition ${
                          draft.isClassSuitable !== false
                            ? 'bg-green-50 text-green-600 ring-2 ring-green-400 ring-offset-1'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        ✅ 适合当前班型
                      </button>
                      <button
                        onClick={() => handleClassSuitableChange(false)}
                        className={`flex-1 py-3 rounded-lg font-medium text-sm transition ${
                          draft.isClassSuitable === false
                            ? 'bg-red-50 text-red-600 ring-2 ring-red-400 ring-offset-1'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        ❌ 不适合，建议转班
                      </button>
                    </div>

                    {draft.isClassSuitable === false && selectedBooking.transferSuggestion && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm font-medium text-amber-800 flex items-center gap-1">
                          <ArrowRightLeft className="w-4 h-4" /> 已建议转班
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          建议转到：{courseStore.courses.find(c => c.id === selectedBooking.transferSuggestion?.toCourseId)?.name}
                        </p>
                        <p className="text-xs text-amber-600">
                          原因：{selectedBooking.transferSuggestion.reason}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          ✅ 已自动生成顾问回访待办
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      下一步建议
                    </label>
                    <textarea
                      value={draft.nextAction || ''}
                      onChange={(e) => updateDraft('nextAction', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="给家长的下一步建议..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedBookingId(null)
                        setDraft({})
                      }}
                      className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition flex items-center justify-center gap-1"
                    >
                      <Send className="w-4 h-4" /> 提交报告
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-orange-500" /> 转班建议
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前课程
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-600 text-sm">
                  {selectedCourse?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  建议转到
                </label>
                <select
                  value={transferToCourseId}
                  onChange={(e) => setTransferToCourseId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">请选择目标课程</option>
                  {courseStore.courses
                    .filter((c) => c.id !== selectedCourse?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}（{c.minAge}-{c.maxAge}月）
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  转班原因
                </label>
                <div className="space-y-2">
                  {unsuitableReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setTransferReason(reason)}
                      className={`w-full px-3 py-2 text-left rounded-lg text-sm transition ${
                        transferReason === reason
                          ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-400'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  💡 提交后将自动生成一条高优先级的顾问回访待办，提醒顾问跟进转班事宜
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTransferModal(false)
                  setTransferToCourseId('')
                  setTransferReason('')
                }}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleAddTransferSuggestion}
                disabled={!transferToCourseId || !transferReason}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认建议
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 m-4 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认提交报告？</h3>
            <p className="text-sm text-gray-500 mb-6">
              提交后家长可以查看报告内容
              {draft.isClassSuitable === false && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ 将同步生成顾问转班跟进待办
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition"
              >
                再想想
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
