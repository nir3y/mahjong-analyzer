import { useMemo, useState } from 'react'
import { rawToEmoji, rawToName } from '../../utils/tileUtils'
import { useGameWebSocket } from '../../hooks/useGameWebSocket'
import { useSettings } from '../../hooks/useSettings'
import GameStatusBar, { WindBadge } from './GameStatusBar'
import PlayerHand from './PlayerHand'
import DiscardPile from './DiscardPile'
import CoachingSidebar from './CoachingSidebar'
import WinModal from './WinModal'
import SettingsPanel from '../Settings/SettingsPanel'
import VerdictBadge from '../Common/VerdictBadge'
import YakuTag from '../Common/YakuTag'

export default function GameBoard({ gameId, onNewGame }) {
  const {
    phase,
    roundName,
    roundWind,
    turnNumber,
    tilesRemaining,
    connectionStatus,
    yourHand,
    drawnTile,
    yourInRiichi,
    yourSeatWind,
    seatWinds,
    discards,
    melds,
    scores,
    doraIndicatorNames,
    honba,
    riichiSticks,
    aiHandSizes,
    shantenOptions,
    bestDiscardRaw,
    yakuHints,
    strategicNote,
    coaching,
    canTsumo,
    canRon,
    reactionPrompt,
    winData,
    gameHistory,
    error,
    sendDiscard,
    sendRiichi,
    sendTsumo,
    sendRon,
    sendClaimCall,
    sendPassCall,
    clearError,
  } = useGameWebSocket(gameId)

  const { settings, toggle } = useSettings()
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTileRaw, setSelectedTileRaw] = useState(null)

  const isMyTurn = phase === 'player_draw'
  const isGameOver = ['player_win', 'ai_win', 'draw_game'].includes(phase)

  const canRiichiSet = useMemo(() => {
    const set = new Set()
    if (!yourInRiichi) {
      shantenOptions.forEach((opt) => {
        if (opt.tenpai) set.add(opt.discard_raw)
      })
    }
    return set
  }, [shantenOptions, yourInRiichi])

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <GameStatusBar
        roundName={roundName}
        roundWind={roundWind}
        tilesRemaining={tilesRemaining}
        turnNumber={turnNumber}
        phase={phase}
        connectionStatus={connectionStatus}
        yourSeatWind={yourSeatWind}
        honba={honba}
        riichiSticks={riichiSticks}
        onSettingsClick={() => setShowSettings(true)}
      />

      {error && (
        <div className="bg-rose-900/50 border-b border-rose-800 px-4 py-2 flex items-center justify-between">
          <span className="text-rose-300 text-sm">{error}</span>
          <button onClick={clearError} className="text-rose-400 hover:text-rose-200 text-xs ml-4">닫기</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto">
          <AiPlayerRow
            label="AI 3"
            seatWind={seatWinds?.['3']}
            handSize={aiHandSizes?.[2] ?? 13}
            discards={discards?.['3'] || []}
            melds={melds?.['3'] || []}
            score={scores?.['3'] ?? scores?.[3]}
          />

          <div className="flex gap-2 flex-1">
            <AiPlayerCol
              label="AI 1"
              seatWind={seatWinds?.['1']}
              handSize={aiHandSizes?.[0] ?? 13}
              discards={discards?.['1'] || []}
              melds={melds?.['1'] || []}
              score={scores?.['1'] ?? scores?.[1]}
            />

            <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-emerald-950/30 rounded-xl border border-emerald-900/30 min-h-[160px] p-3">
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <InfoCard label="도라 표시패" value={doraIndicatorNames?.join(' · ') || '-'} />
                <InfoCard label="공탁 / 본장" value={`${riichiSticks} / ${honba}`} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="grid grid-cols-[repeat(17,10px)] gap-0.5">
                  {Array.from({ length: Math.min(tilesRemaining, 34) }).map((_, i) => (
                    <div key={i} className="w-2.5 h-3.5 bg-slate-700 rounded-sm border border-slate-600" />
                  ))}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  패산 <span className="text-slate-200 font-bold">{tilesRemaining}</span>장
                </span>
              </div>
              <div className="px-3 py-1 bg-slate-800/60 rounded-lg border border-slate-700">
                <span className="text-sm font-bold text-slate-300">{roundName || '동1국'}</span>
              </div>
            </div>

            <AiPlayerCol
              label="AI 2"
              seatWind={seatWinds?.['2']}
              handSize={aiHandSizes?.[1] ?? 13}
              discards={discards?.['2'] || []}
              melds={melds?.['2'] || []}
              score={scores?.['2'] ?? scores?.[2]}
            />
          </div>

          <div className="flex flex-col gap-2 bg-slate-900/60 rounded-xl border border-slate-800 p-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">내 버림패</p>
                <DiscardPile discards={discards?.['0'] || []} />
              </div>
              <ScoreChip label="내 점수" value={scores?.['0'] ?? scores?.[0] ?? 25000} accent="indigo" />
            </div>

            {(melds?.['0'] || []).length > 0 && <MeldStrip title="내 후로" melds={melds?.['0'] || []} />}

            <div className="border-t border-slate-800/60" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">내 손패</p>
                {yourSeatWind && <WindBadge wind={yourSeatWind} label="" size="sm" />}
                {yourInRiichi && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] rounded-full border border-amber-500/30 font-semibold">
                    리치
                  </span>
                )}
              </div>
              {yourHand.length > 0 ? (
                <PlayerHand
                  hand={yourHand}
                  drawnTile={drawnTile}
                  bestDiscardRaw={bestDiscardRaw}
                  canRiichiSet={canRiichiSet}
                  onDiscard={(t) => { setSelectedTileRaw(null); sendDiscard(t) }}
                  onRiichi={(t) => { setSelectedTileRaw(null); sendRiichi(t) }}
                  onSelect={setSelectedTileRaw}
                  disabled={!isMyTurn || isGameOver}
                  inRiichi={yourInRiichi}
                  allDiscards={discards}
                  shantenOptions={shantenOptions}
                  settings={settings}
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-600 text-sm py-2">
                  <span className="animate-spin text-base">◌</span>
                  <span>패를 준비하는 중...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">실시간 코칭</p>

          {reactionPrompt && (
            <ReactionPanel
              reactionPrompt={reactionPrompt}
              onRon={sendRon}
              onClaim={sendClaimCall}
              onPass={sendPassCall}
            />
          )}

          {strategicNote && (
            <div className="mb-3 rounded-xl border border-sky-800/40 bg-sky-950/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-sky-300 mb-1">전략 메모</p>
              <p className="text-sm text-slate-200">{strategicNote.title}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{strategicNote.detail}</p>
            </div>
          )}

          <CoachingSidebar
            shantenOptions={shantenOptions}
            bestDiscardRaw={bestDiscardRaw}
            selectedTileRaw={selectedTileRaw}
            coaching={coaching}
            yakuHints={yakuHints}
            canTsumo={canTsumo && isMyTurn}
            canRon={canRon}
            onTsumo={sendTsumo}
            onRon={sendRon}
            tilesRemaining={tilesRemaining}
            settings={settings}
          />
        </aside>
      </div>

      {isGameOver && (
        <WinModal
          winData={winData}
          phase={phase}
          onNewGame={onNewGame}
          gameHistory={gameHistory}
          settings={settings}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onToggle={toggle}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-200 mt-1">{value}</p>
    </div>
  )
}

function ScoreChip({ label, value, accent = 'slate' }) {
  const color = accent === 'indigo' ? 'border-indigo-700/40 bg-indigo-950/20 text-indigo-200' : 'border-slate-700/40 bg-slate-800/30 text-slate-200'
  return (
    <div className={`rounded-xl border px-3 py-2 ${color}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-sm font-bold">{Number(value || 0).toLocaleString()}</p>
    </div>
  )
}

function MeldStrip({ title, melds = [] }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-2">
        {melds.map((meld, index) => (
          <div key={`${meld.kind}-${index}`} className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-2 py-1.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{meld.kind}</p>
            <div className="flex items-center gap-1 mt-1">
              {meld.tiles.map((raw, tileIndex) => (
                <span key={`${raw}-${tileIndex}`} className="inline-flex items-center gap-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-xs text-slate-200">
                  <span>{rawToEmoji(raw)}</span>
                  <span>{rawToName(raw)}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReactionPanel({ reactionPrompt, onRon, onClaim, onPass }) {
  const options = reactionPrompt.options || []
  return (
    <div className="mb-3 rounded-xl border border-amber-700/40 bg-amber-950/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-1">호출 기회</p>
      <p className="text-sm font-semibold text-slate-100">
        AI {reactionPrompt.from_player}의 {reactionPrompt.discard_name}
      </p>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
        지금 반응하지 않으면 다음 플레이어 턴으로 넘어갑니다.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {reactionPrompt.can_ron && (
          <button onClick={onRon} className="rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition-colors">
            론 화료
          </button>
        )}
        {options.map((option) => (
          <button
            key={`${option.kind}-${option.use_types.join('-')}`}
            onClick={() => onClaim(option.kind, option.use_types)}
            className="rounded-lg border border-amber-600/40 bg-slate-900/60 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold">{option.label}</span>
                <span className="ml-2 text-xs text-slate-400">{option.use_names?.join(' + ')}</span>
              </div>
              <VerdictBadge verdict={mapVerdict(option.verdict)} />
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{option.reason}</p>
            {option.detail && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{option.detail}</p>}
            {(option.shanten_after !== null || option.effective_after !== null) && (
              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                {option.shanten_after !== null && <span>예상 {option.shanten_after}샨텐</span>}
                {option.effective_after !== null && <span>유효패 {option.effective_after}종</span>}
                {option.best_discard_name && <span>추천 타패 {option.best_discard_name}</span>}
              </div>
            )}
            {option.yaku_preview?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {option.yaku_preview.map((name) => <YakuTag key={name} name={name} />)}
              </div>
            )}
          </button>
        ))}
        <button onClick={onPass} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition-colors">
          패스
        </button>
      </div>
    </div>
  )
}

function mapVerdict(verdict) {
  if (verdict === 'correct') return 'correct'
  if (verdict === 'mistake') return 'mistake'
  return 'warning'
}

function AiPlayerRow({ label, seatWind, handSize, discards, melds, score }) {
  return (
    <div className="flex flex-col gap-1.5 bg-slate-900/40 rounded-xl border border-slate-800 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          {seatWind && <WindBadge wind={seatWind} label="" size="sm" />}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">{Number(score || 0).toLocaleString()}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(handSize, 13) }).map((_, i) => (
              <div key={i} className="w-4 h-6 rounded-sm bg-slate-700 border border-slate-600" />
            ))}
          </div>
        </div>
      </div>
      {melds?.length > 0 && <MeldStrip title="후로" melds={melds} />}
      <DiscardPile discards={discards} compact />
    </div>
  )
}

function AiPlayerCol({ label, seatWind, handSize, discards, melds, score }) {
  return (
    <div className="flex flex-col gap-2 bg-slate-900/40 rounded-xl border border-slate-800 p-2 w-32 shrink-0">
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        {seatWind && <WindBadge wind={seatWind} label="" size="sm" />}
        <p className="text-[10px] text-slate-300">{Number(score || 0).toLocaleString()}</p>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        {Array.from({ length: Math.min(handSize, 13) }).map((_, i) => (
          <div key={i} className="w-7 h-2 rounded-sm bg-slate-700 border border-slate-600" />
        ))}
        <span className="text-[9px] text-slate-600 mt-0.5">{handSize}장</span>
      </div>
      {melds?.length > 0 && <MeldStrip title="후로" melds={melds} />}
      <div className="border-t border-slate-800" />
      <div>
        <p className="text-[8px] text-slate-600 mb-1">버림패</p>
        <DiscardPile discards={discards} compact />
      </div>
    </div>
  )
}
