// 早教试听预约 - 家长端提交链路回归验证脚本
// 使用方式: npx tsx scripts/regression-test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import assert from 'node:assert/strict'

type BookingStatus = 'confirmed' | 'cancelled' | 'noshow' | 'completed'

interface Parent {
  id: string
  name: string
  phone: string
  isBlacklisted: boolean
  freezeUntil: string | null
  freezeReason: string | null
}
interface Baby {
  id: string
  parentId: string
  name: string
  ageMonths: number
}

// ===== 模拟 bookingStore 的核心方法 (独立可测) =====
const createBookingStore = () => {
  const state = {
    parents: [] as Parent[],
    babies: [] as Baby[],
    bookings: [] as any[],
    waitlist: [] as any[],
  }

  const addAudit: string[] = []
  const scheduleInc: Record<string, number> = {}

  return {
    state,
    scheduleInc,
    getAuditLog: () => addAudit,

    getParentByPhone(phone: string) {
      return state.parents.find((p) => p.phone === phone)
    },

    getOrCreateParent(phone: string, name: string): Parent {
      const existing = this.getParentByPhone(phone)
      if (existing) return existing
      const p: Parent = {
        id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        phone,
        isBlacklisted: false,
        freezeUntil: null,
        freezeReason: null,
      }
      state.parents.push(p)
      return p
    },

    getOrCreateBaby(
      parentId: string,
      name: string,
      ageMonths: number,
      existingBabyId?: string | null,
    ): Baby {
      if (existingBabyId) {
        const found = state.babies.find((b) => b.id === existingBabyId)
        if (found) return found
      }
      const sameName = state.babies.find(
        (b) =>
          b.parentId === parentId &&
          b.name === name &&
          Math.abs(b.ageMonths - ageMonths) <= 1,
      )
      if (sameName) return sameName
      const b: Baby = {
        id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        parentId,
        name,
        ageMonths,
      }
      state.babies.push(b)
      return b
    },

    getBookingsByPhoneThisWeek(phone: string) {
      const parent = this.getParentByPhone(phone)
      if (!parent) return []
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return state.bookings.filter(
        (b) =>
          b.parentId === parent.id &&
          new Date(b.createdAt) >= weekStart &&
          b.status !== 'cancelled',
      )
    },

    isPhoneBlacklisted(phone: string) {
      return this.getParentByPhone(phone)?.isBlacklisted ?? false
    },

    isPhoneFrozen(phone: string) {
      const p = this.getParentByPhone(phone)
      if (!p || !p.freezeUntil) return { frozen: false, reason: null, until: null }
      if (new Date(p.freezeUntil) <= new Date())
        return { frozen: false, reason: null, until: null }
      return { frozen: true, reason: p.freezeReason, until: p.freezeUntil }
    },
  }
}

// ===== 模拟完整的 executeBooking 流程 =====
interface ScheduleStub {
  id: string
  bookedCount: number
  maxCapacity: number
  date: string
}
interface CourseStub {
  id: string
  ageRanges: { minMonths: number; maxMonths: number }[]
}

const runExecuteBooking = (
  store: ReturnType<typeof createBookingStore>,
  params: {
    phone: string
    parentName: string
    babyName: string
    ageMonths: number
    existingBabyId?: string | null
    weeklyLimit: number
    schedule: ScheduleStub
    course: CourseStub
  },
) => {
  const {
    phone,
    parentName,
    babyName,
    ageMonths,
    existingBabyId,
    weeklyLimit,
    schedule,
    course,
  } = params

  let error: string | null = null
  let result:
    | { type: 'confirmed'; bookingId: string; ageMismatch: boolean }
    | { type: 'waitlist'; entryId: string; position: number }
    | null = null

  // === 1. 先建档案（新核心顺序） ===
  const parent = store.getOrCreateParent(phone, parentName)
  const baby = store.getOrCreateBaby(parent.id, babyName, ageMonths, existingBabyId)

  const ageMismatch = !course.ageRanges.some(
    (ar) => ageMonths >= ar.minMonths && ageMonths <= ar.maxMonths,
  )

  // === 2. 再做检查 ===
  const weekBookings = store.getBookingsByPhoneThisWeek(phone)
  if (weekBookings.length >= weeklyLimit) {
    error = `该手机号本周已预约 ${weekBookings.length} 次，限 ${weeklyLimit} 次`
    return { error, result, parent, baby }
  }
  if (store.isPhoneBlacklisted(phone)) {
    error = '黑名单'
    return { error, result, parent, baby }
  }
  const freeze = store.isPhoneFrozen(phone)
  if (freeze.frozen) {
    error = `冻结至${freeze.until}`
    return { error, result, parent, baby }
  }

  // === 3. 再写入 ===
  if (schedule.bookedCount >= schedule.maxCapacity) {
    const wCount = store.state.waitlist.filter(
      (w) => w.scheduleId === schedule.id && w.status === 'waiting',
    ).length
    const id = `wl_${Date.now()}`
    store.state.waitlist.push({
      id,
      scheduleId: schedule.id,
      babyId: baby.id,
      parentId: parent.id,
      position: wCount + 1,
      status: 'waiting',
      createdAt: new Date().toISOString().slice(0, 10),
    })
    result = { type: 'waitlist', entryId: id, position: wCount + 1 }
  } else {
    const id = `bk_${Date.now()}`
    store.state.bookings.push({
      id,
      scheduleId: schedule.id,
      babyId: baby.id,
      parentId: parent.id,
      status: 'confirmed' as BookingStatus,
      createdAt: new Date().toISOString().slice(0, 10),
      isAgeMismatch: ageMismatch,
    })
    store.scheduleInc[schedule.id] = (store.scheduleInc[schedule.id] ?? 0) + 1
    result = { type: 'confirmed', bookingId: id, ageMismatch }
  }

  return { error, result, parent, baby }
}

