import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function GameList() {
  const { tenhouId } = useParams()
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchGames()
  }, [tenhouId])

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

  const handleAnalyze = async (gameId) => {
    setAnalyzing(prev => ({ ...prev, [gameId]: true }))
    try {
      await api.post(`/games/${gameId}/analyze`)
      setTimeout(() => {
        navigate(`/report/${gameId}`)
      }, 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(prev => ({ ...prev, [gameId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">게임 목록 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-2xl font-bold">🀄 {tenhouId}의 게임 목록</h1>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {refreshing ? '새로고침 중...' : '🔄 새로고침'}
          </button>
          <button
            onClick={() => navigate(`/pattern/${tenhouId}`)}
            className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            📈 패턴 분석 보기
          </button>
          <button
            onClick={() => navigate('/screenshot')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            🔍 스크린샷 분석
          </button>
        </div>

        {games.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center text-gray-400">
            <p>아직 감지된 게임이 없습니다.</p>
            <p className="text-sm mt-2">천봉에서 게임을 플레이하면 자동으로 나타납니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game, i) => (
              <div key={game.game_id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">게임 #{i + 1}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {game.played_at ? new Date(game.played_at).toLocaleDateString('ko-KR') : '날짜 미상'}
                  </div>
                </div>
                <div>
                  {game.has_report ? (
                    <button
                      onClick={() => navigate(`/report/${game.game_id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      리포트 보기
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAnalyze(game.game_id)}
                      disabled={analyzing[game.game_id]}
                      className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
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
    </div>
  )
}
