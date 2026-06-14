import { useState, useMemo } from 'react'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useCourseStore } from '@/stores/courseStore'
import type { Schedule } from '@/types'

const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export default function SchedulePage() {
  const { teachers, classrooms, schedules, addSchedule } = useScheduleStore()
  const { courses } = useCourseStore()

  const [weekOffset, setWeekOffset] = useState(0)
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterClassroom, setFilterClassroom] = useState('')
  const [showModal, setShowModal] = useState(false)

  const [formCourse, setFormCourse] = useState('')
  const [formTeacher, setFormTeacher] = useState('')
  const [formClassroom, setFormClassroom] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStart, setFormStart] = useState('09:00')
  const [formEnd, setFormEnd] = useState('09:45')

  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() + weekOffset * 7)
  const weekDates = useMemo(() => getWeekDates(baseDate), [weekOffset])

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (filterTeacher && s.teacherId !== filterTeacher) return false
      if (filterClassroom && s.classroomId !== filterClassroom) return false
      return weekDates.includes(s.date)
    })
  }, [schedules, filterTeacher, filterClassroom, weekDates])

  const getScheduleForCell = (date: string, time: string) => {
    return filteredSchedules.find((s) => {
      if (s.date !== date) return false
      const startHour = parseInt(s.startTime.split(':')[0])
      const cellHour = parseInt(time.split(':')[0])
      return startHour === cellHour
    })
  }

  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.name ?? ''
  const getTeacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? ''
  const getClassroomName = (id: string) => classrooms.find((c) => c.id === id)?.name ?? ''

  const handleAdd = () => {
    if (!formCourse || !formTeacher || !formClassroom || !formDate || !formStart || !formEnd) return
    const classroom = classrooms.find((c) => c.id === formClassroom)
    const newSchedule: Schedule = {
      id: `s${Date.now()}`,
      courseId: formCourse,
      teacherId: formTeacher,
      classroomId: formClassroom,
      date: formDate,
      startTime: formStart,
      endTime: formEnd,
      maxCapacity: classroom?.capacity ?? 3,
      bookedCount: 0,
    }
    addSchedule(newSchedule)
    setShowModal(false)
    setFormCourse('')
    setFormTeacher('')
    setFormClassroom('')
    setFormDate('')
    setFormStart('09:00')
    setFormEnd('09:45')
  }

  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">排班管理</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            新增排班
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-orange-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
              {fmtDate(weekDates[0])} - {fmtDate(weekDates[6])}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="rounded-lg border border-gray-200 p-1.5 hover:bg-orange-50"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-[#F97316] hover:bg-orange-100"
            >
              本周
            </button>
          </div>

          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#F97316] focus:outline-none"
          >
            <option value="">全部教师</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#F97316] focus:outline-none"
          >
            <option value="">全部教室</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-orange-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-orange-50">
                <th className="border-b border-orange-100 px-3 py-2.5 text-left font-medium text-gray-600 w-20">
                  时间
                </th>
                {DAYS.map((day, i) => (
                  <th
                    key={day}
                    className="border-b border-orange-100 px-2 py-2.5 text-center font-medium text-gray-600"
                  >
                    <div>{day}</div>
                    <div className="text-xs text-gray-400">{fmtDate(weekDates[i])}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((time) => (
                <tr key={time} className="border-b border-gray-50 hover:bg-orange-50/30">
                  <td className="px-3 py-2 text-xs font-medium text-gray-500">{time}</td>
                  {weekDates.map((date) => {
                    const sch = getScheduleForCell(date, time)
                    return (
                      <td key={`${date}-${time}`} className="px-1.5 py-1.5">
                        {sch ? (
                          <div className="rounded-lg bg-orange-50 border border-orange-200 p-2">
                            <div className="font-medium text-gray-800 text-xs truncate">
                              {getCourseName(sch.courseId)}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {getTeacherName(sch.teacherId)} · {getClassroomName(sch.classroomId)}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <div className="h-1.5 flex-1 rounded-full bg-orange-200 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#F97316] transition-all"
                                  style={{
                                    width: `${Math.min(100, (sch.bookedCount / sch.maxCapacity) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                {sch.bookedCount}/{sch.maxCapacity}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-14" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">新增排班</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">课程</label>
                <select
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none"
                >
                  <option value="">选择课程</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">教师</label>
                <select
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none"
                >
                  <option value="">选择教师</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">教室</label>
                <select
                  value={formClassroom}
                  onChange={(e) => setFormClassroom(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none"
                >
                  <option value="">选择教室</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}（容量 {c.capacity}）
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">日期</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">开始时间</label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">结束时间</label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none"
                  />
                </div>
              </div>

              {formClassroom && (
                <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-gray-600">
                  最大容量自动填充：<span className="font-semibold text-[#F97316]">{classrooms.find((c) => c.id === formClassroom)?.capacity ?? '-'}</span> 人
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                确认排班
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
