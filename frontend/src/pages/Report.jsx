import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

function MomentCard({ moment, index }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          핵심 #{index + 1}
        </span>
        <span className="text-gray-400 text-sm">{moment.turn}순</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-950 border border-red-800 rounded-xl p-3 text-center">
          <div className="text-red-400 text-xs mb-1">실제 선택</div>
          <div className="text-xl font-bold">{moment.actual_discard}</div>
          <div className="text-gray-400 text-xs mt-1">
            유효패 {moment.actual_effective_count}장
          </div>
        </div>
        <div className="bg-green-950 border border-green-800 rounded-xl p-3 text-center">
          <div className="text-green-400 text-xs mb-1">더 나은 선택</div>
          <div className="text-xl font-bold">{moment.better_discard}</div>
          <div className="text-gray-400 text-xs mt-1">
            유효패 {moment.better_effective_count}장
          </div>
        </div>
      </div>

      {moment.possible_yaku?.length > 0 && (
        <div className="mb-3">
          <div className="text-gray-400 text-xs mb-1">가능했던 역</div>
          <div className="flex gap-2 flex-wrap">
            {moment.possible_yaku.map(yaku => (
              <span key={yaku} className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">
                {yaku}
              </span>
            ))}
          </div>
        </div>
      )}

      {moment.expected_score_range && (
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-1">예상 타점</div>
          <div className="text-yellow-400 font-semibold">{moment.expected_score_range}점</div>
        </div>
      )}

      {moment.explanation && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="text-gray-400 text-xs mb-2">AI 설명</div>
          <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
            {moment.explanation}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Report() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReport()
  }, [gameId])

  const fetchReport = async () => {
    try {
      const res = await api.get(`/reports/game/${gameId}`)
      setReport(res.data)
    } catch (e) {
      if (e.response?.status === 404) {
        setError('아직 분석이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setError('리포트를 불러오는 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">리포트 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <div className="text-gray-400">{error}</div>
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-300 underline">
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-2xl font-bold">📊 게임 리포트</h1>
        </div>

        {report.summary && (
          <div className="bg-gray-900 rounded-2xl p-6 mb-6">
            <div className="text-gray-400 text-sm mb-2">이번 판 총평</div>
            <div className="text-gray-100 leading-relaxed">{report.summary}</div>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-4">핵심 순간 분석</h2>

        {report.key_moments?.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center text-gray-400">
            이번 판은 큰 실수 없이 잘 플레이했습니다! 👍
          </div>
        ) : (
          <div className="space-y-4">
            {report.key_moments.map((moment, i) => (
              <MomentCard key={i} moment={moment} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
