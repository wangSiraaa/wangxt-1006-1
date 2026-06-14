import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Users, FileBarChart, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const navItems = [
  { label: '试听名册', icon: Users, path: '/teacher/roster' },
  { label: '体验报告', icon: FileBarChart, path: '/teacher/report' },
]

export default function TeacherLayout() {
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
          <span className="text-xs text-orange-500">老师端</span>
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
