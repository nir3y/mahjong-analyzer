export default function GameStatusBar({
  roundName,
  roundWind,
  tilesRemaining,
  turnNumber,
  phase,
  connectionStatus,
  yourSeatWind,
  honba = 0,
  riichiSticks = 0,
  onSettingsClick,
}) {
  const phaseLabel = {
    waiting: '준비 중',
    player_draw: '내 차례',
    player_reaction: '호출 선택',
    ai_turn: 'AI 진행 중',
    player_win: '화료',
    ai_win: 'AI 화료',
    draw_game: '유국',
  }[phase] || phase

  const phaseColor = {
    player_draw: 'text-emerald-400',
    player_reaction: 'text-amber-300',
    ai_turn: 'text-amber-400',
    player_win: 'text-indigo-300',
    ai_win: 'text-rose-400',
    draw_game: 'text-slate-400',
  }[phase] || 'text-slate-300'

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-200">{roundName || '동1국'}</span>
        {roundWind && <WindBadge wind={roundWind} label="장풍" size="sm" muted />}
        <span className="text-slate-700">|</span>
        {yourSeatWind && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">내 자리</span>
            <WindBadge wind={yourSeatWind} label="" size="sm" />
          </div>
        )}
        <span className={`font-semibold ${phaseColor}`}>{phaseLabel}</span>
        {turnNumber > 0 && <span className="text-slate-500 text-xs">{turnNumber}순</span>}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-xs">
          패산 <span className="text-slate-200 font-medium">{tilesRemaining}</span>장
        </span>
        <span className="text-slate-400 text-xs">본장 {honba}</span>
        <span className="text-slate-400 text-xs">공탁 {riichiSticks}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          connectionStatus === 'connected'
            ? 'bg-emerald-900/40 text-emerald-400'
            : 'bg-rose-900/40 text-rose-400'
        }`}>
          {connectionStatus === 'connected' ? '연결됨' : '연결 끊김'}
        </span>
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors text-base"
            title="기능 설정"
          >
            ⚙
          </button>
        )}
      </div>
    </div>
  )
}

export function WindBadge({ wind, label, size = 'md', muted = false }) {
  const windStyle = {
    동: { bg: 'bg-red-900/50', border: 'border-red-700/60', text: 'text-red-300', emoji: '東' },
    남: { bg: 'bg-blue-900/50', border: 'border-blue-700/60', text: 'text-blue-300', emoji: '南' },
    서: { bg: 'bg-green-900/50', border: 'border-green-700/60', text: 'text-green-300', emoji: '西' },
    북: { bg: 'bg-purple-900/50', border: 'border-purple-700/60', text: 'text-purple-300', emoji: '北' },
  }[wind] ?? { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400', emoji: '?' }

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
  const opacity = muted ? 'opacity-60' : ''

  return (
    <span className={`inline-flex items-center gap-1 rounded font-bold border ${windStyle.bg} ${windStyle.border} ${windStyle.text} ${sizeClass} ${opacity}`}>
      <span>{windStyle.emoji}</span>
      {wind}
      <span className="font-normal opacity-70">{label ? `(${label})` : ''}</span>
    </span>
  )
}
