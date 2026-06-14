import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen,
  CalendarClock,
  ListOrdered,
  Funnel,
  Repeat,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const navItems = [
  { label: '课程管理', icon: BookOpen, path: '/consultant/courses' },
  { label: '排班管理', icon: CalendarClock, path: '/consultant/schedule' },
  { label: '候补队列', icon: ListOrdered, path: '/consultant/waitlist' },
  { label: '转正漏斗', icon: Funnel, path: '/consultant/funnel' },
  { label: '频次规则', icon: Repeat, path: '/consultant/rules' },
  { label: '操作审计', icon: FileText, path: '/consultant/audit' },
]

export default function ConsultantLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const clearRole = useAppStore((s) => s.clearRole)

  const handleBack = () => {
    clearRole()
    navigate('/')
  }

  return (
    <div className="flex h-screen" style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
      <aside className="w-64 bg-white border-r border-orange-100 flex flex-col shrink-0">
        <div className="p-6 border-b border-orange-50">
          <h1 className="text-lg font-bold text-gray-800">早教试听预约</h1>
          <span className="text-xs text-orange-500">顾问端</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer
                  ${
                    active
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-gray-600 hover:bg-orange-50/60 hover:text-orange-500'
                  }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-orange-50">
          <button
            onClick={handleBack}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            返回角色选择
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ background: '#FFFBF5' }}>
        <Outlet />
      </main>
    </div>
  )
}
