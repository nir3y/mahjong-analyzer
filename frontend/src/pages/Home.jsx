import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Home() {
  const [tenhouId, setTenhouId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async () => {
    if (!tenhouId.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/users/register', { tenhou_id: tenhouId.trim() })
      navigate(`/games/${tenhouId.trim()}`)
    } catch (e) {
      setError('등록에 실패했습니다. 아이디를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-4">🀄</div>
        <h1 className="text-4xl font-bold mb-2">마작 복기 코치</h1>
        <p className="text-gray-400 mb-8 text-lg">
          내가 놓친 고타점 루트와 위험 신호를<br />
          쉬운 말로 알려주는 AI 복기 서비스
        </p>

        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl">
          <p className="text-gray-300 mb-4 text-sm">천봉 아이디를 등록하면 게임이 자동으로 분석됩니다</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={tenhouId}
              onChange={e => setTenhouId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder="천봉 아이디 입력"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleRegister}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? '...' : '시작'}
            </button>
          </div>
          {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold mb-1">판 리포트카드</div>
            <div className="text-gray-400">핵심 실수 TOP 3<br />자동 분석</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold mb-1">패턴 분석</div>
            <div className="text-gray-400">반복되는 약점<br />진단</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-semibold mb-1">상황 분석기</div>
            <div className="text-gray-400">스크린샷으로<br />즉시 분석</div>
          </div>
        </div>

        <button
          onClick={() => navigate('/screenshot')}
          className="mt-4 text-gray-400 hover:text-white text-sm underline transition-colors"
        >
          아이디 없이 스크린샷만 분석하기 →
        </button>
      </div>
    </div>
  )
}
