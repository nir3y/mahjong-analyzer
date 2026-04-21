import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import GameBoard from '../components/Game/GameBoard'
import { createGame } from '../api/gameApi'

export default function Game() {
  const [gameId, setGameId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const startNewGame = useCallback(async () => {
    setLoading(true)
    setError(null)
    setGameId(null)
    try {
      const { game_id } = await createGame()
      setGameId(game_id)
    } catch (e) {
      setError('게임 생성에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    startNewGame()
  }, [startNewGame])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🀄</div>
          <p className="text-slate-400 text-sm">게임을 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-rose-400 mb-4 text-sm">{error}</p>
          <button
            onClick={startNewGame}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => navigate('/')}
            className="ml-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return <GameBoard gameId={gameId} onNewGame={startNewGame} />
}
