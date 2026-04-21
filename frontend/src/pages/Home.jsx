import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Home() {
  const [tenhouId, setTenhouId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleStart = async () => {
    if (!tenhouId.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/users/register', { tenhou_id: tenhouId.trim() })
      localStorage.setItem('tenhouId', tenhouId.trim())
      navigate(`/games/${tenhouId.trim()}`)
    } catch {
      setError('등록에 실패했습니다. 아이디를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* 배경 글로우 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg w-full text-center z-10">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">🀄</span>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">마작 복기 코치</h1>
            <p className="text-sm text-indigo-400 font-medium">AI-Powered Mahjong Review</p>
          </div>
        </div>

        <p className="text-slate-400 mb-10 leading-relaxed">
          천봉 리플레이를 자동으로 분석해서<br />
          <span className="text-slate-200">내가 놓친 고타점 루트</span>와
          <span className="text-slate-200"> 패 선택 이유</span>를<br />
          쉬운 말로 알려주는 복기 서비스
        </p>

        {/* 입력 폼 */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6 shadow-xl shadow-black/30">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">천봉 아이디로 시작하기</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={tenhouId}
              onChange={e => setTenhouId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="천봉 아이디 입력"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors text-sm"
            />
            <button
              onClick={handleStart}
              disabled={loading || !tenhouId.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? '...' : '시작'}
            </button>
          </div>
          {error && <p className="text-rose-400 mt-3 text-sm">{error}</p>}
        </div>

        {/* 기능 카드 3개 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <FeatureCard icon="📊" title="판 리포트" desc="핵심 실수 TOP 3 자동 분석" color="indigo" />
          <FeatureCard icon="📈" title="패턴 진단" desc="반복 약점 누적 분석" color="violet" />
          <FeatureCard icon="🔍" title="상황 분석" desc="스크린샷으로 즉시 질문" color="sky" />
        </div>

        <button
          onClick={() => navigate('/screenshot')}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors underline underline-offset-4"
        >
          아이디 없이 스크린샷만 분석하기 →
        </button>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }) {
  const border = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40',
    violet: 'border-violet-500/20 hover:border-violet-500/40',
    sky: 'border-sky-500/20 hover:border-sky-500/40',
  }[color]

  return (
    <div className={`bg-slate-900/60 border ${border} rounded-xl p-4 text-center transition-colors`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs font-semibold text-slate-200 mb-1">{title}</div>
      <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
    </div>
  )
}