// ========= 开始回归验证 =========
let passed = 0
let failed = 0
const report: { name: string; ok: boolean; detail: string }[] = []

const test = (name: string, fn: () => void) => {
  try {
    fn()
    passed++
    report.push({ name, ok: true, detail: 'OK' })
    console.log(`  ✅ ${name}`)
  } catch (e: any) {
    failed++
    report.push({ name, ok: false, detail: e?.message ?? String(e) })
    console.log(`  ❌ ${name}: ${e?.message ?? e}`)
  }
}

console.log('\n=== 场景1: 新手机号正常预约 ===')
{
  const store = createBookingStore()
  const s: ScheduleStub = { id: 's_new', bookedCount: 0, maxCapacity: 5, date: '2026-06-20' }
  const c: CourseStub = { id: 'c1', ageRanges: [{ minMonths: 6, maxMonths: 18 }] }
  const r = runExecuteBooking(store, {
    phone: '13900001111',
    parentName: '新家长A',
    babyName: '乐乐',
    ageMonths: 10,
    weeklyLimit: 1,
    schedule: s,
    course: c,
  })

  test('档案创建 - 新家长被注册', () => {
    assert.equal(r.parent.phone, '13900001111')
    assert.equal(r.parent.name, '新家长A')
  })
  test('档案创建 - 新宝宝被注册', () => {
    assert.equal(r.baby.parentId, r.parent.id)
    assert.equal(r.baby.name, '乐乐')
    assert.equal(r.baby.ageMonths, 10)
  })
  test('预约结果 - 成功确认', () => {
    assert.equal(r.error, null)
    assert.ok(r.result && r.result.type === 'confirmed')
  })
  test('预约结果 - 年龄标记正确（匹配）', () => {
    assert.ok(r.result && r.result.type === 'confirmed')
    assert.equal((r.result as any).ageMismatch, false)
  })
  test('排班名额 - 正确+1', () => {
    assert.equal(store.scheduleInc['s_new'], 1)
  })
  test('预约记录 - 正确写入', () => {
    assert.equal(store.state.bookings.length, 1)
    assert.equal(store.state.bookings[0].parentId, r.parent.id)
    assert.equal(store.state.bookings[0].babyId, r.baby.id)
  })
}

console.log('\n=== 场景2: 满员自动进入候补 ===')
{
  const store = createBookingStore()
  const s: ScheduleStub = { id: 's_full', bookedCount: 3, maxCapacity: 3, date: '2026-06-20' }
  const c: CourseStub = { id: 'c1', ageRanges: [{ minMonths: 6, maxMonths: 18 }] }

  // 先占用一些候补
  store.state.waitlist.push({
    id: 'wl_old',
    scheduleId: 's_full',
    babyId: 'b_x',
    parentId: 'p_x',
    position: 1,
    status: 'waiting',
  })

  const r = runExecuteBooking(store, {
    phone: '13900002222',
    parentName: '新家长B',
    babyName: '豆豆',
    ageMonths: 12,
    weeklyLimit: 1,
    schedule: s,
    course: c,
  })

  test('档案创建 - 新家长被注册（候补分支也要建档案）', () => {
    assert.equal(store.state.parents.length, 1)
    assert.equal(r.parent.phone, '13900002222')
  })
  test('档案创建 - 新宝宝被注册（候补分支也要建档案）', () => {
    assert.equal(store.state.babies.length, 1)
    assert.equal(r.baby.name, '豆豆')
  })
  test('预约结果 - 返回候补而非确认', () => {
    assert.equal(r.error, null)
    assert.ok(r.result && r.result.type === 'waitlist')
  })
  test('候补位置 - 正确累加第2位', () => {
    assert.ok(r.result && r.result.type === 'waitlist')
    assert.equal((r.result as any).position, 2)
  })
  test('排班名额 - 候补不加计数', () => {
    assert.equal(store.scheduleInc['s_full'], undefined)
  })
  test('候补记录 - 正确写入关联家长/宝宝', () => {
    const lastWl = store.state.waitlist[store.state.waitlist.length - 1]
    assert.equal(lastWl.parentId, r.parent.id)
    assert.equal(lastWl.babyId, r.baby.id)
    assert.equal(lastWl.status, 'waiting')
  })
}

