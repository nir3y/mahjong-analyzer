import { useState } from 'react'

/** 화료/유국 결과 모달 (복기 모드 포함) */
export default function WinModal({ winData, phase, onNewGame, gameHistory = [], settings = {} }) {
  const [showReplay, setShowReplay] = useState(false)

  if (!winData) return null

  const isHumanWin = winData.is_human_win
  const isDraw     = phase === 'draw_game'

  // 잘못된 선택 항목만 필터 (복기 대상)
  const badMoves = gameHistory.filter(h => !h.was_optimal)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-8 mx-4 shadow-2xl ${
        showReplay ? 'max-w-lg w-full' : 'max-w-sm w-full'
      }`}>

        {!showReplay ? (
          /* ── 결과 화면 ── */
          <>
            {isDraw ? (
              <>
                <div className="text-4xl mb-3 text-center">🀄</div>
                <h2 className="text-2xl font-bold text-slate-200 mb-2 text-center">유국</h2>
                <p className="text-slate-400 text-sm mb-2 text-center">패산이 소진되었습니다</p>
                {winData.tenpaiPlayers?.length > 0 && (
                  <p className="text-slate-300 text-sm text-center">
                    텐파이: {winData.tenpaiPlayers.map(i => i === 0 ? '나' : `AI ${i}`).join(', ')}
                  </p>
                )}
              </>
            ) : isHumanWin ? (
              <div className="text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h2 className="text-2xl font-bold text-indigo-300 mb-2">화료!</h2>
                <p className="text-slate-400 text-sm mb-3">
                  {winData.win_type === 'tsumo' ? '쯔모' : '론'} 화료
                </p>
                {winData.yaku?.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                    {winData.yaku.map(y => (
                      <span key={y} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                        {y}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-2xl font-bold text-amber-400">
                  {winData.score?.toLocaleString()}점
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-3">😔</div>
                <h2 className="text-2xl font-bold text-rose-400 mb-2">AI 화료</h2>
                <p className="text-slate-400 text-sm">이번엔 아쉽게 졌습니다</p>
              </div>
            )}

            {/* 통계 요약 */}
            {gameHistory.length > 0 && (
              <div className="mt-4 p-3 bg-slate-700/40 rounded-xl border border-slate-600/40 text-center">
                <p className="text-xs text-slate-400">
                  총 <span className="font-bold text-slate-200">{gameHistory.length}</span>번 버림 중
                  {badMoves.length === 0 ? (
                    <span className="text-emerald-400 font-bold"> 실수 없음 🎉</span>
                  ) : (
                    <>
                      <span className="text-rose-400 font-bold"> {badMoves.length}번</span> 비효율 선택
                    </>
                  )}
                </p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex flex-col gap-2 mt-5">
              {settings.replayMode && badMoves.length > 0 && (
                <button
                  onClick={() => setShowReplay(true)}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-colors border border-slate-600"
                >
                  ⏪ 복기 보기 ({badMoves.length}개 아쉬운 선택)
                </button>
              )}
              <button
                onClick={onNewGame}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                새 게임 시작
              </button>
            </div>
          </>
        ) : (
          /* ── 복기 화면 ── */
          <ReplayView
            badMoves={badMoves}
            totalTurns={gameHistory.length}
            onBack={() => setShowReplay(false)}
            onNewGame={onNewGame}
          />
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────
   복기 뷰
───────────────────────────────────── */
function ReplayView({ badMoves, totalTurns, onBack, onNewGame }) {
  const [current, setCurrent] = useState(0)
  const move = badMoves[current]

  const impactLabel = (move) => {
    const sd = move.shanten_chosen - move.shanten_best
    const ed = move.effective_best - move.effective_chosen
    if (sd > 0) return { text: `화료 ${sd}단계 더 멀어짐`, color: 'text-rose-400' }
    if (ed >= 4) return { text: `유효패 ${ed}종 손실`, color: 'text-rose-400' }
    if (ed >= 2) return { text: `유효패 ${ed}종 차이`, color: 'text-amber-400' }
    return { text: '소폭 비효율', color: 'text-yellow-400' }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-200">⏪ 복기 분석</h3>
          <p className="text-xs text-slate-500">
            총 {totalTurns}번 버림 중 아쉬운 선택 {badMoves.length}개
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
        >
          ← 결과
        </button>
      </div>

      {/* 내비게이션 */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-3 py-1 bg-slate-700 rounded disabled:opacity-30"
        >
          ◀ 이전
        </button>
        <span>{current + 1} / {badMoves.length}</span>
        <button
          onClick={() => setCurrent(c => Math.min(badMoves.length - 1, c + 1))}
          disabled={current === badMoves.length - 1}
          className="px-3 py-1 bg-slate-700 rounded disabled:opacity-30"
        >
          다음 ▶
        </button>
      </div>

      {/* 선택 상세 */}
      {move && (
        <div className="rounded-xl border border-slate-600/50 bg-slate-700/40 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{move.turn}순</span>
            <span className={`text-xs font-bold ${impactLabel(move).color}`}>
              {impactLabel(move).text}
            </span>
          </div>

          {/* 내가 버린 패 vs AI 추천 */}
          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-lg p-3 bg-rose-950/50 border border-rose-800/40 text-center">
              <p className="text-[10px] text-slate-500 mb-1">내가 버린 패</p>
              <p className="text-lg font-bold text-rose-300">{move.chosen_discard_name}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {formatShantenShort(move.shanten_chosen)} · 유효패 {move.effective_chosen}종
              </p>
            </div>
            <div className="flex items-center text-slate-600 text-sm">→</div>
            <div className="flex-1 rounded-lg p-3 bg-emerald-950/50 border border-emerald-800/40 text-center">
              <p className="text-[10px] text-slate-500 mb-1">AI 추천</p>
              <p className="text-lg font-bold text-emerald-300">{move.best_discard_name}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {formatShantenShort(move.shanten_best)} · 유효패 {move.effective_best}종
              </p>
            </div>
          </div>

          {/* 그때 손패 */}
          {move.hand_before_names?.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-600 mb-1">그때 손패</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {move.hand_before_names.join(' · ')}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNewGame}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
      >
        새 게임 시작
      </button>
    </div>
  )
}

function formatShantenShort(n) {
  if (n < 0) return '화료'
  if (n === 0) return '텐파이'
  return `${n}샨텐`
}
