import { rawToEmoji, rawToName } from '../../utils/tileUtils'

/**
 * 마작 타일 버튼 컴포넌트
 * variant: 'normal' | 'drawn' | 'best' | 'selected' | 'disabled'
 * size: 'sm' | 'md'
 * dangerDot: null | 'safe' | 'warn' | 'risky'  — 위험도 점 (feature: dangerTiles)
 * heatColor: null | string (CSS color)          — 효율 히트맵 색 (feature: tileHeatmap)
 */
export default function TileButton({
  rawTile,
  onClick,
  variant = 'normal',
  disabled = false,
  size = 'md',
  dangerDot = null,
  heatColor = null,
}) {
  const emoji  = rawToEmoji(rawTile)
  const name   = rawToName(rawTile)
  const colors = getSuitColors(rawTile)

  const isDisabled = disabled || variant === 'disabled'

  // 크기
  const tileW   = size === 'sm' ? 'w-8'    : 'w-12'
  const tileH   = size === 'sm' ? 'h-11'   : 'h-[68px]'
  const emojiSz = size === 'sm' ? 'text-xl' : 'text-3xl'
  const labelSz = size === 'sm' ? 'text-[7px]' : 'text-[9px]'

  // variant별 translateY / ring
  const lifted = {
    normal:   'hover:-translate-y-1.5',
    drawn:    'hover:-translate-y-2',
    best:     'hover:-translate-y-2',
    selected: '-translate-y-3',
    disabled: '',
  }[variant] ?? ''

  const ring = {
    drawn:    'ring-2 ring-indigo-400',
    best:     'ring-2 ring-emerald-400',
    selected: 'ring-2 ring-indigo-300',
  }[variant] ?? ''

  const shadowCls = variant === 'selected'
    ? 'shadow-xl'
    : variant === 'best' || variant === 'drawn'
    ? 'shadow-lg'
    : 'shadow-md'

  // 히트맵: 하단 보더 색상으로 표현
  const bottomBorderStyle = heatColor && !isDisabled
    ? { borderBottomColor: heatColor, borderBottomWidth: 5 }
    : {}

  // 위험도 점 색상
  const dotColors = {
    safe:  '#4ade80',  // 초록
    warn:  '#facc15',  // 노란
    risky: '#f87171',  // 빨강
  }
  const dotColor = dangerDot ? dotColors[dangerDot] : null

  return (
    <button
      onClick={isDisabled ? undefined : () => onClick?.(rawTile)}
      disabled={isDisabled}
      title={name}
      className={`
        relative flex flex-col items-center justify-center gap-0.5
        ${tileW} ${tileH}
        rounded-lg border-2 select-none
        transition-all duration-150
        ${isDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}
        ${lifted} ${ring} ${shadowCls}
      `}
      style={isDisabled ? {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        borderBottomColor: '#0f172a',
        borderBottomWidth: 4,
        ...bottomBorderStyle,
      } : {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderBottomColor: colors.shadow,
        borderBottomWidth: 4,
        ...bottomBorderStyle,
      }}
    >
      {/* 이모지 */}
      <span className={`${emojiSz} leading-none`} style={{ color: isDisabled ? '#475569' : colors.text }}>
        {emoji}
      </span>

      {/* 이름 라벨 */}
      <span className={`${labelSz} font-bold leading-none`} style={{ color: isDisabled ? '#475569' : colors.text }}>
        {name}
      </span>

      {/* 최선 배지 */}
      {variant === 'best' && (
        <span className="absolute -top-2 -right-1.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md z-10">
          ★
        </span>
      )}

      {/* 새 패 뱃지 */}
      {variant === 'drawn' && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[7px] font-bold rounded-full px-1.5 py-0.5 shadow-md z-10 whitespace-nowrap">
          NEW
        </span>
      )}

      {/* 위험도 점 (dangerTiles feature) */}
      {dotColor && !isDisabled && (
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-slate-900 z-10"
          style={{ backgroundColor: dotColor }}
          title={dangerDot === 'safe' ? '안전 (상대 버림패에 있음)' : dangerDot === 'warn' ? '보통 위험' : '주의 (상대 미버림)'}
        />
      )}
    </button>
  )
}

/** 수패 종류별 색상 팔레트 */
function getSuitColors(rawTile) {
  const type = Math.floor(rawTile / 4)
  if (type < 9)  return { bg: '#fff5f5', border: '#fc8181', shadow: '#c53030', text: '#c53030' }
  if (type < 18) return { bg: '#ebf8ff', border: '#63b3ed', shadow: '#2b6cb0', text: '#2b6cb0' }
  if (type < 27) return { bg: '#f0fff4', border: '#68d391', shadow: '#276749', text: '#276749' }
  return         { bg: '#fffff0', border: '#f6e05e', shadow: '#b7791f', text: '#b7791f' }
}