console.log('\n=== 场景3: 年龄不匹配但用户选择继续预约 ===')
{
  const store = createBookingStore()
  const s: ScheduleStub = { id: 's_age', bookedCount: 0, maxCapacity: 3, date: '2026-06-20' }
  const c: CourseStub = { id: 'c_sensory', ageRanges: [{ minMonths: 6, maxMonths: 12 }] }

  // 20月龄 > 12上限，应标记 isAgeMismatch=true
  const r = runExecuteBooking(store, {
    phone: '13900003333',
    parentName: '新家长C',
    babyName: '萌萌',
    ageMonths: 20,
    weeklyLimit: 1,
    schedule: s,
    course: c,
  })

  test('档案创建 - 家长注册成功', () => {
    assert.equal(store.state.parents.length, 1)
  })
  test('预约结果 - 预约成功（用户已确认继续）', () => {
    assert.equal(r.error, null)
    assert.ok(r.result && r.result.type === 'confirmed')
  })
  test('预约标记 - isAgeMismatch=true 正确写入', () => {
    assert.ok(r.result && r.result.type === 'confirmed')
    assert.equal((r.result as any).ageMismatch, true)
    const lastBk = store.state.bookings[store.state.bookings.length - 1]
    assert.equal(lastBk.isAgeMismatch, true)
  })
  test('排班名额 - 正常+1', () => {
    assert.equal(store.scheduleInc['s_age'], 1)
  })
}

console.log('\n=== 场景4: 新手机号也受频次限制(修复前的bug验证) ===')
{
  const store = createBookingStore()
  const s1: ScheduleStub = { id: 's_a', bookedCount: 0, maxCapacity: 5, date: '2026-06-20' }
  const s2: ScheduleStub = { id: 's_b', bookedCount: 0, maxCapacity: 5, date: '2026-06-21' }
  const c: CourseStub = { id: 'c1', ageRanges: [{ minMonths: 6, maxMonths: 18 }] }

  // 第一次成功
  const r1 = runExecuteBooking(store, {
    phone: '13900004444',
    parentName: '新家长D',
    babyName: '多多',
    ageMonths: 10,
    weeklyLimit: 1,
    schedule: s1,
    course: c,
  })
  test('第1次预约 - 成功', () => {
    assert.equal(r1.error, null)
    assert.ok(r1.result?.type === 'confirmed')
  })

  // 第二次同手机号 → 被拦截 (关键: 之前的bug是频次检查时parent不存在，从而跳过了频次)
  const r2 = runExecuteBooking(store, {
    phone: '13900004444',
    parentName: '新家长D',
    babyName: '多多',
    ageMonths: 11,
    weeklyLimit: 1,
    schedule: s2,
    course: c,
  })
  test('第2次预约 - 频次限制触发 不再静默返回', () => {
    assert.notEqual(r2.error, null)
    assert.match(r2.error!, /限 1 次/)
    assert.equal(r2.result, null)
  })
  test('第2次 - 失败时不写入预约', () => {
    assert.equal(store.state.bookings.length, 1)
  })
  test('第2次 - 失败时不写入候补', () => {
    assert.equal(store.state.waitlist.length, 0)
  })
  test('档案复用 - 家长复用不新增', () => {
    assert.equal(store.state.parents.length, 1)
  })
  test('档案复用 - 同名字同月龄宝宝复用不新增', () => {
    assert.equal(store.state.babies.length, 1)
  })
}

console.log('\n=== 场景5: 新手机号黑名单/冻结正确拦截(非静默) ===')
{
  const store = createBookingStore()
  const s: ScheduleStub = { id: 's_x', bookedCount: 0, maxCapacity: 5, date: '2026-06-20' }
  const c: CourseStub = { id: 'c1', ageRanges: [{ minMonths: 6, maxMonths: 18 }] }

  // 预先创建一个黑名单家长
  const bp = store.getOrCreateParent('13999999999', '黑名单家长')
  bp.isBlacklisted = true

  const r = runExecuteBooking(store, {
    phone: '13999999999',
    parentName: '黑名单家长',
    babyName: '小明',
    ageMonths: 10,
    weeklyLimit: 1,
    schedule: s,
    course: c,
  })

  test('黑名单 - 明确返回错误(非静默)', () => {
    assert.equal(r.error, '黑名单')
    assert.equal(r.result, null)
  })

  // 冻结用户
  const fp = store.getOrCreateParent('13988888888', '冻结家长')
  fp.freezeUntil = '2099-12-31'
  fp.freezeReason = '爽约'

  const r2 = runExecuteBooking(store, {
    phone: '13988888888',
    parentName: '冻结家长',
    babyName: '小红',
    ageMonths: 10,
    weeklyLimit: 1,
    schedule: s,
    course: c,
  })
  test('爽约冻结 - 明确返回错误(非静默)', () => {
    assert.ok(r2.error?.startsWith('冻结至'))
    assert.equal(r2.result, null)
  })
}

// 汇总
console.log(
  `\n========================\n📊 回归验证结果: 通过 ${passed} / ${passed + failed}`,
)
if (failed > 0) {
  console.log('失败项:')
  report.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
  process.exit(1)
}
console.log('🎉 所有回归用例通过!\n')
