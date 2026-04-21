import { useParams, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const params = useParams()
  const location = useLocation()

  // URL에서 tenhouId 추출
  const tenhouId = params.tenhouId || localStorage.getItem('tenhouId') || null

  // 홈 화면(/)은 사이드바 없이 풀스크린
  const isHome = location.pathname === '/'
  if (isHome) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar tenhouId={tenhouId} />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
