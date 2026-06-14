import { useState, useMemo } from 'react'
import { Filter } from 'lucide-react'
import { useAuditStore } from '@/stores/auditStore'
import type { AuditAction, AuditLog } from '@/types'

const ACTION_LABEL: Record<AuditAction, string> = {
  booking_created: '预约创建',
  booking_cancelled: '预约取消',
  booking_noshow: '爽约',
  booking_completed: '预约完成',
  waitlist_joined: '加入候补',
  waitlist_converted: '候补转正',
  freeze_applied: '冻结',
  freeze_expired: '冻结到期',
  blacklist_added: '加入黑名单',
  blacklist_removed: '移出黑名单',
  course_created: '课程创建',
  course_updated: '课程更新',
  schedule_created: '排班创建',
  report_submitted: '报告提交',
  funnel_updated: '漏斗更新',
}

const ACTION_COLOR: Record<string, string> = {
  booking_created: 'bg-green-100 text-green-700',
  booking_cancelled: 'bg-yellow-100 text-yellow-700',
  booking_noshow: 'bg-red-100 text-red-600',
  freeze_applied: 'bg-orange-100 text-orange-700',
  blacklist_added: 'bg-red-100 text-red-600',
  blacklist_removed: 'bg-gray-100 text-gray-600',
  funnel_updated: 'bg-blue-100 text-blue-700',
}

const getDefaultColor = (action: AuditAction) =>
  ACTION_COLOR[action] ?? 'bg-gray-100 text-gray-600'

const ACTION_OPTIONS: AuditAction[] = [
  'booking_created', 'booking_cancelled', 'booking_noshow', 'booking_completed',
  'waitlist_joined', 'waitlist_converted',
  'freeze_applied', 'freeze_expired',
  'blacklist_added', 'blacklist_removed',
  'course_created', 'course_updated',
  'schedule_created', 'report_submitted', 'funnel_updated',
]

const ROLE_LABEL: Record<string, string> = {
  consultant: '顾问',
  teacher: '教师',
  system: '系统',
  parent: '家长',
}

export default function Audit() {
  const { logs } = useAuditStore()

  const [filterAction, setFilterAction] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  const filtered = useMemo(() => {
    return [...logs]
      .filter((log) => {
        if (filterAction && log.action !== filterAction) return false
        if (filterRole && log.operatorRole !== filterRole) return false
        if (filterDateStart) {
          const d = new Date(log.createdAt)
          const s = new Date(filterDateStart + 'T00:00:00')
          if (d < s) return false
        }
        if (filterDateEnd) {
          const d = new Date(log.createdAt)
          const e = new Date(filterDateEnd + 'T23:59:59')
          if (d > e) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [logs, filterAction, filterRole, filterDateStart, filterDateEnd])

  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const fmtDateLabel = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const groupedByDate = useMemo(() => {
    const map = new Map<string, AuditLog[]>()
    filtered.forEach((log) => {
      const key = fmtDateLabel(log.createdAt)
      const list = map.get(key) ?? []
      list.push(log)
      map.set(key, list)
    })
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">审计日志</h1>

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
          <Filter size={16} className="text-[#F97316] mb-2" />
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">操作类型</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-[#F97316] focus:outline-none"
            >
              <option value="">全部</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_LABEL[a]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">操作角色</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-[#F97316] focus:outline-none"
            >
              <option value="">全部</option>
              <option value="consultant">顾问</option>
              <option value="teacher">教师</option>
              <option value="system">系统</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">开始日期</label>
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-[#F97316] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500">结束日期</label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-[#F97316] focus:outline-none"
            />
          </div>
          <button
            onClick={() => {
              setFilterAction('')
              setFilterRole('')
              setFilterDateStart('')
              setFilterDateEnd('')
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            重置
          </button>
        </div>

        {groupedByDate.length === 0 ? (
          <div className="rounded-xl border border-orange-100 bg-white p-12 text-center">
            <p className="text-gray-400">暂无日志记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map(([date, dateLogs]) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#F97316]" />
                  <span className="text-xs font-semibold text-gray-500">{date}</span>
                </div>
                <div className="ml-1 border-l-2 border-orange-100 pl-5 space-y-0">
                  {dateLogs.map((log) => (
                    <div key={log.id} className="relative py-3">
                      <div className="absolute -left-[22px] top-5 h-2 w-2 rounded-full border-2 border-[#F97316] bg-white" />
                      <div className="rounded-lg bg-white border border-orange-50 px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getDefaultColor(log.action)}`}>
                              {ACTION_LABEL[log.action]}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {ROLE_LABEL[log.operatorRole] ?? log.operatorRole}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">{fmtTime(log.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{log.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
