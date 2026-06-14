import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { CalendarCheck, ClipboardList, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const tabs = [
  { label: '预约试听', icon: CalendarCheck, path: '/parent/book' },
  { label: '我的预约', icon: ClipboardList, path: '/parent/status' },
]

export default function ParentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const clearRole = useAppStore((s) => s.clearRole)

  const handleBack = () => {
    clearRole()
    navigate('/')
  }

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))

  return (
    <div className="flex flex-col h-screen" style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
      <header className="h-14 bg-white border-b border-orange-100 flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-800">早教试听预约</h1>
          <span className="text-xs text-orange-500">家长端</span>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回角色选择
        </button>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ background: '#FFFBF5' }}>
        <Outlet />
      </main>

      <nav className="h-16 bg-white border-t border-orange-100 flex items-center justify-around shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab?.path === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors cursor-pointer
                ${isActive ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
