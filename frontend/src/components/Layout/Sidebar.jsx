import { NavLink, useParams } from 'react-router-dom'

const navItems = [
  { to: '/', label: '홈', icon: '⊞', exact: true },
]

export default function Sidebar({ tenhouId }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      {/* 로고 */}
      <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-800 shrink-0">
        <span className="text-xl">🀄</span>
        <span className="text-sm font-bold text-indigo-400 tracking-tight">마작 복기 코치</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-2 space-y-0.5">
          <p className="px-3 py-1 text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">메뉴</p>

          <SidebarItem to="/" icon="🏠" label="홈" end />

          {tenhouId && (
            <>
              <SidebarItem to={`/games/${tenhouId}`} icon="🎮" label="게임 목록" />
              <SidebarItem to={`/pattern/${tenhouId}`} icon="📈" label="패턴 분석" />
            </>
          )}

          <div className="my-3 border-t border-slate-800" />

          <SidebarItem to="/screenshot" icon="🔍" label="스크린샷 분석" />

          <div className="my-3 border-t border-slate-800" />
          <p className="px-3 py-1 text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">실전 게임</p>
          <SidebarItem to="/game" icon="🎮" label="AI와 대국" />
        </div>
      </nav>

      {/* 하단 아이디 표시 */}
      {tenhouId && (
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-xs text-slate-500">접속 중</p>
          <p className="text-sm font-medium text-slate-300 truncate">{tenhouId}</p>
        </div>
      )}
    </aside>
  )
}

function SidebarItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-indigo-500/15 text-indigo-300'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}
