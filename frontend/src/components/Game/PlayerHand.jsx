import { useState, useMemo } from 'react'
import TileButton from './TileButton'

/** raw ID 기준 패 정렬: 만→통→삭→자패, 번호 오름차순 */
function sortTiles(tiles) {
  return [...tiles].sort((a, b) => {
    const ta = Math.floor(a / 4)
    const tb = Math.floor(b / 4)
    return ta !== tb ? ta - tb : a - b
  })
}

/**
 * 위험도 점 계산: 상대 3명 버림패에 이 타입이 있는지 세기
 * opponentDiscards: discards 객체 { "1": [...], "2": [...], "3": [...] }
 */
function computeDangerDots(hand, opponentDiscards) {
  // 상대가 버린 타입 set (플레이어별)
  const opponentSafeTypes = [1, 2, 3].map(pid => {
    const s = new Set()
    ;(opponentDiscards?.[pid] || opponentDiscards?.[String(pid)] || [])
      .forEach(r => s.add(Math.floor(r / 4)))
    return s
  })

  const map = {}
  hand.forEach(raw => {
    const type = Math.floor(raw / 4)
    if (map[raw] !== undefined) return  // 중복 raw 스킵
    const safeCount = opponentSafeTypes.filter(s => s.has(type)).length
    if (safeCount >= 2)      map[raw] = 'safe'
    else if (safeCount === 1) map[raw] = 'warn'
    else                      map[raw] = 'risky'
  })
  return map
}

/**
 * 히트맵 색상 계산: shantenOptions 순위(0=최선) → 색상
 */
function getHeatColor(rank, total) {
  if (total <= 1) return null
  const ratio = rank / Math.max(1, total - 1)  // 0.0(최선) ~ 1.0(최악)
  if (ratio <= 0.2) return '#22c55e'  // 초록 (상위 20% — 버리기 좋음)
  if (ratio <= 0.4) return '#84cc16'  // 연초록
  if (ratio <= 0.6) return '#eab308'  // 노랑
  if (ratio <= 0.8) return '#f97316'  // 오렌지
  return '#ef4444'                    // 빨강 (하위 20% — 버리면 비추천)
}

