import { useCallback, useEffect, useReducer, useRef } from 'react'

const initialState = {
  phase: 'waiting',
  roundName: '',
  roundWind: '',
  dealer: 0,
  turnNumber: 0,
  tilesRemaining: 0,
  yourHand: [],
  drawnTile: null,
  yourInRiichi: false,
  yourSeatWind: '',
  seatWinds: {},
  discards: { 0: [], 1: [], 2: [], 3: [] },
  melds: { 0: [], 1: [], 2: [], 3: [] },
  scores: { 0: 25000, 1: 25000, 2: 25000, 3: 25000 },
  doraIndicators: [],
  doraIndicatorNames: [],
  honba: 0,
  riichiSticks: 0,
  aiHandSizes: [13, 13, 13],
  shantenOptions: [],
  bestDiscardRaw: null,
  yakuHints: [],
  strategicNote: null,
  coaching: null,
  winData: null,
  canTsumo: false,
  canRon: false,
  ronTile: null,
  reactionPrompt: null,
  gameHistory: [],
  callContext: null,
  error: null,
  connectionStatus: 'connecting',
}

function applySharedState(state, payload) {
  return {
    ...state,
    phase: payload.phase ?? state.phase,
    roundName: payload.round_name ?? state.roundName,
    roundWind: payload.round_wind ?? state.roundWind,
    dealer: payload.dealer ?? state.dealer,
    turnNumber: payload.turn_number ?? state.turnNumber,
    tilesRemaining: payload.tiles_remaining ?? state.tilesRemaining,
    yourInRiichi: payload.your_in_riichi ?? state.yourInRiichi,
    yourSeatWind: payload.your_seat_wind ?? state.yourSeatWind,
    seatWinds: payload.seat_winds ?? state.seatWinds,
    discards: payload.discards ?? state.discards,
    melds: payload.melds ?? state.melds,
    scores: payload.scores ?? state.scores,
    aiHandSizes: payload.ai_hand_sizes ?? state.aiHandSizes,
    doraIndicators: payload.dora_indicators ?? state.doraIndicators,
    doraIndicatorNames: payload.dora_indicator_names ?? state.doraIndicatorNames,
    honba: payload.honba ?? state.honba,
    riichiSticks: payload.riichi_sticks ?? state.riichiSticks,
    reactionPrompt: payload.reaction_prompt ?? payload.pending_reaction ?? state.reactionPrompt,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connectionStatus: 'connected' }
    case 'DISCONNECTED':
      return { ...state, connectionStatus: 'disconnected' }

    case 'game_start':
      return applySharedState(
        {
          ...state,
          yourHand: action.payload.your_hand ?? state.yourHand,
          drawnTile: action.payload.drawn_tile ?? null,
        },
        action.payload,
      )

    case 'draw_tile':
      return applySharedState(
        {
          ...state,
          yourHand: action.payload.your_hand ?? state.yourHand,
          drawnTile: action.payload.tile ?? null,
          shantenOptions: action.payload.shanten_options || [],
          bestDiscardRaw: action.payload.best_discard_raw ?? null,
          yakuHints: action.payload.yaku_hints || [],
          canTsumo: action.payload.can_tsumo || false,
          canRon: false,
          ronTile: null,
          strategicNote: action.payload.strategic_note || null,
          coaching: null,
          callContext: action.payload.call_context || null,
          reactionPrompt: null,
        },
        action.payload,
      )

    case 'ai_discard':
      return applySharedState(
        {
          ...state,
          canRon: action.payload.can_ron || false,
          ronTile: action.payload.ron_tile || null,
          reactionPrompt: action.payload.reaction_prompt || null,
          callContext: null,
        },
        action.payload,
      )

    case 'coaching_update':
      return {
        ...state,
        coaching: {
          yourDiscardName: action.payload.your_discard_name,
          bestDiscardName: action.payload.best_discard_name,
          shantenYour: action.payload.shanten_after_your_choice,
          shantenBest: action.payload.shanten_after_best_choice,
          effectiveDelta: action.payload.effective_count_delta,
          doraCount: action.payload.dora_count ?? 0,
          openMeldCount: action.payload.open_meld_count ?? 0,
          llmMessage: action.payload.llm_message,
        },
      }

    case 'riichi_declared':
      return {
        ...applySharedState(state, action.payload),
        yourInRiichi: true,
      }

    case 'win_declared':
      return applySharedState(
        {
          ...state,
          phase: action.payload.is_human_win ? 'player_win' : 'ai_win',
          winData: action.payload,
          gameHistory: action.payload.history || [],
          reactionPrompt: null,
          canRon: false,
        },
        action.payload,
      )

    case 'draw_game':
      return applySharedState(
        {
          ...state,
          phase: 'draw_game',
          winData: { tenpaiPlayers: action.payload.tenpai_players },
          gameHistory: action.payload.history || [],
          reactionPrompt: null,
        },
        action.payload,
      )

    case 'error':
      return { ...state, error: action.payload.message }
    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'OPTIMISTIC_DISCARD': {
      const tile = action.payload.tile
      const hand = [...state.yourHand]
      let removed = false
      const newHand = hand.filter((raw, i) => {
        if (!removed && raw === tile && i === hand.lastIndexOf(tile)) {
          removed = true
          return false
        }
        return true
      })
      return {
        ...state,
        yourHand: newHand,
        drawnTile: null,
        phase: 'ai_turn',
        shantenOptions: [],
        bestDiscardRaw: null,
        reactionPrompt: null,
      }
    }

    default:
      return state
  }
}

export function useGameWebSocket(gameId) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!gameId) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/game/${gameId}`)
    wsRef.current = ws

    ws.onopen = () => dispatch({ type: 'CONNECTED' })
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        dispatch({ type: msg.event, payload: msg })
      } catch (error) {
        console.error('WS parse failed', error)
      }
    }
    ws.onclose = () => dispatch({ type: 'DISCONNECTED' })
    ws.onerror = (error) => console.error('WebSocket error', error)

    return () => ws.close()
  }, [gameId])

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const sendDiscard = useCallback((tileRaw) => {
    dispatch({ type: 'OPTIMISTIC_DISCARD', payload: { tile: tileRaw } })
    send({ event: 'player_discard', tile: tileRaw })
  }, [send])

  const sendRiichi = useCallback((tileRaw) => {
    dispatch({ type: 'OPTIMISTIC_DISCARD', payload: { tile: tileRaw } })
    send({ event: 'declare_riichi', tile: tileRaw })
  }, [send])

  const sendTsumo = useCallback(() => send({ event: 'declare_tsumo' }), [send])
  const sendRon = useCallback(() => send({ event: 'declare_ron' }), [send])
  const sendClaimCall = useCallback((kind, useTypes) => send({ event: 'claim_call', kind, use_types: useTypes }), [send])
  const sendPassCall = useCallback(() => send({ event: 'pass_call' }), [send])
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), [])

  return {
    ...state,
    sendDiscard,
    sendRiichi,
    sendTsumo,
    sendRon,
    sendClaimCall,
    sendPassCall,
    clearError,
  }
}
