import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

const RANK_BADGE = {
  1: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  2: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  3: 'bg-orange-900/30 text-orange-400 border border-orange-500/20',
  4: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
}

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />
      ))}
    </div>
  )
}

export default function GameList() {
  const { tenhouId } = useParams()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyzing, setAnalyzing] = useState({})

  useEffect(() => {
    fetchGames()
  }, [tenhouId])

  const fetchGames = async () => {
    try {
      const res = await api.get(`/games/${tenhouId}/list`)
      setGames(res.data.games)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.post(`/users/${tenhouId}/refresh`)
      await new Promise(r => setTimeout(r, 2000))
      await fetchGames()
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }

  const handleAnalyze = async (gameId) => {
    setAnalyzing(prev => ({ ...prev, [gameId]: true }))
    try {
      await api.post(`/games/${gameId}/analyze`)
      setTimeout(() => navigate(`/report/${gameId}`), 1500)
    } catch (e) {
      console.error(e)
      setAnalyzing(prev => ({ ...prev, [gameId]: false }))
    }
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">게임 목록</h1>
          <p className="mt-1 text-sm text-slate-400">{tenhouId}의 최근 게임</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <span className={refreshing ? 'animate-spin' : ''}>↻</span>
          {refreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </div>

      {loading ? (
        <Skeleton />
      ) : games.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-2">아직 감지된 게임이 없습니다.</p>
          <p className="text-slate-500 text-sm">천봉에서 게임을 플레이 후 새로고침하거나,<br />잠시 후 자동으로 나타납니다.</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-[1fr_80px_80px_120px] gap-4 px-5 py-3 border-b border-slate-700/50">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">날짜</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">순위</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">상태</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider text-right">액션</p>
          </div>

          {/* 게임 행 */}
          {games.map((game, i) => (
            <div
              key={game.game_id}
              className="grid grid-cols-[1fr_80px_80px_120px] gap-4 px-5 py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
            >
              <div>
                <p className="text-sm text-slate-200 font-medium">게임 #{i + 1}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {game.played_at ? new Date(game.played_at).toLocaleDateString('ko-KR') : '날짜 미상'}
                </p>
              </div>

              <div className="flex items-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${RANK_BADGE[1]}`}>
                  -위
                </span>
              </div>

              <div className="flex items-center">
                {game.has_report ? (
                  <span className="text-xs text-emerald-400">● 완료</span>
                ) : (
                  <span className="text-xs text-slate-500">○ 대기</span>
                )}
              </div>

              <div className="flex items-center justify-end">
                {game.has_report ? (
                  <button
                    onClick={() => navigate(`/report/${game.game_id}`)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    리포트 보기
                  </button>
                ) : (
                  <button
                    onClick={() => handleAnalyze(game.game_id)}
                    disabled={analyzing[game.game_id]}
                    className="text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {analyzing[game.game_id] ? '분석 중...' : '분석하기'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
