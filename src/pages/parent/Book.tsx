import { useState, useMemo } from 'react'
import {
  Baby, Phone, User, Calendar, Clock, Users, AlertTriangle,
  CheckCircle, ChevronRight, ChevronLeft, Plus, X, Sparkles, Ticket
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useRuleStore } from '@/stores/ruleStore'
import { useAuditStore } from '@/stores/auditStore'
import { useReportStore } from '@/stores/reportStore'
import type { Booking, WaitlistEntry, Baby as BabyType, BookingCategory } from '@/types'

interface BabyDraft {
  id: string
  name: string
  ageMonths: number
  selectedScheduleId: string | null
  isExisting: boolean
  existingBabyId?: string
}

export default function Book() {
  const [step, setStep] = useState(1)
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [babies, setBabies] = useState<BabyDraft[]>([
    { id: 'baby_1', name: '', ageMonths: 12, selectedScheduleId: null, isExisting: false }
  ])
  const [activeBabyIndex, setActiveBabyIndex] = useState(0)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [bookingResult, setBookingResult] = useState<{
    type: 'confirmed' | 'waitlist'
    results: Array<{ babyName: string; status: 'confirmed' | 'waitlist'; id: string; position?: number }>
    siblingGroupId: string | null
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPromotionSlot, setIsPromotionSlot] = useState(false)

  const bookingStore = useBookingStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()
  const ruleStore = useRuleStore()
  const auditStore = useAuditStore()
  const reportStore = useReportStore()

  const existingParent = useMemo(
    () => (phone.length >= 11 ? bookingStore.getParentByPhone(phone) : undefined),
    [phone, bookingStore.parents]
  )

  const existingBabies = useMemo(
    () => (existingParent ? bookingStore.getBabiesByParent(existingParent.id) : []),
    [existingParent, bookingStore.babies]
  )

  const freezeInfo = useMemo(
    () => (phone.length >= 11 ? bookingStore.isPhoneFrozen(phone) : { frozen: false, reason: null, until: null }),
    [phone, bookingStore.parents]
  )

  const isBlacklisted = useMemo(
    () => (phone.length >= 11 ? bookingStore.isPhoneBlacklisted(phone) : false),
    [phone, bookingStore.parents]
  )

  const phoneTransferRule = useMemo(
    () => ruleStore.getRuleByType('phone_transfer_allowed'),
    [ruleStore]
  )

  const promotionRule = useMemo(
    () => ruleStore.getRuleByType('promotion_slots'),
    [ruleStore]
  )

  const activeBaby = babies[activeBabyIndex]

  const setActiveBaby = (index: number, updates: Partial<BabyDraft>) => {
    setBabies(prev => prev.map((b, i) => i === index ? { ...b, ...updates } : b))
  }

  const addBaby = () => {
    const newId = `baby_${Date.now()}`
    setBabies(prev => [...prev, {
      id: newId,
      name: '',
      ageMonths: 12,
      selectedScheduleId: null,
      isExisting: false,
    }])
    setActiveBabyIndex(babies.length)
  }

  const removeBaby = (index: number) => {
    if (babies.length <= 1) return
    setBabies(prev => prev.filter((_, i) => i !== index))
    if (activeBabyIndex >= index && activeBabyIndex > 0) {
      setActiveBabyIndex(activeBabyIndex - 1)
    }
  }

  function handlePhoneBlur() {
    if (phone.length < 11) return
    const p = bookingStore.getParentByPhone(phone)
    if (p) {
      setShowDuplicateWarning(true)
      setParentName(p.name)
      if (existingBabies.length > 0) {
        setBabies(existingBabies.map((b, i) => ({
          id: `baby_${i}`,
          name: b.name,
          ageMonths: b.ageMonths,
          selectedScheduleId: null,
          isExisting: true,
          existingBabyId: b.id,
        })))
      }
    }
  }

  function handleSelectExistingBaby(baby: BabyType) {
    setActiveBaby(activeBabyIndex, {
      name: baby.name,
      ageMonths: baby.ageMonths,
      isExisting: true,
      existingBabyId: baby.id,
    })
  }

  function canGoStep2() {
    if (!parentName.trim() || phone.length < 11) return false
    if (freezeInfo.frozen || isBlacklisted) return false
    if (babies.some(b => !b.name.trim() || b.ageMonths < 1)) return false
    return true
  }

  function canGoStep3() {
    return babies.every(b => b.selectedScheduleId !== null)
  }

  function getSchedulesForBaby(baby: BabyDraft) {
    return scheduleStore.schedules
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .filter(s => {
        const course = courseStore.courses.find(c => c.id === s.courseId)
        if (!course) return false
        return course.ageRanges.some(
          ar => baby.ageMonths >= ar.minMonths && baby.ageMonths <= ar.maxMonths
        )
      })
  }

  function getSelectedSchedule(baby: BabyDraft) {
    if (!baby.selectedScheduleId) return null
    return scheduleStore.schedules.find(s => s.id === baby.selectedScheduleId)
  }

  function getSelectedCourse(baby: BabyDraft) {
    const schedule = getSelectedSchedule(baby)
    if (!schedule) return null
    return courseStore.courses.find(c => c.id === schedule.courseId)
  }

  function executeBooking() {
    setErrorMessage('')

    const parent = bookingStore.getOrCreateParent(phone, parentName.trim())
    const parentId = parent.id

    const weeklyRule = ruleStore.getRuleByType('phone_weekly')
    if (weeklyRule) {
      const weekBookings = bookingStore.getBookingsByPhoneThisWeek(phone)
      if (weekBookings.length + babies.length > weeklyRule.value) {
        setErrorMessage(`该手机号本周已预约 ${weekBookings.length} 次试听课，每周限预约 ${weeklyRule.value} 次`)
        return
      }
    }

    if (bookingStore.isPhoneBlacklisted(phone)) {
      setErrorMessage('该手机号已被加入黑名单，无法预约')
      return
    }

    const freezeInfo = bookingStore.isPhoneFrozen(phone)
    if (freezeInfo.frozen) {
      if (!phoneTransferRule?.value) {
        setErrorMessage(
          `该手机号因${freezeInfo.reason ?? '爽约记录'}被冻结，${freezeInfo.until ?? '暂无'} 后方可预约`
        )
        return
      }
    }

    const siblingGroupId = babies.length > 1 ? `sg_${Date.now()}` : null
    const results: Array<{ babyName: string; status: 'confirmed' | 'waitlist'; id: string; position?: number }> = []

    babies.forEach((babyDraft, index) => {
      const baby = bookingStore.getOrCreateBaby(
        parentId,
        babyDraft.name.trim(),
        babyDraft.ageMonths,
        babyDraft.isExisting ? babyDraft.existingBabyId : undefined
      )
      const babyId = baby.id

      const schedule = getSelectedSchedule(babyDraft)
      if (!schedule) return

      const course = courseStore.courses.find(c => c.id === schedule.courseId)
      const ageMismatch = course
        ? !course.ageRanges.some(ar => babyDraft.ageMonths >= ar.minMonths && babyDraft.ageMonths <= ar.maxMonths)
        : false

      let category: BookingCategory = 'new_customer'
      if (siblingGroupId && babies.length > 1) {
        category = 'sibling'
      } else if (freezeInfo.frozen && phoneTransferRule?.value) {
        category = 'noshow_recovery'
      }

      const isFull = schedule.bookedCount >= schedule.maxCapacity

      if (isFull) {
        const waitingCount = bookingStore.waitlist.filter(
          w => w.scheduleId === schedule.id && w.status === 'waiting'
        ).length
        const wlId = `wl_${Date.now()}_${index}`
        const wlEntry: WaitlistEntry = {
          id: wlId,
          scheduleId: schedule.id,
          babyId,
          parentId,
          position: waitingCount + 1,
          status: 'waiting',
          createdAt: new Date().toISOString().slice(0, 10),
        }
        bookingStore.addWaitlist(wlEntry)
        results.push({ babyName: baby.name, status: 'waitlist', id: wlId, position: wlEntry.position })
        auditStore.addLog(
          'waitlist_joined',
          'parent',
          parentId,
          wlEntry.id,
          `${parent.name}为${baby.name}（${babyDraft.ageMonths}月龄）进入${schedule.date}候补队列第${wlEntry.position}位`
        )
      } else {
        const bkId = `bk_${Date.now()}_${index}`
        const booking: Booking = {
          id: bkId,
          scheduleId: schedule.id,
          babyId,
          parentId,
          status: 'confirmed',
          createdAt: new Date().toISOString().slice(0, 10),
          isAgeMismatch: ageMismatch,
          category,
          siblingGroupId,
          isPromotionSlot,
          transferSuggestion: null,
        }
        bookingStore.addBooking(booking)
        scheduleStore.incrementBooked(schedule.id)
        results.push({ babyName: baby.name, status: 'confirmed', id: bkId })

        const mismatchText = ageMismatch ? `，年龄不匹配(${babyDraft.ageMonths}月龄)` : ''
        const siblingText = siblingGroupId ? `，兄弟姐妹同约第${index + 1}宝` : ''
        auditStore.addLog(
          'booking_created',
          'parent',
          parentId,
          booking.id,
          `${parent.name}为${baby.name}预约${schedule.date}成功${mismatchText}${siblingText}`
        )

        if (siblingGroupId && index === 0) {
          const siblingTodo = {
            id: `td_${Date.now()}_sibling`,
            bookingId: booking.id,
            parentId,
            babyId,
            type: 'conversion' as const,
            title: '兄弟姐妹同约跟进',
            content: `家庭有${babies.length}个孩子同时试听，建议重点跟进转化`,
            priority: 'high' as const,
            status: 'pending' as const,
            assigneeId: 'consultant1',
            dueDate: null,
            createdAt: new Date().toISOString().slice(0, 10),
            completedAt: null,
          }
          reportStore.addTodo(siblingTodo)
        }
      }
    })

    const allConfirmed = results.every(r => r.status === 'confirmed')
    setBookingResult({
      type: allConfirmed ? 'confirmed' : 'waitlist',
      results,
      siblingGroupId,
    })
    setStep(4)
  }

  function handleReset() {
    setStep(1)
    setParentName('')
    setPhone('')
    setBabies([{ id: 'baby_1', name: '', ageMonths: 12, selectedScheduleId: null, isExisting: false }])
    setActiveBabyIndex(0)
    setShowDuplicateWarning(false)
    setBookingResult(null)
    setErrorMessage('')
    setIsPromotionSlot(false)
  }

  const weeklyRule = ruleStore.getRuleByType('phone_weekly')
  const weekBookings = phone.length >= 11 ? bookingStore.getBookingsByPhoneThisWeek(phone) : []
  const weeklyLimitReached = weeklyRule ? weekBookings.length >= weeklyRule.value : false

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">试听课预约</h1>

        {babies.length > 1 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <p className="text-sm text-purple-700">
              您正在为 <strong>{babies.length}个宝宝</strong> 同时预约，可享受兄弟姐妹优惠
            </p>
          </div>
        )}

        {step < 4 && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" /> 家长信息
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">家长姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="请输入家长姓名"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setShowDuplicateWarning(false)
                    }}
                    onBlur={handlePhoneBlur}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </div>

              {freezeInfo.frozen && phoneTransferRule?.value && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">
                      该手机号有爽约记录，当前处于冻结状态
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      根据规则允许转手机号预约，本次预约将标记为"爽约恢复"
                    </p>
                  </div>
                </div>
              )}

              {freezeInfo.frozen && !phoneTransferRule?.value && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">
                    该手机号因{freezeInfo.reason}被冻结，解冻日期：{freezeInfo.until}
                  </p>
                </div>
              )}

              {isBlacklisted && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">该手机号已被加入黑名单</p>
                </div>
              )}

              {showDuplicateWarning && existingBabies.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">重复档案提醒</span>
                  </div>
                  <p className="text-xs text-orange-600 mb-2">该手机号已有档案，已自动带出宝宝信息：</p>
                  <div className="space-y-1">
                    {existingBabies.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-orange-100"
                      >
                        <Baby className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-gray-700">{b.name}（{b.ageMonths}个月）</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Baby className="w-5 h-5 text-orange-500" /> 宝宝信息
                </h2>
                {babies.length < 4 && (
                  <button
                    onClick={addBaby}
                    className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    <Plus className="w-4 h-4" /> 添加宝宝
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {babies.map((baby, index) => (
                  <button
                    key={baby.id}
                    onClick={() => setActiveBabyIndex(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 ${
                      activeBabyIndex === index
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-orange-50'
                    }`}
                  >
                    <span>{baby.name || `宝宝${index + 1}`}</span>
                    {babies.length > 1 && (
                      <X
                        className="w-3 h-3 cursor-pointer hover:opacity-70"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBaby(index)
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">第 {activeBabyIndex + 1} 个宝宝</span>
                  {babies.length > 1 && (
                    <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded">
                      兄弟姐妹同约
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">宝宝姓名</label>
                  <input
                    type="text"
                    value={activeBaby.name}
                    onChange={(e) => setActiveBaby(activeBabyIndex, { name: e.target.value })}
                    placeholder="请输入宝宝姓名"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    月龄：<span className="text-orange-600 font-bold">{activeBaby.ageMonths}个月</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={48}
                    value={activeBaby.ageMonths}
                    onChange={(e) => setActiveBaby(activeBabyIndex, { ageMonths: Number(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1月</span>
                    <span>48月</span>
                  </div>
                </div>

                {promotionRule && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPromotionSlot}
                        onChange={(e) => setIsPromotionSlot(e.target.checked)}
                        className="mt-0.5 accent-purple-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-purple-700 flex items-center gap-1">
                          <Ticket className="w-4 h-4" /> 使用促销名额
                        </p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          本月剩余促销名额：{promotionRule.value} 个
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {weeklyLimitReached && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">
                      该手机号本周已预约过试听课，每周限预约{weeklyRule?.value}次
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => canGoStep2() && setStep(2)}
              disabled={!canGoStep2()}
              className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition ${
                canGoStep2()
                  ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              下一步 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" /> 选择课程和时间
              </h2>
              <span className="text-xs text-gray-400">
                {activeBabyIndex + 1} / {babies.length} 个宝宝
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {babies.map((baby, index) => {
                const hasSelection = baby.selectedScheduleId !== null
                return (
                  <button
                    key={baby.id}
                    onClick={() => setActiveBabyIndex(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 ${
                      activeBabyIndex === index
                        ? 'bg-orange-500 text-white'
                        : hasSelection
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    {hasSelection && <CheckCircle className="w-3.5 h-3.5" />}
                    <span>{baby.name || `宝宝${index + 1}`}</span>
                    <span className="text-xs opacity-75">·{baby.ageMonths}月</span>
                  </button>
                )
              })}
            </div>

            <div className="bg-orange-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-700">
                为 <strong>{activeBaby.name || `宝宝${activeBabyIndex + 1}`}</strong>
                （{activeBaby.ageMonths}个月）选择合适的课程
              </p>
            </div>

            {(() => {
              const schedules = getSchedulesForBaby(activeBaby)
              const groups: Record<string, typeof scheduleStore.schedules> = {}
              schedules.forEach(s => {
                if (!groups[s.date]) groups[s.date] = []
                groups[s.date].push(s)
              })

              if (schedules.length === 0) {
                return (
                  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                    <p className="text-gray-500">暂无适合该月龄的课程</p>
                    <p className="text-xs text-gray-400 mt-1">试试调整宝宝月龄看看其他课程</p>
                  </div>
                )
              }

              return Object.entries(groups).map(([date, dateSchedules]) => (
                <div key={date} className="mb-4">
                  <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {date}
                  </div>
                  <div className="space-y-3">
                    {dateSchedules.map(sch => {
                      const course = courseStore.courses.find(c => c.id === sch.courseId)
                      const teacher = scheduleStore.teachers.find(t => t.id === sch.teacherId)
                      const isFull = sch.bookedCount >= sch.maxCapacity
                      const isSelected = activeBaby.selectedScheduleId === sch.id
                      const usagePercent = Math.round((sch.bookedCount / sch.maxCapacity) * 100)

                      return (
                        <button
                          key={sch.id}
                          onClick={() => setActiveBaby(activeBabyIndex, { selectedScheduleId: sch.id })}
                          className={`w-full text-left bg-white rounded-xl shadow-sm p-4 border-2 transition ${
                            isSelected ? 'border-orange-400 ring-1 ring-orange-200' : 'border-transparent hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-semibold text-gray-800">{course?.name}</span>
                              {isFull && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                  已满
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">{teacher?.avatar} {teacher?.name}</span>
                          </div>

                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {sch.startTime}-{sch.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {sch.bookedCount}/{sch.maxCapacity}
                            </span>
                          </div>

                          {teacher?.skills && teacher.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {teacher.skills.slice(0, 2).map(skill => (
                                <span key={skill} className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                  擅长：{skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= 100 ? 'bg-red-400' : usagePercent >= 70 ? 'bg-orange-400' : 'bg-green-400'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{usagePercent}%</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> 上一步
              </button>
              <button
                onClick={() => {
                  setErrorMessage('')
                  if (activeBabyIndex < babies.length - 1) {
                    setActiveBabyIndex(activeBabyIndex + 1)
                  } else if (canGoStep3()) {
                    setStep(3)
                  }
                }}
                disabled={!activeBaby.selectedScheduleId}
                className={`flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition ${
                  activeBaby.selectedScheduleId
                    ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {activeBabyIndex < babies.length - 1 ? '下一个宝宝' : '确认预约'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-500" /> 确认预约信息
            </h2>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {babies.map((baby, index) => {
                const schedule = getSelectedSchedule(baby)
                const course = getSelectedCourse(baby)
                return (
                  <div key={baby.id} className={`p-5 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-800">{baby.name}</span>
                      <span className="text-sm text-gray-400">·{baby.ageMonths}个月</span>
                      {babies.length > 1 && (
                        <span className="text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">
                          兄弟姐妹
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">课程</span>
                        <span className="font-medium text-gray-800">{course?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">日期</span>
                        <span className="font-medium text-gray-800">{schedule?.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">时间</span>
                        <span className="font-medium text-gray-800">{schedule?.startTime}-{schedule?.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">名额</span>
                        <span className="font-medium text-gray-800">
                          {schedule?.bookedCount}/{schedule?.maxCapacity}
                        </span>
                      </div>
                    </div>
                    {schedule && schedule.bookedCount >= schedule.maxCapacity && (
                      <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
                        该场次已满，预约将加入候补队列
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {isPromotionSlot && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-500 shrink-0" />
                <p className="text-sm text-purple-700">本次预约使用促销名额</p>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setErrorMessage('')
                  setStep(2)
                }}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> 返回修改
              </button>
              <button
                onClick={executeBooking}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:scale-[0.98] transition"
              >
                确认预约
              </button>
            </div>
          </div>
        )}

        {step === 4 && bookingResult && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  bookingResult.type === 'confirmed' ? 'bg-green-100' : 'bg-orange-100'
                }`}
              >
                {bookingResult.results.every(r => r.status === 'confirmed') ? (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                ) : (
                  <Clock className="w-10 h-10 text-orange-500" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {bookingResult.results.every(r => r.status === 'confirmed') ? '全部预约成功！' : '预约提交成功'}
              </h2>
              {bookingResult.siblingGroupId && (
                <p className="text-sm text-purple-600 mt-1">
                  👨‍👩‍👧 兄弟姐妹同约，顾问将重点跟进
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {bookingResult.results.map((result, index) => (
                <div key={index} className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{result.babyName}</span>
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded ${
                        result.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {result.status === 'confirmed' ? '已确认' : `候补第${result.position}位`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">预约单号</span>
                    <span className="font-mono text-gray-500">{result.id}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                📋 顾问已收到您的预约信息，将在24小时内与您联系确认
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:scale-[0.98] transition"
            >
              继续预约
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
