import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Pattern() {
  const { tenhouId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/reports/pattern/${tenhouId}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tenhouId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">패턴 분석 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-2xl font-bold">📈 패턴 분석</h1>
        </div>

        {data?.message ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center text-gray-400">
            {data.message}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{data?.game_count}</div>
                <div className="text-gray-400 text-sm mt-1">분석된 판 수</div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{data?.avg_mistakes_per_game}</div>
                <div className="text-gray-400 text-sm mt-1">판당 평균 실수</div>
              </div>
            </div>

            {data?.top_mistakes?.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">자주 하는 실수</h2>
                <div className="space-y-2">
                  {data.top_mistakes.map(([type, count], i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-800 rounded-xl p-3">
                      <span className="text-sm">{type}</span>
                      <span className="text-red-400 text-sm font-semibold">{count}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data?.explanation && (
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-3">AI 코치 의견</h2>
                <div className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
                  {data.explanation}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
