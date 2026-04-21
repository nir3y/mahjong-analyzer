function getTileColor(tile) {
  if (!tile) return 'text-slate-400'
  if (tile.endsWith('만')) return 'text-red-400'
  if (tile.endsWith('삭')) return 'text-emerald-400'
  if (tile.endsWith('통')) return 'text-sky-400'
  return 'text-amber-300' // 자패 (동남서북중발백)
}

function Tile({ tile, variant = 'normal' }) {
  const color = getTileColor(tile)

  const variantClass = {
    normal: 'bg-slate-700/60 border-slate-600/50',
    discard: 'bg-rose-500/20 border-rose-500/40',
    highlight: 'bg-indigo-500/20 border-indigo-400/50',
    better: 'bg-emerald-500/20 border-emerald-500/40',
  }[variant]

  return (
    <span className={`
      inline-flex items-center justify-center
      px-1.5 py-0.5 rounded
      text-xs font-bold font-mono
      border ${variantClass} ${color}
      transition-colors duration-100
    `}>
      {tile}
    </span>
  )
}

export default function TileDisplay({ tiles = [], discardedTile, highlightedTiles = [], betterTile }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tiles.map((tile, i) => {
        let variant = 'normal'
        if (tile === discardedTile) variant = 'discard'
        else if (tile === betterTile) variant = 'better'
        else if (highlightedTiles.includes(tile)) variant = 'highlight'
        return <Tile key={i} tile={tile} variant={variant} />
      })}
    </div>
  )
}

export { Tile, getTileColor }
