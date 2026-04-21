import { rawToEmoji, rawToName } from '../../utils/tileUtils'

/** 버림패 그리드 — 미니 타일 카드로 표시 */
export default function DiscardPile({ discards = [], label, compact = false }) {
  const tileW = compact ? 'w-6'  : 'w-8'
  const tileH = compact ? 'h-9'  : 'h-11'
  const emSz  = compact ? 'text-base' : 'text-xl'
  const lbSz  = compact ? 'text-[6px]' : 'text-[7px]'

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-[10px] text-slate-500 font-medium">{label}</p>}

      <div className="flex flex-wrap gap-0.5 min-h-[36px]">
        {discards.length === 0 && (
          <span className="text-[10px] text-slate-700 italic self-center">-</span>
        )}
        {discards.map((raw, i) => {
          const name = rawToName(raw)
          const emoji = rawToEmoji(raw)
          const colors = getSuitColors(raw)
          const isLast = i === discards.length - 1

          return (
            <div
              key={i}
              title={name}
              className={`
                flex flex-col items-center justify-center gap-0
                ${tileW} ${tileH}
                rounded border-2 select-none
                ${isLast ? 'ring-1 ring-white/30' : ''}
              `}
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderBottomColor: colors.shadow,
                borderBottomWidth: 3,
                opacity: isLast ? 1 : 0.75,
              }}
            >
              <span className={`${emSz} leading-none`} style={{ color: colors.text }}>{emoji}</span>
              <span className={`${lbSz} font-bold leading-none`} style={{ color: colors.text }}>{name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getSuitColors(rawTile) {
  const type = Math.floor(rawTile / 4)
  if (type < 9)  return { bg: '#fff5f5', border: '#fc8181', shadow: '#c53030', text: '#c53030' }
  if (type < 18) return { bg: '#ebf8ff', border: '#63b3ed', shadow: '#2b6cb0', text: '#2b6cb0' }
  if (type < 27) return { bg: '#f0fff4', border: '#68d391', shadow: '#276749', text: '#276749' }
  return         { bg: '#fffff0', border: '#f6e05e', shadow: '#b7791f', text: '#b7791f' }
}
