import { useState } from 'react'
import { ShieldAlert, Snowflake, AlertTriangle, Phone, Ticket, Users, Settings, Info } from 'lucide-react'
import { useRuleStore } from '@/stores/ruleStore'
import { useBookingStore } from '@/stores/bookingStore'
import type { FrequencyRule } from '@/types'

export default function Rules() {
  const { rules, updateRule } = useRuleStore()
  const { parents } = useBookingStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [activeTab, setActiveTab] = useState<'frequency' | 'booking' | 'promotion'>('frequency')

  const startEdit = (rule: FrequencyRule) => {
    setEditingId(rule.id)
    setEditValue(String(rule.value))
  }

  const saveEdit = (id: string) => {
    const val = Number(editValue)
    if (!isNaN(val) && val >= 0) {
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
    phone_transfer_allowed: '转手机号预约',
    promotion_slots: '促销名额',
    sibling_discount: '兄弟姐妹优惠',
  }

  const TYPE_UNIT: Record<FrequencyRule['type'], string> = {
    phone_weekly: '次',
    freeze_duration: '天',
    blacklist: '次',
    phone_transfer_allowed: '允许',
    promotion_slots: '个/月',
    sibling_discount: '折',
  }

  const TYPE_DESC: Record<FrequencyRule['type'], string> = {
    phone_weekly: '同一手机号每周最多可预约试听次数',
    freeze_duration: '爽约后账号冻结时长',
    blacklist: '累计爽约多少次进入黑名单',
    phone_transfer_allowed: '是否允许冻结手机号通过更换家长手机号重新预约',
    promotion_slots: '每月促销体验课名额总数',
    sibling_discount: '兄弟姐妹同约享受的折扣（如9折即90）',
  }

  const frequencyRules = rules.filter(r => ['phone_weekly', 'freeze_duration', 'blacklist'].includes(r.type))
  const bookingRules = rules.filter(r => ['phone_transfer_allowed', 'sibling_discount'].includes(r.type))
  const promotionRules = rules.filter(r => ['promotion_slots'].includes(r.type))

  const restrictedParents = parents.filter((p) => p.isBlacklisted || (p.freezeUntil && new Date(p.freezeUntil) > new Date()))

  const getCountdown = (until: string) => {
    const diff = new Date(until).getTime() - Date.now()
    if (diff <= 0) return '已过期'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return days > 0 ? `${days}天${hours}小时` : `${hours}小时`
  }

  const getRuleIcon = (type: FrequencyRule['type']) => {
    switch (type) {
      case 'phone_weekly': return <Phone className="w-4 h-4" />
      case 'freeze_duration': return <Snowflake className="w-4 h-4" />
      case 'blacklist': return <ShieldAlert className="w-4 h-4" />
      case 'phone_transfer_allowed': return <Phone className="w-4 h-4" />
      case 'promotion_slots': return <Ticket className="w-4 h-4" />
      case 'sibling_discount': return <Users className="w-4 h-4" />
    }
  }

  const renderRuleCard = (rule: FrequencyRule) => (
    <div
      key={rule.id}
      className={`p-4 rounded-xl border transition ${
        rule.enabled ? 'bg-white border-orange-100' : 'bg-gray-50 border-gray-200 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            rule.enabled ? 'bg-orange-100 text-[#F97316]' : 'bg-gray-200 text-gray-500'
          }`}>
            {getRuleIcon(rule.type)}
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{rule.name}</h4>
            <p className="text-xs text-gray-500">{TYPE_LABEL[rule.type]}</p>
          </div>
        </div>
        <button
          onClick={() => toggleEnabled(rule)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            rule.enabled ? 'bg-[#F97316]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              rule.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3 flex items-start gap-1">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        {TYPE_DESC[rule.type]}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">值：</span>
        {editingId === rule.id ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(rule.id)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit(rule.id)}
              className="w-20 rounded-lg border border-[#F97316] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              autoFocus
            />
            <span className="text-sm text-gray-500">{TYPE_UNIT[rule.type]}</span>
          </div>
        ) : (
          <span
            className="cursor-pointer rounded px-2 py-0.5 font-semibold text-[#F97316] hover:bg-orange-50"
            onClick={() => startEdit(rule)}
            title="点击编辑"
          >
            {rule.value} {TYPE_UNIT[rule.type]}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">规则配置</h1>

        <div className="mb-6 flex gap-2">
          {[
            { key: 'frequency', label: '频次规则', icon: Settings },
            { key: 'booking', label: '预约规则', icon: Phone },
            { key: 'promotion', label: '促销与优惠', icon: Ticket },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-[#F97316] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'frequency' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {frequencyRules.map(renderRuleCard)}
          </div>
        )}

        {activeTab === 'booking' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {bookingRules.map(renderRuleCard)}
            </div>

            <div className="rounded-xl border border-orange-100 bg-white p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                转手机号预约说明
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 当"转手机号预约"规则启用时，被冻结的家长可以通过更换手机号重新预约</p>
                <p>• 重新预约的客户会自动标记为「爽约恢复」分类</p>
                <p>• 系统会通过宝宝姓名+生日识别同一孩子，避免重复建立档案</p>
                <p>• 顾问可在试听总览页查看所有爽约恢复客户，重点跟进</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'promotion' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {promotionRules.map(renderRuleCard)}
              <div className="p-4 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">兄弟姐妹同约优惠</h4>
                    <p className="text-xs text-gray-500">sibling_discount</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  同一家庭多个孩子同时预约试听时享受的折扣优惠
                </p>
                <div className="text-sm text-purple-700 font-medium">
                  当前折扣：9 折
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-100 bg-white p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-500" />
                促销名额使用规则
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 促销名额每月重置，数量由"每月促销名额"规则控制</p>
                <p>• 促销课价格低于常规体验课，需占用促销名额</p>
                <p>• 家长预约时可选择是否使用促销名额，顾问也可在后台调整</p>
                <p>• 兄弟姐妹同约时，每个孩子各占用一个促销名额</p>
                <p>• 爽约的促销名额不予返还，计入当月已使用数量</p>
              </div>
            </div>
          </div>
        )}

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
