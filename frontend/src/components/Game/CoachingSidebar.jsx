/** 실시간 코칭 사이드바 */
export default function CoachingSidebar({
  shantenOptions = [],
  bestDiscardRaw,
  selectedTileRaw,
  coaching,
  yakuHints = [],
  canTsumo,
  canRon,
  onTsumo,
  onRon,
  tilesRemaining = 0,
  settings = {},
}) {
  const currentShanten = shantenOptions.length > 0 ? shantenOptions[0].shanten : null
  const { label: shantenLabel, sub: shantenSub, color: shantenColor } = describShanten(currentShanten)

  // 선택된 패와 추천 패의 옵션 데이터
  // ★ 버그 수정: 같은 종류(type)의 패는 같은 옵션으로 취급 (discard_raw/4 비교)
  const tileType = selectedTileRaw != null ? Math.floor(selectedTileRaw / 4) : -1
  const bestOption     = shantenOptions.find(o => o.discard_raw === bestDiscardRaw) ?? shantenOptions[0]
  const selectedOption = selectedTileRaw != null
    ? shantenOptions.find(o => Math.floor(o.discard_raw / 4) === tileType)
    : null

  // 선택 패 == 추천 패면 칭찬 모드
  const isGoodChoice = selectedOption && bestOption && selectedOption.discard_raw === bestOption.discard_raw

  return (
    <div className="flex flex-col gap-3">

      {/* 쯔모 / 론 선언 버튼 */}
      {(canTsumo || canRon) && (
        <div className="flex flex-col gap-1.5">
          {canTsumo && (
            <button onClick={onTsumo}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg animate-pulse">
              🏆 쯔모 화료
            </button>
          )}
          {canRon && (
            <button onClick={onRon}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg animate-pulse">
              ⚡ 론 화료
            </button>
          )}
        </div>
      )}

      {/* ══ 패 선택 시: 실시간 비교 패널 ══ */}
      {selectedOption && bestOption ? (
        isGoodChoice ? (
          /* ── 추천과 동일한 패를 선택했을 때 ── */
          <GoodChoiceCard option={selectedOption} />
        ) : (
          /* ── 추천과 다른 패를 선택했을 때 ── */
          <CompareCard selected={selectedOption} best={bestOption} />
        )
      ) : (
        /* ── 아무것도 선택하지 않았을 때 ── */
        <>
          {/* 현재 손패 상태 */}
          <div className={`rounded-xl p-3 border ${shantenColor.bg}`}>
            <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">현재 손패 상태</p>
            <p className={`text-xl font-bold ${shantenColor.text}`}>{shantenLabel}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{shantenSub}</p>
            {bestOption && currentShanten >= 0 && (
              <p className="text-xs text-slate-500 mt-1">
                AI 추천 버림패: <span className="font-bold" style={{ color: getTileTextColor(bestOption.discard_raw) }}>{bestOption.discard_name}</span>
              </p>
            )}
          </div>

          {/* 화료 확률 바 */}
          {settings.winProbability && shantenOptions.length > 0 && (
            <WinProbabilityBar
              shanten={shantenOptions[0]?.shanten ?? null}
              effectiveCount={shantenOptions[0]?.effective_count ?? 0}
              tilesRemaining={tilesRemaining}
            />
          )}

          {/* 버림패별 목록 */}
          {shantenOptions.length > 0 && (
            <DiscardOptionList shantenOptions={shantenOptions} bestDiscardRaw={bestDiscardRaw} />
          )}

          {/* 기존 코칭 메시지 */}
          {coaching && <CoachingCard coaching={coaching} />}

          {/* 족보 힌트 */}
          {settings.yakuPath !== false && yakuHints.length > 0 && <YakuHints hints={yakuHints} />}

          {!coaching && shantenOptions.length === 0 && (
            <p className="text-center text-slate-700 text-xs py-8 leading-loose">
              패를 뽑으면<br />분석이 표시됩니다
            </p>
          )}
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   선택 패 == 추천 패: 칭찬 카드
═══════════════════════════════════════ */
function GoodChoiceCard({ option }) {
  return (
    <div className="rounded-xl p-4 border border-emerald-700/50 bg-emerald-950/40">
      <p className="text-emerald-400 font-bold text-base mb-1">✅ 좋은 선택이에요!</p>
      <p className="text-slate-300 text-sm mb-3">
        <span className="font-bold" style={{ color: getTileTextColor(option.discard_raw) }}>{option.discard_name}</span>을 버리는 것이 지금 최선입니다.
      </p>
      <OptionDetail option={option} highlight />
    </div>
  )
}

/* ═══════════════════════════════════════
   선택 패 ≠ 추천 패: 비교 카드
═══════════════════════════════════════ */
function CompareCard({ selected, best }) {
  const shantenDiff  = selected.shanten - best.shanten          // 양수 = selected가 나쁨
  const effectiveDiff = best.effective_count - selected.effective_count  // 양수 = best가 더 많음

  return (
    <div className="flex flex-col gap-2">
      {/* 헤더 */}
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">패별 상세 비교</p>

      {/* 내가 고른 패 */}
      <div className="rounded-xl p-3 border border-rose-800/50 bg-rose-950/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold" style={{ color: getTileTextColor(selected.discard_raw) }}>
            {selected.discard_name}
          </span>
          <span className="text-xs text-slate-400">내가 고른 패</span>
        </div>
        <OptionDetail option={selected} />
      </div>

      {/* vs 구분 */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 shrink-0">vs</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      {/* AI 추천 패 */}
      <div className="rounded-xl p-3 border border-emerald-700/50 bg-emerald-950/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold" style={{ color: getTileTextColor(best.discard_raw) }}>
            {best.discard_name}
          </span>
          <span className="text-xs text-emerald-400 font-semibold">★ AI 추천</span>
        </div>
        <OptionDetail option={best} highlight />
      </div>

      {/* 왜 다른지 설명 */}
      <WhyBetter selected={selected} best={best} shantenDiff={shantenDiff} effectiveDiff={effectiveDiff} />
    </div>
  )
}

/* ═══════════════════════════════════════
   단일 패 상세 정보
═══════════════════════════════════════ */
function OptionDetail({ option, highlight = false }) {
  const { label: sLabel } = describShanten(option.shanten)
  const textAccent = highlight ? 'text-emerald-300' : 'text-slate-300'

  return (
    <div className="flex flex-col gap-1.5">
      {/* 버린 후 상태 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">버린 후 상태</span>
        <span className={`font-semibold ${option.tenpai ? 'text-emerald-400' : textAccent}`}>{sLabel}</span>
      </div>

      {/* 유효패 수 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">다음에 도움 되는 패</span>
        <span className={`font-semibold ${textAccent}`}>{option.effective_count}종류</span>
      </div>

      {/* 유효패 목록 */}
      {option.effective_tiles?.length > 0 && (
        <div className="mt-1">
          <p className="text-[10px] text-slate-600 mb-1">어떤 패를 뽑으면 좋아지나요?</p>
          <div className="flex flex-wrap gap-1">
            {option.effective_tiles.map((name) => (
              <span
                key={name}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                style={{
                  color: getNameTextColor(name),
                  borderColor: getNameTextColor(name) + '55',
                  backgroundColor: getNameTextColor(name) + '15',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {option.tenpai && option.effective_tiles?.length > 0 && (
        <p className="text-[10px] text-emerald-600 mt-0.5">
          위 패 중 하나를 뽑으면 화료입니다!
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   왜 추천 패가 더 좋은지 설명
═══════════════════════════════════════ */
function WhyBetter({ selected, best, shantenDiff, effectiveDiff }) {
  const reasons = []

  // ── 샨텐 차이 ──
  if (shantenDiff > 0) {
    reasons.push({
      icon: '📉',
      text: `${best.discard_name}을 버리면 화료까지 ${shantenDiff}단계 더 가까워집니다.`
    })
  }

  // ── 텐파이 직행 ──
  if (best.tenpai && !selected.tenpai) {
    reasons.push({
      icon: '🔥',
      text: `${best.discard_name}을 버리면 바로 텐파이(다음 한 장으로 화료 가능)! ${selected.discard_name}은 아직 텐파이가 아닙니다.`
    })
  }

  // ── 유효패 수 차이 ──
  if (effectiveDiff > 0) {
    reasons.push({
      icon: '🎯',
      text: `도움 되는 패가 ${effectiveDiff}종류 더 많아서 다음에 좋은 패를 뽑을 확률이 높습니다.`
    })
  }

  // ── 샨텐·유효패 동일 → 고립도(패의 유연성) 차이 설명 ──
  if (shantenDiff === 0 && effectiveDiff === 0) {
    const selIso  = getIsolationLevel(selected.discard_raw)
    const bestIso = getIsolationLevel(best.discard_raw)

    if (selIso.score < bestIso.score) {
      // 내가 고른 패가 더 고립도 높음 → 내 선택이 더 나쁜 이유 설명
      reasons.push({
        icon: '🧩',
        text: `${selected.discard_name}은 ${selIso.reason} 반면, ${best.discard_name}은 ${bestIso.reason} 두 패의 효율 수치는 같지만, 더 고립된 패를 먼저 버리는 것이 정석입니다.`
      })
    } else if (selIso.score === bestIso.score) {
      // 진짜 동률 — 어느 쪽을 버려도 거의 같음
      reasons.push({
        icon: '⚖️',
        text: `${selected.discard_name}과 ${best.discard_name}은 현재 효율상 거의 차이가 없습니다. 어느 쪽을 버려도 결과는 비슷합니다.`
      })
    }
  }

  if (reasons.length === 0) {
    reasons.push({
      icon: '♟️',
      text: `${selected.discard_name}도 나쁘지 않지만, ${best.discard_name}을 버리는 쪽이 전체적으로 조금 더 유리합니다.`
    })
  }

  return (
    <div className="rounded-xl p-3 border border-slate-700/50 bg-slate-800/40">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
        왜 <span className="font-bold" style={{ color: getTileTextColor(best.discard_raw) }}>{best.discard_name}</span>이 추천인가요?
      </p>
      <div className="flex flex-col gap-2">
        {reasons.map((r, i) => (
          <div key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
            <span className="shrink-0 mt-0.5">{r.icon}</span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      {/* 고립도 비교 표 — 동률일 때만 표시 */}
      {shantenDiff === 0 && effectiveDiff === 0 && (
        <IsolationCompare selected={selected} best={best} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   전체 버림패 목록
═══════════════════════════════════════ */
function DiscardOptionList({ shantenOptions, bestDiscardRaw }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
      <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">패 클릭 시 상세 분석 ↑</p>
      <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
        {shantenOptions.slice(0, 14).map((opt) => {
          const isBest = opt.discard_raw === bestDiscardRaw
          const { label: dLabel } = describShanten(opt.shanten)
          return (
            <div
              key={opt.discard_raw}
              className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                isBest ? 'bg-emerald-900/50 border border-emerald-700/40' : 'bg-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-[52px]">
                {isBest && <span className="text-emerald-400 text-[10px]">★</span>}
                <span className="font-bold" style={{ color: getTileTextColor(opt.discard_raw) }}>
                  {opt.discard_name}
                </span>
                {isBest && <span className="text-emerald-500 text-[9px]">추천</span>}
              </div>
              <div className="text-right">
                <span className={`block font-medium ${opt.tenpai ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {dLabel}
                </span>
                <span className="text-[10px] text-slate-500">유효패 {opt.effective_count}종</span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-slate-600 mt-2">★ = 화료에 가장 가까운 선택</p>
    </div>
  )
}

/* ═══════════════════════════════════════
   기존 버림 후 코칭 메시지
═══════════════════════════════════════ */
function CoachingCard({ coaching }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
      <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">🎓 직전 버림패 분석</p>
      <div className="flex items-stretch gap-1.5 mb-2.5">
        <div className="flex-1 text-center py-1.5 px-1 rounded-lg bg-rose-950/50 border border-rose-800/40">
          <p className="text-[9px] text-slate-500 mb-0.5">내가 버린 패</p>
          <p className="text-sm font-bold text-rose-300">{coaching.yourDiscardName}</p>
          <p className="text-[10px] text-slate-500">{describShanten(coaching.shantenYour).label}</p>
        </div>
        <div className="flex items-center text-slate-600 text-xs">→</div>
        <div className="flex-1 text-center py-1.5 px-1 rounded-lg bg-emerald-950/50 border border-emerald-800/40">
          <p className="text-[9px] text-slate-500 mb-0.5">더 좋은 선택</p>
          <p className="text-sm font-bold text-emerald-300">{coaching.bestDiscardName}</p>
          <p className="text-[10px] text-slate-500">{describShanten(coaching.shantenBest).label}</p>
        </div>
      </div>
      {coaching.llmMessage ? (
        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{coaching.llmMessage}</p>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
          <span className="animate-spin">⏳</span>
          <span>코칭 분석 중...</span>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   족보 힌트 패널
═══════════════════════════════════════ */
function YakuHints({ hints }) {
  const statusConfig = {
    secured:  { bg: 'bg-emerald-950/50', border: 'border-emerald-700/50', badge: 'bg-emerald-700/60 text-emerald-200', badgeText: '확정' },
    possible: { bg: 'bg-amber-950/30',   border: 'border-amber-700/40',   badge: 'bg-amber-700/50 text-amber-200',   badgeText: '가능' },
    building: { bg: 'bg-slate-800/50',   border: 'border-slate-700/40',   badge: 'bg-slate-700/60 text-slate-300',   badgeText: '진행 중' },
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">🀄 노릴 수 있는 족보</p>
      {hints.map((hint, i) => {
        const cfg = statusConfig[hint.status] ?? statusConfig.building
        return (
          <div key={i} className={`rounded-xl p-2.5 border ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{hint.icon}</span>
                <span className="text-sm font-bold text-slate-200">{hint.name}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
                {cfg.badgeText}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{hint.desc}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════
   고립도 비교 표 (동률 케이스용)
═══════════════════════════════════════ */
function IsolationCompare({ selected, best }) {
  const selIso  = getIsolationLevel(selected.discard_raw)
  const bestIso = getIsolationLevel(best.discard_raw)

  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-700/50">
      <p className="text-[10px] text-slate-500 mb-2">패의 유연성 비교</p>
      <div className="flex gap-2">
        <TileIsolationCard
          name={selected.discard_name}
          rawTile={selected.discard_raw}
          iso={selIso}
          isMine
        />
        <TileIsolationCard
          name={best.discard_name}
          rawTile={best.discard_raw}
          iso={bestIso}
          isRecommended
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
        💡 유연성이 낮은 패일수록 먼저 버리는 것이 마작 기본 원칙입니다.
      </p>
    </div>
  )
}

function TileIsolationCard({ name, rawTile, iso, isMine, isRecommended }) {
  const borderColor = isMine ? 'border-rose-800/50' : 'border-emerald-800/50'
  const bgColor     = isMine ? 'bg-rose-950/30'     : 'bg-emerald-950/30'

  return (
    <div className={`flex-1 rounded-lg p-2 border ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs font-bold" style={{ color: getTileTextColor(rawTile) }}>{name}</span>
        {isRecommended && <span className="text-[9px] text-emerald-400">★추천</span>}
      </div>
      <p className="text-[10px] font-semibold" style={{ color: iso.color }}>{iso.label}</p>
      <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">{iso.short}</p>
    </div>
  )
}

/* ═══════════════════════════════════════
   화료 확률 바
═══════════════════════════════════════ */
function WinProbabilityBar({ shanten, effectiveCount, tilesRemaining }) {
  const prob = estimateWinProb(shanten, effectiveCount, tilesRemaining)
  const barColor =
    prob >= 60 ? '#22c55e' :
    prob >= 35 ? '#eab308' :
    prob >= 15 ? '#f97316' : '#ef4444'

  const probLabel =
    prob >= 70 ? '높음 🔥' :
    prob >= 40 ? '보통 🎯' :
    prob >= 15 ? '낮음 😅' : '매우 낮음 😰'

  return (
    <div className="rounded-xl p-3 border border-slate-700/50 bg-slate-800/40">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">📊 화료 예상 확률</p>
        <span className="text-xs font-bold" style={{ color: barColor }}>
          {prob}% — {probLabel}
        </span>
      </div>
      {/* 프로그레스 바 */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${prob}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5">
        유효패 {effectiveCount}종 · 패산 {tilesRemaining}장 남음 기준 추정치
      </p>
    </div>
  )
}

function estimateWinProb(shanten, effectiveCount, tilesRemaining) {
  if (shanten == null || shanten < 0) return 100
  if (tilesRemaining <= 0 || effectiveCount <= 0) return 0

  // 내 차례에 남은 드로우 수 (4인 게임, 약 1/4)
  const myDraws = Math.max(1, Math.floor(tilesRemaining / 4))
  // 패산 내 유효패 추정 (종류별 평균 2.5장 잔존)
  const effInWall = Math.min(effectiveCount * 2.5, tilesRemaining * 0.75)
  const pHitPerDraw = effInWall / tilesRemaining

  if (shanten === 0) {
    const pHit = 1 - Math.pow(Math.max(0, 1 - pHitPerDraw), myDraws)
    return Math.round(Math.min(94, Math.max(2, pHit * 100)))
  }
  if (shanten === 1) {
    // 1샨텐: 텐파이 도달 확률 × 텐파이에서 화료 확률
    const pTenpai = 1 - Math.pow(Math.max(0, 1 - pHitPerDraw), Math.ceil(myDraws / 2))
    const pWinFromTenpai = estimateWinProb(0, Math.floor(effectiveCount * 0.7), Math.floor(tilesRemaining * 0.65))
    return Math.round(Math.min(55, pTenpai * pWinFromTenpai * 0.01 * 100 * 0.6))
  }
  if (shanten === 2) {
    return Math.round(Math.min(25, estimateWinProb(1, effectiveCount, tilesRemaining) * 0.4))
  }
  return Math.max(1, Math.round(8 / shanten))
}

/* ─────────────────────────
   헬퍼 함수들
───────────────────────── */
function describShanten(n) {
  if (n === null || n === undefined) {
    return { label: '-', sub: '패를 받으면 분석됩니다', color: { text: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700/50' } }
  }
  if (n === -1) return {
    label: '화료!',
    sub: '패가 완성됐습니다 🎉',
    color: { text: 'text-indigo-300', bg: 'bg-indigo-950/40 border-indigo-700/40' }
  }
  if (n === 0) return {
    label: '텐파이 🎯',
    sub: '다음 한 장으로 화료 가능한 상태입니다',
    color: { text: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/40' }
  }
  if (n === 1) return {
    label: '아직 1장 부족',
    sub: '한 장만 더 받으면 텐파이(화료 직전)가 됩니다',
    color: { text: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-800/30' }
  }
  if (n === 2) return {
    label: '2장 더 필요',
    sub: '두 장을 더 받아야 텐파이가 됩니다',
    color: { text: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-800/30' }
  }
  return {
    label: `${n}장 더 필요`,
    sub: `앞으로 ${n}장을 받아야 텐파이가 됩니다. 빨리 패를 정리하세요!`,
    color: { text: 'text-slate-300', bg: 'bg-slate-800/60 border-slate-700/50' }
  }
}

function getTileTextColor(rawTile) {
  const type = Math.floor(rawTile / 4)
  if (type < 9)  return '#c53030'
  if (type < 18) return '#2b6cb0'
  if (type < 27) return '#276749'
  return '#b7791f'
}

function getNameTextColor(name) {
  if (name.endsWith('만')) return '#c53030'
  if (name.endsWith('통')) return '#2b6cb0'
  if (name.endsWith('삭')) return '#276749'
  return '#b7791f'
}

/**
 * 패의 고립도(유연성) 수준 반환
 * 마작 이론: 자패 > 노패(1·9) > 2·8 > 가운데(3-7) 순으로 고립도 높음
 */
function getIsolationLevel(rawTile) {
  const type = Math.floor(rawTile / 4)

  if (type >= 27) return {
    score: 0,
    label: '유연성 낮음 (자패)',
    short: '순쯔 불가. 같은 패 2장 더 필요',
    reason: '순쯔(연속패)를 만들 수 없어 같은 패 2장이 더 필요합니다.',
    color: '#f87171',
  }

  const num = type % 9  // 0-indexed
  if (num === 0 || num === 8) return {
    score: 1,
    label: '유연성 보통 (끝 수패)',
    short: '한쪽 방향만 연결 가능',
    reason: '한쪽 방향으로만 연결되어 유연성이 낮습니다.',
    color: '#fb923c',
  }

  if (num === 1 || num === 7) return {
    score: 2,
    label: '유연성 보통 (2·8)',
    short: '연결 가능하지만 제한적',
    reason: '연결은 가능하지만 가운데 패보다 제한적입니다.',
    color: '#facc15',
  }

  return {
    score: 3,
    label: '유연성 높음 (가운데 수패)',
    short: '양쪽 방향 모두 연결 가능',
    reason: '양쪽 방향으로 연결 가능해 가장 유연합니다.',
    color: '#4ade80',
  }
}