export default function PlayerHand({
  hand,
  drawnTile,
  bestDiscardRaw,
  canRiichiSet = new Set(),
  onDiscard,
  onRiichi,
  onSelect,
  disabled,
  inRiichi,
  // 새 props (기능 설정)
  allDiscards = {},     // 전체 버림패 { "0": [], "1": [], "2": [], "3": [] }
  shantenOptions = [],  // 버림패 분석 옵션
  settings = {},        // { dangerTiles, tileHeatmap, ... }
}) {
  const [selectedRaw, setSelectedRaw] = useState(null)

  // drawnTile을 분리하고 나머지 13장 정렬
  const { mainHand, hasDrawn } = useMemo(() => {
    if (drawnTile === null || drawnTile === undefined) {
      return { mainHand: sortTiles(hand), hasDrawn: false }
    }
    let lastIdx = -1
    for (let i = hand.length - 1; i >= 0; i--) {
      if (hand[i] === drawnTile) { lastIdx = i; break }
    }
    if (lastIdx === -1) return { mainHand: sortTiles(hand), hasDrawn: false }
    const without = hand.filter((_, i) => i !== lastIdx)
    return { mainHand: sortTiles(without), hasDrawn: true }
  }, [hand, drawnTile])

  // ── 위험도 맵 (dangerTiles feature) ──
  const dangerMap = useMemo(() => {
    if (!settings.dangerTiles || disabled) return {}
    return computeDangerDots(hand, allDiscards)
  }, [hand, allDiscards, settings.dangerTiles, disabled])

  // ── 히트맵 맵: type → color (tileHeatmap feature) ──
  const heatColorMap = useMemo(() => {
    if (!settings.tileHeatmap || !shantenOptions.length || disabled) return {}
    const map = {}
    shantenOptions.forEach((opt, idx) => {
      const type = Math.floor(opt.discard_raw / 4)
      map[type] = getHeatColor(idx, shantenOptions.length)
    })
    return map
  }, [shantenOptions, settings.tileHeatmap, disabled])

  const canRiichiSelected = selectedRaw !== null && canRiichiSet.has(selectedRaw)

  const select = (rawTile) => {
    setSelectedRaw(rawTile)
    onSelect?.(rawTile)
  }

  const deselect = () => {
    setSelectedRaw(null)
    onSelect?.(null)
  }

  const handleClick = (rawTile) => {
    if (disabled || inRiichi) return
    if (selectedRaw === rawTile) {
      onDiscard(rawTile)
      deselect()
    } else {
      select(rawTile)
    }
  }

  const handleDiscard = () => {
    if (selectedRaw === null) return
    onDiscard(selectedRaw)
    deselect()
  }

  const handleRiichi = () => {
    if (!canRiichiSelected) return
    onRiichi(selectedRaw)
    deselect()
  }

  const getVariant = (rawTile, isDrawnSlot = false) => {
    if (disabled || inRiichi) return isDrawnSlot ? 'drawn' : 'disabled'
    if (rawTile === selectedRaw)    return 'selected'
    if (isDrawnSlot)                return 'drawn'
    if (rawTile === bestDiscardRaw) return 'best'
    return 'normal'
  }

  const renderTile = (raw, isDrawnSlot = false) => (
    <TileButton
      key={`${isDrawnSlot ? 'drawn' : 'main'}-${raw}`}
      rawTile={raw}
      variant={getVariant(raw, isDrawnSlot)}
      onClick={isDrawnSlot && inRiichi ? () => { onDiscard(raw) } : handleClick}
      disabled={disabled}
      dangerDot={dangerMap[raw] ?? null}
      heatColor={heatColorMap[Math.floor(raw / 4)] ?? null}
    />
  )

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* 안내 텍스트 */}
      <div className="h-5 flex items-center">
        {inRiichi ? (
          <p className="text-xs text-amber-400 font-semibold">리치 선언 중 — 새로 뽑은 패(NEW)만 버릴 수 있습니다</p>
        ) : disabled ? (
          <p className="text-xs text-slate-600">AI 차례입니다...</p>
        ) : selectedRaw !== null ? (
          <p className="text-xs text-indigo-300 font-medium">← 왼쪽 사이드바에서 분석을 확인하세요</p>
        ) : (
          <p className="text-xs text-slate-500">버릴 패를 클릭하세요 &nbsp;·&nbsp; ★ = AI 추천</p>
        )}
      </div>

      {/* 손패 */}
      <div className="flex items-end gap-1.5 flex-wrap justify-center pb-2">
        {mainHand.map((raw) => renderTile(raw, false))}

        {hasDrawn && drawnTile !== null && (
          <>
            <div className="w-px h-14 bg-slate-600/60 mx-1 self-center" />
            {renderTile(drawnTile, true)}
          </>
        )}
      </div>

      {/* 히트맵 범례 (활성 시) */}
      {settings.tileHeatmap && shantenOptions.length > 0 && !disabled && (
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>히트맵:</span>
          {[
            { color: '#22c55e', label: '버리기 좋음' },
            { color: '#eab308', label: '보통' },
            { color: '#ef4444', label: '비추천' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* 위험도 범례 (활성 시) */}
      {settings.dangerTiles && !disabled && hand.length > 0 && (
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span>위험도:</span>
          {[
            { color: '#4ade80', label: '안전' },
            { color: '#facc15', label: '보통' },
            { color: '#f87171', label: '주의' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      {selectedRaw !== null && !disabled && !inRiichi && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleDiscard}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all shadow"
          >
            버리기
          </button>
          {canRiichiSelected && (
            <button
              onClick={handleRiichi}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all shadow"
            >
              🀄 리치 선언
            </button>
          )}
          <button
            onClick={deselect}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      )}
    </div>
  )
}
