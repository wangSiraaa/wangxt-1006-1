import { useState, useMemo } from 'react'
import { MessageSquarePlus, Ticket, ChevronDown, ChevronRight, UserX, Users, Sparkles, ArrowRightLeft, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useReportStore } from '@/stores/reportStore'
import { useBookingStore } from '@/stores/bookingStore'
import type { FunnelStage, FunnelRecord, BookingCategory } from '@/types'

const STAGE_LABEL: Record<FunnelStage, string> = {
  trial: '试听',
  interested: '意向',
  coupon_sent: '已发优惠券',
  signed: '已签约',
  lost: '流失',
}

const STAGE_COLOR: Record<FunnelStage, string> = {
  trial: 'bg-blue-100 text-blue-700',
  interested: 'bg-amber-100 text-amber-700',
  coupon_sent: 'bg-purple-100 text-purple-700',
  signed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}

const CATEGORY_LABEL: Record<BookingCategory, string> = {
  new_customer: '新客',
  sibling: '兄弟姐妹',
  noshow_recovery: '爽约恢复',
  conversion_followup: '转正跟进',
}

const CATEGORY_COLOR: Record<BookingCategory, string> = {
  new_customer: 'bg-blue-50 text-blue-600 border-blue-200',
  sibling: 'bg-purple-50 text-purple-600 border-purple-200',
  noshow_recovery: 'bg-amber-50 text-amber-600 border-amber-200',
  conversion_followup: 'bg-green-50 text-green-600 border-green-200',
}

const STAGE_ORDER: FunnelStage[] = ['trial', 'interested', 'coupon_sent', 'signed', 'lost']

const NEXT_STAGE: Partial<Record<FunnelStage, FunnelStage>> = {
  trial: 'interested',
  interested: 'coupon_sent',
  coupon_sent: 'signed',
}

