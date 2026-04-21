import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import TurnCard from '../components/Report/TurnCard'
import InsightCallout from '../components/Common/InsightCallout'

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-slate-800/60 rounded-xl" />
      <div className="h-48 bg-slate-800/60 rounded-xl" />
      <div className="h-48 bg-slate-800/60 rounded-xl" />
    </div>
  )
}

export default function Report() {
  const { gameId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/reports/game/${gameId}`)
      .then(res => setReport(res.data))
      .catch(e => {
        setError(e.response?.status === 404
          ? '아직 분석이 완료되지 않았습니다. 잠시 후 새로고침해주세요.'
          : '리포트를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [gameId])

  return (
    <div className="flex gap-8">
      {/* 메인 컬럼 */}
      <div className="flex-1 min-w-0">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100">복기 리포트</h1>
          <p className="mt-1 text-sm text-slate-400">게임 #{gameId} 분석 결과</p>
        </div>

        {loading && <Skeleton />}

        {error && (
          <InsightCallout variant="warning" title={error} />
        )}

        {report && (
          <div className="space-y-4">
            {report.key_moments?.length === 0 ? (
              <InsightCallout
                variant="success"
                title="이번 판은 큰 실수 없이 잘 플레이했습니다!"
                detail="주요 타패 결정에서 AI와 유사한 선택을 했습니다."
              />
            ) : (
              report.key_moments.map((moment, i) => (
                <TurnCard key={i} moment={moment} index={i} />
              ))
            )}
          </div>
        )}
      </div>

      {/* 사이드 요약 패널 */}
      <div className="w-72 shrink-0">
        <div className="sticky top-4 space-y-4">
          {report?.summary && (
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">AI 총평</p>
              <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {report && (
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">이번 판 요약</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">핵심 실수</span>
                  <span className="text-sm font-bold text-rose-400">
                    {report.key_moments?.length ?? 0}개
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">분석 순간</span>
                  <span className="text-sm font-bold text-slate-200">
                    {report.key_moments?.length ?? 0} / 3
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
