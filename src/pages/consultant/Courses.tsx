import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, X } from 'lucide-react'
import { useCourseStore } from '@/stores/courseStore'
import type { Course, CourseAgeRange, CourseTag } from '@/types'

const PRESET_COLORS = ['#F97316', '#10B981', '#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B', '#06B6D4', '#84CC16']

interface CourseForm {
  name: string
  durationMinutes: number
  description: string
  ageRanges: { minMonths: number; maxMonths: number }[]
  tags: { name: string; color: string }[]
}

const emptyForm: CourseForm = {
  name: '',
  durationMinutes: 45,
  description: '',
  ageRanges: [{ minMonths: 6, maxMonths: 12 }],
  tags: [],
}

export default function Courses() {
  const { courses, addCourse, updateCourse, deleteCourse } = useCourseStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (c: Course) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      durationMinutes: c.durationMinutes,
      description: c.description,
      ageRanges: c.ageRanges.map((ar) => ({ minMonths: ar.minMonths, maxMonths: ar.maxMonths })),
      tags: c.tags.map((t) => ({ name: t.name, color: t.color })),
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    const id = editingId || `c${Date.now()}`
    const ageRanges: CourseAgeRange[] = form.ageRanges.map((ar, i) => ({
      id: `${id}_ar${i}`,
      courseId: id,
      minMonths: ar.minMonths,
      maxMonths: ar.maxMonths,
      label: `${ar.minMonths}-${ar.maxMonths}月`,
    }))
    const tags: CourseTag[] = form.tags.map((t, i) => ({
      id: `${id}_t${i}`,
      courseId: id,
      name: t.name,
      color: t.color,
    }))
    const course: Course = {
      id,
      name: form.name,
      durationMinutes: form.durationMinutes,
      description: form.description,
      ageRanges,
      tags,
    }
    if (editingId) {
      updateCourse(editingId, course)
    } else {
      addCourse(course)
    }
    setShowModal(false)
  }

  const handleAddTag = () => {
    if (!newTagName.trim()) return
    setForm((f) => ({ ...f, tags: [...f.tags, { name: newTagName, color: newTagColor }] }))
    setNewTagName('')
  }

  const handleRemoveTag = (idx: number) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((_, i) => i !== idx) }))
  }

  const handleAddAgeRange = () => {
    setForm((f) => ({ ...f, ageRanges: [...f.ageRanges, { minMonths: 6, maxMonths: 12 }] }))
  }

  const handleRemoveAgeRange = (idx: number) => {
    setForm((f) => ({ ...f, ageRanges: f.ageRanges.filter((_, i) => i !== idx) }))
  }

  const handleAgeRangeChange = (idx: number, field: 'minMonths' | 'maxMonths', val: number) => {
    setForm((f) => ({
      ...f,
      ageRanges: f.ageRanges.map((ar, i) => (i === idx ? { ...ar, [field]: val } : ar)),
    }))
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">课程管理</h1>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            新增课程
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(course)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-[#F97316] transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(course.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
                <Clock size={14} className="text-[#F97316]" />
                <span>{course.durationMinutes}分钟</span>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {course.ageRanges.map((ar) => (
                  <span
                    key={ar.id}
                    className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-[#F97316]"
                  >
                    {ar.label}
                  </span>
                ))}
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-gray-500">{course.description}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? '编辑课程' : '新增课程'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">课程名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  placeholder="输入课程名称"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">时长（分钟）</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">课程描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  placeholder="输入课程描述"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">适龄范围</label>
                  <button
                    onClick={handleAddAgeRange}
                    className="text-xs text-[#F97316] hover:underline"
                  >
                    + 添加范围
                  </button>
                </div>
                <div className="space-y-2">
                  {form.ageRanges.map((ar, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={ar.minMonths}
                        onChange={(e) => handleAgeRangeChange(i, 'minMonths', Number(e.target.value))}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-[#F97316] focus:outline-none"
                        placeholder="最小月龄"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        value={ar.maxMonths}
                        onChange={(e) => handleAgeRangeChange(i, 'maxMonths', Number(e.target.value))}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-[#F97316] focus:outline-none"
                        placeholder="最大月龄"
                      />
                      <span className="text-sm text-gray-500">月</span>
                      {form.ageRanges.length > 1 && (
                        <button onClick={() => handleRemoveAgeRange(i)} className="text-gray-400 hover:text-red-500">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">能力标签</label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                      <button onClick={() => handleRemoveTag(i)} className="hover:opacity-70">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-[#F97316] focus:outline-none"
                    placeholder="标签名称"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewTagColor(c)}
                        className={`h-5 w-5 rounded-full border-2 ${newTagColor === c ? 'border-gray-800' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleAddTag}
                    className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs text-white hover:bg-orange-600"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-800">确认删除</h3>
            <p className="mb-5 text-sm text-gray-500">确定要删除该课程吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deleteCourse(deleteConfirm)
                  setDeleteConfirm(null)
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