export default function Funnel() {
  const { funnels, updateFunnelStage, addFunnelNote, updateFunnelCoupon, todos, completeTodo, getPendingTodos, getTodosByBooking } = useReportStore()
  const { parents, babies, bookings } = useBookingStore()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<string | null>(null)
  const [couponModal, setCouponModal] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [filterCategory, setFilterCategory] = useState<BookingCategory | 'all'>('all')

  const stageCounts = useMemo(() => {
    const counts: Record<FunnelStage, number> = { trial: 0, interested: 0, coupon_sent: 0, signed: 0, lost: 0 }
    funnels.forEach((f) => {
      if (filterCategory === 'all' || f.category === filterCategory) {
        counts[f.stage]++
      }
    })
    return counts
  }, [funnels, filterCategory])

  const filteredFunnels = useMemo(() => {
    if (filterCategory === 'all') return funnels
    return funnels.filter(f => f.category === filterCategory)
  }, [funnels, filterCategory])

  const getParent = (id: string) => parents.find((p) => p.id === id)
  const getBaby = (id: string) => babies.find((b) => b.id === id)
  const getBooking = (bookingId: string) => bookings.find(b => b.id === bookingId)
  const getBookingTodos = (bookingId: string) => getTodosByBooking(bookingId)

  const handleAddNote = (funnelId: string) => {
    if (!noteText.trim()) return
    addFunnelNote(funnelId, {
      id: `fn${Date.now()}`,
      content: noteText,
      createdAt: new Date().toISOString().slice(0, 10),
      operatorId: 'consultant1',
    })
    setNoteText('')
    setNoteModal(null)
  }

  const handleAddCoupon = (funnelId: string) => {
    if (!couponCode.trim()) return
    updateFunnelCoupon(funnelId, couponCode)
    setCouponCode('')
    setCouponModal(null)
  }

  const handleStageTransition = (funnelId: string, stage: FunnelStage) => {
    updateFunnelStage(funnelId, stage)
  }

  const handleCompleteTodo = (todoId: string) => {
    completeTodo(todoId)
  }

  const maxCount = Math.max(...STAGE_ORDER.map((s) => stageCounts[s]), 1)
  const pendingTodos = getPendingTodos()

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    funnels.forEach(f => {
      const key = f.category || 'new_customer'
      stats[key] = (stats[key] || 0) + 1
    })
    return stats
  }, [funnels])

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">转化漏斗</h1>

        <div className="mb-6 grid grid-cols-4 gap-3">
          <button
            onClick={() => setFilterCategory('all')}
            className={`p-3 rounded-xl transition ${
              filterCategory === 'all'
                ? 'bg-white shadow-md ring-2 ring-orange-400'
                : 'bg-white/60 hover:bg-white'
            }`}
          >
            <p className="text-2xl font-bold text-gray-800">{funnels.length}</p>
            <p className="text-xs text-gray-500">全部客户</p>
          </button>
          {(Object.keys(CATEGORY_LABEL) as BookingCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`p-3 rounded-xl transition ${
                filterCategory === cat
                  ? 'bg-white shadow-md ring-2 ring-orange-400'
                  : 'bg-white/60 hover:bg-white'
              }`}
            >
              <p className="text-2xl font-bold text-gray-800">{categoryStats[cat] || 0}</p>
              <p className="text-xs text-gray-500">{CATEGORY_LABEL[cat]}</p>
            </button>
          ))}
        </div>

        <div className="mb-8 rounded-xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">漏斗概览</h2>
          <div className="flex items-end justify-center gap-3">
            {STAGE_ORDER.map((stage, idx) => {
              const count = stageCounts[stage]
              const widthPct = 50 + (count / maxCount) * 50
              return (
                <div key={stage} className="flex flex-col items-center gap-2">
                  <span className="text-lg font-bold text-gray-800">{count}</span>
                  <div
                    className="flex items-center justify-center rounded-t-lg transition-all"
                    style={{
                      width: `${widthPct}px`,
                      height: `${40 + (count / maxCount) * 80}px`,
                      backgroundColor: stage === 'lost' ? '#FEE2E2' : stage === 'signed' ? '#D1FAE5' : '#FFF7ED',
                      borderBottom: `3px solid ${stage === 'lost' ? '#EF4444' : stage === 'signed' ? '#10B981' : '#F97316'}`,
                    }}
                  >
                    <span
                      className={`text-xs font-medium ${stage === 'lost' ? 'text-red-600' : stage === 'signed' ? 'text-green-700' : 'text-orange-700'}`}
                    >
                      {STAGE_LABEL[stage]}
                    </span>
                  </div>
                  {idx < STAGE_ORDER.length - 1 && idx !== 2 && (
                    <div className="text-gray-300 text-xs mt-1">↓</div>
                  )}
                  {idx === 2 && (
                    <div className="flex gap-1 mt-1 text-xs text-gray-300">
                      <span>→签约</span>
                      <span>→流失</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {pendingTodos.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              待办事项（{pendingTodos.length}）
            </h3>
            <div className="space-y-2">
              {pendingTodos.slice(0, 3).map(todo => {
                const parent = getParent(todo.parentId)
                const baby = getBaby(todo.babyId)
                return (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between rounded-lg bg-white/80 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        todo.priority === 'high' ? 'bg-red-500' :
                        todo.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{todo.title}</p>
                        <p className="text-xs text-gray-500">
                          {parent?.name} · {baby?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteTodo(todo.id)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      完成
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold text-gray-800">漏斗记录</h2>

        {filteredFunnels.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white p-12 text-center">
            <p className="text-gray-400">暂无漏斗记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFunnels.map((funnel) => {
              const parent = getParent(funnel.parentId)
              const baby = getBaby(funnel.babyId)
              const isExpanded = expandedId === funnel.id
              const booking = funnel.bookingId ? getBooking(funnel.bookingId) : null
              const bookingTodos = funnel.bookingId ? getBookingTodos(funnel.bookingId) : []
              const pendingBookingTodos = bookingTodos.filter(t => t.status === 'pending')

              return (
                <div key={funnel.id} className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-orange-50/50"
                    onClick={() => setExpandedId(isExpanded ? null : funnel.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {parent?.name ?? '未知'} · {baby?.name ?? '未知'}
                          </span>
                          {funnel.category && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLOR[funnel.category]}`}>
                              {CATEGORY_LABEL[funnel.category]}
                            </span>
                          )}
                          {funnel.isPromotionCustomer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-200">
                              🎫 促销
                            </span>
                          )}
                          {funnel.siblingGroupId && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-200">
                              👨‍👩‍👧 多孩
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{funnel.updatedAt}</span>
                          {pendingBookingTodos.length > 0 && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Clock className="w-3 h-3" /> {pendingBookingTodos.length}项待办
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STAGE_COLOR[funnel.stage]}`}>
                        {STAGE_LABEL[funnel.stage]}
                      </span>
                      {funnel.couponCode && (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                          券 {funnel.couponCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-orange-50 px-5 py-4">
                      {funnel.transferSuggestion && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" /> 转班建议
                          </h4>
                          <p className="text-sm text-amber-700">
                            老师建议从 {funnel.transferSuggestion.fromCourseId} 转到 {funnel.transferSuggestion.toCourseId}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            原因：{funnel.transferSuggestion.reason}
                          </p>
                        </div>
                      )}

                      {pendingBookingTodos.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 待办事项
                          </h4>
                          {pendingBookingTodos.map(todo => (
                            <div key={todo.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  todo.priority === 'high' ? 'bg-red-500' :
                                  todo.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                                }`} />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">{todo.title}</p>
                                  <p className="text-xs text-gray-400">{todo.content}</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCompleteTodo(todo.id) }}
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> 完成
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {funnel.notes.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">跟进记录</h4>
                          {funnel.notes.map((note) => (
                            <div key={note.id} className="flex gap-3">
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-[#F97316] flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-700">{note.content}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{note.createdAt}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setNoteModal(funnel.id) }}
                          className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-[#F97316] hover:bg-orange-100"
                        >
                          <MessageSquarePlus size={12} />
                          添加跟进
                        </button>

                        {funnel.stage !== 'signed' && funnel.stage !== 'lost' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setCouponModal(funnel.id) }}
                            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100"
                          >
                            <Ticket size={12} />
                            发放优惠券
                          </button>
                        )}

                        {NEXT_STAGE[funnel.stage] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStageTransition(funnel.id, NEXT_STAGE[funnel.stage]!) }}
                            className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
                          >
                            转为{STAGE_LABEL[NEXT_STAGE[funnel.stage]!]}
                          </button>
                        )}

                        {funnel.stage === 'coupon_sent' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStageTransition(funnel.id, 'signed') }}
                            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
                          >
                            确认签约
                          </button>
                        )}

                        {funnel.stage !== 'lost' && funnel.stage !== 'signed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStageTransition(funnel.id, 'lost') }}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100"
                          >
                            <UserX className="w-3 h-3 inline mr-0.5" />
                            标记流失
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-bold text-gray-800">添加跟进</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              placeholder="输入跟进内容"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setNoteModal(null); setNoteText('') }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={() => handleAddNote(noteModal)} className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">确认</button>
            </div>
          </div>
        </div>
      )}

      {couponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-bold text-gray-800">发放优惠券</h3>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              placeholder="输入优惠券码"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => { setCouponModal(null); setCouponCode('') }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={() => handleAddCoupon(couponModal)} className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600">发放</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
