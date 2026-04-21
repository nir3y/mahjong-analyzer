import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import StatCard from '../components/Stats/StatCard'
import InsightCallout from '../components/Common/InsightCallout'

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 bg-slate-800/60 rounded-xl" />
        <div className="h-28 bg-slate-800/60 rounded-xl" />
      </div>
      <div className="h-48 bg-slate-800/60 rounded-xl" />
    </div>
  )
}

export default function Pattern() {
  const { tenhouId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/reports/pattern/${tenhouId}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.detail || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [tenhouId])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">패턴 분석</h1>
        <p className="mt-1 text-sm text-slate-400">누적 데이터 기반 플레이 성향 진단</p>
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {data?.message && (
        <InsightCallout
          variant="info"
          title={data.message}
          detail="더 많은 게임을 분석하면 패턴 분석을 이용할 수 있습니다."
        />
      )}

      {data && !data.message && (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="분석된 판 수"
              value={data.game_count}
              unit="판"
              accentColor="indigo"
            />
            <StatCard
              label="판당 평균 실수"
              value={data.avg_mistakes_per_game}
              unit="개"
              accentColor={data.avg_mistakes_per_game > 2 ? 'rose' : 'emerald'}
            />
          </div>

          {/* 자주 하는 실수 */}
          {data.top_mistakes?.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">자주 하는 실수 유형</p>
              <div className="space-y-2">
                {data.top_mistakes.map(([type, count], i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 w-4">{i + 1}</span>
                      <span className="text-sm text-slate-200">{type}</span>
                    </div>
                    <span className="text-sm font-semibold text-rose-400">{count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 코치 */}
          {data.explanation && (
            <div className="bg-slate-800/60 border border-indigo-500/20 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">AI 코치 의견</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {data.explanation}
              </p>
            </div>
          )}

          {/* 인사이트 */}
          <div className="space-y-3">
            {data.avg_mistakes_per_game > 2 && (
              <InsightCallout
                variant="warning"
                title="타패 결정에 개선 여지가 있습니다"
                detail={`판당 평균 ${data.avg_mistakes_per_game}개의 개선 가능한 선택이 발견되었습니다.`}
              />
            )}
            {data.avg_mistakes_per_game <= 1 && (
              <InsightCallout
                variant="success"
                title="안정적인 플레이 패턴입니다"
                detail="대부분의 타패 결정이 AI와 일치하는 수준입니다."
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
