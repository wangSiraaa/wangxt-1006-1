import { useState, useMemo } from 'react'
import {
  Baby, Phone, User, Calendar, Clock, Users, AlertTriangle,
  CheckCircle, ChevronRight, ChevronLeft, Star, X, Loader2
} from 'lucide-react'
import { useBookingStore } from '@/stores/bookingStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import { useRuleStore } from '@/stores/ruleStore'
import { useAuditStore } from '@/stores/auditStore'
import type { Booking, WaitlistEntry, Baby as BabyType, Parent } from '@/types'

let idCounter = 100
const nextId = (prefix: string) => `${prefix}${++idCounter}`

export default function Book() {
  const [step, setStep] = useState(1)
  const [babyName, setBabyName] = useState('')
  const [ageMonths, setAgeMonths] = useState(12)
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(null)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [bookingResult, setBookingResult] = useState<'confirmed' | 'waitlist' | null>(null)
  const [resultId, setResultId] = useState('')
  const [resultPosition, setResultPosition] = useState(0)

  const bookingStore = useBookingStore()
  const scheduleStore = useScheduleStore()
  const courseStore = useCourseStore()
  const ruleStore = useRuleStore()
  const auditStore = useAuditStore()

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

  const schedulesGroupedByDate = useMemo(() => {
    const groups: Record<string, typeof scheduleStore.schedules> = {}
    scheduleStore.schedules
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .forEach((s) => {
        if (!groups[s.date]) groups[s.date] = []
        groups[s.date].push(s)
      })
    return groups
  }, [scheduleStore.schedules])

  const selectedSchedule = useMemo(
    () => scheduleStore.schedules.find((s) => s.id === selectedScheduleId),
    [selectedScheduleId, scheduleStore.schedules]
  )

  const selectedCourse = useMemo(
    () => (selectedSchedule ? courseStore.courses.find((c) => c.id === selectedSchedule.courseId) : undefined),
    [selectedSchedule, courseStore.courses]
  )

  const activeBaby = useMemo(() => {
    if (selectedBabyId) {
      return bookingStore.babies.find((b) => b.id === selectedBabyId) ?? null
    }
    return null
  }, [selectedBabyId, bookingStore.babies])

  const effectiveAge = activeBaby ? activeBaby.ageMonths : ageMonths
  const effectiveBabyName = activeBaby ? activeBaby.name : babyName

  function handlePhoneBlur() {
    if (phone.length < 11) return
    const p = bookingStore.getParentByPhone(phone)
    if (p) {
      setShowDuplicateWarning(true)
      setParentName(p.name)
    }
  }

  function handleSelectExistingBaby(baby: BabyType) {
    setSelectedBabyId(baby.id)
    setBabyName(baby.name)
    setAgeMonths(baby.ageMonths)
    setShowDuplicateWarning(false)
  }

  function handleNewBaby() {
    setSelectedBabyId(null)
    setShowDuplicateWarning(false)
  }

  function canGoStep2() {
    if (!effectiveBabyName.trim() || effectiveAge < 1 || !parentName.trim() || phone.length < 11) return false
    if (freezeInfo.frozen || isBlacklisted) return false
    return true
  }

  function handleProceedToStep3() {
    if (!selectedSchedule || !selectedCourse) return
    const ageOk = selectedCourse.ageRanges.some(
      (ar) => effectiveAge >= ar.minMonths && effectiveAge <= ar.maxMonths
    )
    if (!ageOk) {
      setShowAgeModal(true)
      return
    }
    executeBooking()
  }

  function executeBooking() {
    if (!selectedSchedule || !existingParent) return

    const weeklyRule = ruleStore.getRuleByType('phone_weekly')
    if (weeklyRule) {
      const weekBookings = bookingStore.getBookingsByPhoneThisWeek(phone)
      if (weekBookings.length >= weeklyRule.value) {
        return
      }
    }

    let parentId = existingParent.id
    let babyId = selectedBabyId

    if (!existingParent) {
      const newParent: Parent = {
        id: nextId('p'),
        name: parentName,
        phone,
        isBlacklisted: false,
        freezeUntil: null,
        freezeReason: null,
      }
      bookingStore.addParent(newParent)
      parentId = newParent.id
    }

    if (!babyId) {
      const newBaby: BabyType = {
        id: nextId('b'),
        parentId,
        name: babyName,
        ageMonths,
      }
      bookingStore.addBaby(newBaby)
      babyId = newBaby.id
    }

    const isFull = selectedSchedule.bookedCount >= selectedSchedule.maxCapacity

    if (isFull) {
      const waitingCount = bookingStore.waitlist.filter(
        (w) => w.scheduleId === selectedSchedule.id && w.status === 'waiting'
      ).length
      const wlEntry: WaitlistEntry = {
        id: nextId('wl'),
        scheduleId: selectedSchedule.id,
        babyId: babyId!,
        parentId,
        position: waitingCount + 1,
        status: 'waiting',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      bookingStore.addWaitlist(wlEntry)
      auditStore.addLog('waitlist_joined', 'parent', parentId, wlEntry.id, `${parentName}为${effectiveBabyName}进入候补队列`)
      setBookingResult('waitlist')
      setResultId(wlEntry.id)
      setResultPosition(wlEntry.position)
    } else {
      const ageMismatch = selectedCourse
        ? !selectedCourse.ageRanges.some((ar) => effectiveAge >= ar.minMonths && effectiveAge <= ar.maxMonths)
        : false
      const booking: Booking = {
        id: nextId('bk'),
        scheduleId: selectedSchedule.id,
        babyId: babyId!,
        parentId,
        status: 'confirmed',
        createdAt: new Date().toISOString().slice(0, 10),
        isAgeMismatch: ageMismatch,
      }
      bookingStore.addBooking(booking)
      scheduleStore.incrementBooked(selectedSchedule.id)
      auditStore.addLog('booking_created', 'parent', parentId, booking.id, `${parentName}为${effectiveBabyName}预约成功`)
      setBookingResult('confirmed')
      setResultId(booking.id)
    }

    setStep(4)
  }

  function handleReset() {
    setStep(1)
    setBabyName('')
    setAgeMonths(12)
    setParentName('')
    setPhone('')
    setSelectedBabyId(null)
    setSelectedScheduleId(null)
    setShowAgeModal(false)
    setShowDuplicateWarning(false)
    setBookingResult(null)
    setResultId('')
    setResultPosition(0)
  }

  const weeklyRule = ruleStore.getRuleByType('phone_weekly')
  const weekBookings = phone.length >= 11 ? bookingStore.getBookingsByPhoneThisWeek(phone) : []
  const weeklyLimitReached = weeklyRule ? weekBookings.length >= weeklyRule.value : false

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">试听课预约</h1>

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
                <Baby className="w-5 h-5 text-orange-500" /> 宝宝信息
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">宝宝姓名</label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="请输入宝宝姓名"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  disabled={!!selectedBabyId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  月龄：<span className="text-orange-600 font-bold">{ageMonths}个月</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={48}
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(Number(e.target.value))}
                  className="w-full accent-orange-500"
                  disabled={!!selectedBabyId}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1月</span>
                  <span>48月</span>
                </div>
              </div>

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
                      setSelectedBabyId(null)
                      setShowDuplicateWarning(false)
                    }}
                    onBlur={handlePhoneBlur}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </div>

              {freezeInfo.frozen && (
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
                  <p className="text-xs text-orange-600 mb-2">该手机号已有档案，请选择已有宝宝或新建：</p>
                  <div className="space-y-2">
                    {existingBabies.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectExistingBaby(b)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                          selectedBabyId === b.id
                            ? 'border-orange-400 bg-orange-100 text-orange-800'
                            : 'border-gray-200 bg-white hover:border-orange-300'
                        }`}
                      >
                        {b.name}（{b.ageMonths}个月）
                      </button>
                    ))}
                    <button
                      onClick={handleNewBaby}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                        !selectedBabyId
                          ? 'border-orange-400 bg-orange-100 text-orange-800'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      + 新建宝宝档案
                    </button>
                  </div>
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
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" /> 选择课程和时间
            </h2>

            {Object.entries(schedulesGroupedByDate).map(([date, schedules]) => (
              <div key={date}>
                <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {date}
                </div>
                <div className="space-y-3">
                  {schedules.map((sch) => {
                    const course = courseStore.courses.find((c) => c.id === sch.courseId)
                    const teacher = scheduleStore.teachers.find((t) => t.id === sch.teacherId)
                    const isFull = sch.bookedCount >= sch.maxCapacity
                    const isSelected = selectedScheduleId === sch.id
                    const usagePercent = Math.round((sch.bookedCount / sch.maxCapacity) * 100)

                    return (
                      <button
                        key={sch.id}
                        onClick={() => setSelectedScheduleId(sch.id)}
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
                          {course?.ageRanges.map((ar) => (
                            <span key={ar.id} className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                              {ar.label}
                            </span>
                          ))}
                        </div>

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
            ))}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> 上一步
              </button>
              <button
                onClick={() => selectedScheduleId && setStep(3)}
                disabled={!selectedScheduleId}
                className={`flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition ${
                  selectedScheduleId
                    ? 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                下一步 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedSchedule && selectedCourse && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-500" /> 确认预约
            </h2>

            <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">宝宝姓名</span>
                <span className="font-medium text-gray-800">{effectiveBabyName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">月龄</span>
                <span className="font-medium text-gray-800">{effectiveAge}个月</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">课程</span>
                <span className="font-medium text-gray-800">{selectedCourse.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">日期</span>
                <span className="font-medium text-gray-800">{selectedSchedule.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">时间</span>
                <span className="font-medium text-gray-800">{selectedSchedule.startTime}-{selectedSchedule.endTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">名额</span>
                <span className="font-medium text-gray-800">
                  {selectedSchedule.bookedCount}/{selectedSchedule.maxCapacity}
                </span>
              </div>

              {selectedSchedule.bookedCount >= selectedSchedule.maxCapacity && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                  该场次已满，预约将加入候补队列
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" /> 上一步
              </button>
              <button
                onClick={handleProceedToStep3}
                disabled={weeklyLimitReached}
                className={`flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition ${
                  weeklyLimitReached
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                }`}
              >
                {selectedSchedule.bookedCount >= selectedSchedule.maxCapacity ? '加入候补' : '确认预约'}
              </button>
            </div>

            {showAgeModal && selectedCourse && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">月龄不匹配提醒</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    宝宝月龄({effectiveAge}月)不在课程适用范围(
                    {selectedCourse.ageRanges.map((ar) => `${ar.minMonths}-${ar.maxMonths}月`).join('、')}
                    )，是否仍要继续预约？
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAgeModal(false)}
                      className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        setShowAgeModal(false)
                        executeBooking()
                      }}
                      className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
                    >
                      继续预约
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && bookingResult && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  bookingResult === 'confirmed' ? 'bg-green-100' : 'bg-orange-100'
                }`}
              >
                {bookingResult === 'confirmed' ? (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                ) : (
                  <Clock className="w-10 h-10 text-orange-500" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {bookingResult === 'confirmed' ? '预约成功！' : '已加入候补'}
              </h2>
              {bookingResult === 'waitlist' && (
                <p className="text-sm text-gray-500 mt-1">候补位置：第{resultPosition}位</p>
              )}
            </div>

            {selectedSchedule && selectedCourse && (
              <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">宝宝</span>
                  <span className="font-medium">{effectiveBabyName}（{effectiveAge}个月）</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">课程</span>
                  <span className="font-medium">{selectedCourse.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">日期</span>
                  <span className="font-medium">{selectedSchedule.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">时间</span>
                  <span className="font-medium">{selectedSchedule.startTime}-{selectedSchedule.endTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">状态</span>
                  <span
                    className={`font-medium ${
                      bookingResult === 'confirmed' ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {bookingResult === 'confirmed' ? '已确认' : '候补中'}
                  </span>
                </div>
              </div>
            )}

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
