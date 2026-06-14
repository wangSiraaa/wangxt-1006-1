import { useState } from 'react'
import { ShieldAlert, Snowflake, AlertTriangle } from 'lucide-react'
import { useRuleStore } from '@/stores/ruleStore'
import { useBookingStore } from '@/stores/bookingStore'
import type { FrequencyRule } from '@/types'

export default function Rules() {
  const { rules, updateRule } = useRuleStore()
  const { parents } = useBookingStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (rule: FrequencyRule) => {
    setEditingId(rule.id)
    setEditValue(String(rule.value))
  }

  const saveEdit = (id: string) => {
    const val = Number(editValue)
    if (!isNaN(val) && val > 0) {
      updateRule(id, { value: val })
    }
    setEditingId(null)
  }

  const toggleEnabled = (rule: FrequencyRule) => {
    updateRule(rule.id, { enabled: !rule.enabled })
  }

  const TYPE_LABEL: Record<FrequencyRule['type'], string> = {
    phone_weekly: '预约限制',
    freeze_duration: '冻结时长',
    blacklist: '黑名单阈值',
  }

  const restrictedParents = parents.filter((p) => p.isBlacklisted || (p.freezeUntil && new Date(p.freezeUntil) > new Date()))

  const getCountdown = (until: string) => {
    const diff = new Date(until).getTime() - Date.now()
    if (diff <= 0) return '已过期'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return days > 0 ? `${days}天${hours}小时` : `${hours}小时`
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">频次规则</h1>

        <div className="rounded-xl border border-orange-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-50">
                <th className="px-5 py-3 text-left font-medium text-gray-600">规则名称</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">类型</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">值</th>
                <th className="px-5 py-3 text-left font-medium text-gray-600">单位</th>
                <th className="px-5 py-3 text-center font-medium text-gray-600">启用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rules.map((rule) => (
                <tr key={rule.id} className={`hover:bg-orange-50/30 ${!rule.enabled ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 font-medium text-gray-800">{rule.name}</td>
                  <td className="px-5 py-3 text-gray-600">{TYPE_LABEL[rule.type]}</td>
                  <td className="px-5 py-3">
                    {editingId === rule.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(rule.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(rule.id)}
                        className="w-20 rounded-lg border border-[#F97316] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer rounded px-1.5 py-0.5 font-semibold text-[#F97316] hover:bg-orange-50"
                        onClick={() => startEdit(rule)}
                        title="点击编辑"
                      >
                        {rule.value}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {rule.unit === 'days' ? '天' : '次'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => toggleEnabled(rule)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        rule.enabled ? 'bg-[#F97316]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">限制记录</h2>

          {restrictedParents.length === 0 ? (
            <div className="rounded-xl border border-orange-100 bg-white p-8 text-center">
              <p className="text-gray-400">暂无限制记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {restrictedParents.map((parent) => (
                <div
                  key={parent.id}
                  className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {parent.isBlacklisted ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert size={18} className="text-red-500" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                        <Snowflake size={18} className="text-[#F97316]" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-800">{parent.name}</div>
                      <div className="text-xs text-gray-400">{parent.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {parent.isBlacklisted && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
                        <ShieldAlert size={12} />
                        黑名单
                      </span>
                    )}

                    {parent.freezeUntil && new Date(parent.freezeUntil) > new Date() && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                          <Snowflake size={12} />
                          冻结中
                        </span>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">
                            原因：{parent.freezeReason ?? '未说明'}
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <AlertTriangle size={10} className="text-orange-500" />
                            <span className="font-medium text-orange-600">
                              剩余 {getCountdown(parent.freezeUntil)}
                            </span>
                            <span className="text-gray-400">
                              （至 {parent.freezeUntil}）
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
