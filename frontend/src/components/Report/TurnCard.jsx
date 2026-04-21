import TileDisplay from '../Tile/TileDisplay'
import VerdictBadge from '../Common/VerdictBadge'
import YakuTag from '../Common/YakuTag'
import { getTileColor } from '../Tile/TileDisplay'

function getVerdict(moment) {
  if (!moment.better_discard || moment.actual_discard === moment.better_discard) return 'correct'
  if (moment.diff_score >= 4) return 'mistake'
  return 'warning'
}

const borderColor = {
  correct: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  mistake: 'border-l-rose-500',
}

export default function TurnCard({ moment, index }) {
  const verdict = getVerdict(moment)

  return (
    <div className={`border-l-4 ${borderColor[verdict]} bg-slate-800/40 rounded-r-xl p-5 space-y-4`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            핵심 순간 #{index + 1}
          </span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">{moment.turn}순</span>
        </div>
        <VerdictBadge verdict={verdict} />
      </div>

      {/* 손패 표시 */}
      {moment.hand_before?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1.5">버림 직전 손패</p>
          <TileDisplay
            tiles={moment.hand_before}
            discardedTile={moment.actual_discard}
            betterTile={verdict !== 'correct' ? moment.better_discard : undefined}
          />
        </div>
      )}

      {/* 선택 비교 */}
      {verdict !== 'correct' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-center">
            <p className="text-xs text-rose-400/70 mb-1">실제 선택</p>
            <p className={`text-lg font-bold font-mono ${getTileColor(moment.actual_discard)}`}>
              {moment.actual_discard}
            </p>
            <p className="text-xs text-slate-500 mt-1">유효패 {moment.actual_effective_count}장</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <p className="text-xs text-emerald-400/70 mb-1">더 나은 선택</p>
            <p className={`text-lg font-bold font-mono ${getTileColor(moment.better_discard)}`}>
              {moment.better_discard}
            </p>
            <p className="text-xs text-slate-500 mt-1">유효패 {moment.better_effective_count}장</p>
          </div>
        </div>
      )}

      {/* 역 & 타점 */}
      {moment.possible_yaku?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">가능했던 역</span>
          {moment.possible_yaku.map(y => <YakuTag key={y} name={y} />)}
          {moment.expected_score_range && (
            <span className="text-xs font-semibold text-amber-400 ml-1">
              {moment.expected_score_range}점
            </span>
          )}
        </div>
      )}

      {/* AI 설명 */}
      {moment.explanation && (
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700/30">
          <p className="text-xs text-slate-500 mb-2">AI 코치</p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {moment.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
