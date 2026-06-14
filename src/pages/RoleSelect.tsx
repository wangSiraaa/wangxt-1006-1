import { useNavigate } from 'react-router-dom'
import { Users, Baby, UserCheck } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { Role } from '@/types'

const roles: { key: Role; title: string; desc: string; icon: React.ReactNode; path: string }[] = [
  {
    key: 'consultant',
    title: '顾问',
    desc: '管理课程、排班、候补与转正漏斗',
    icon: <Users className="w-10 h-10" />,
    path: '/consultant',
  },
  {
    key: 'parent',
    title: '家长',
    desc: '预约试听课程，查看我的预约',
    icon: <Baby className="w-10 h-10" />,
    path: '/parent',
  },
  {
    key: 'teacher',
    title: '老师',
    desc: '查看试听名册，撰写体验报告',
    icon: <UserCheck className="w-10 h-10" />,
    path: '/teacher',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const setRole = useAppStore((s) => s.setRole)

  const handleSelect = (role: Role, path: string) => {
    setRole(role)
    navigate(path)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#FFFBF5', fontFamily: '"Noto Sans SC", sans-serif' }}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-2">早教试听预约</h1>
      <p className="text-gray-500 mb-10">请选择您的角色</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => handleSelect(r.key, r.path)}
            className="group flex flex-col items-center gap-4 rounded-xl bg-white border border-orange-100 p-8 shadow-sm
                       hover:shadow-lg hover:-translate-y-1 hover:border-orange-300
                       transition-all duration-300 cursor-pointer"
          >
            <span className="text-orange-500 group-hover:text-orange-600 transition-colors">
              {r.icon}
            </span>
            <span className="text-xl font-semibold text-gray-800">{r.title}</span>
            <span className="text-sm text-gray-400 text-center leading-relaxed">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
