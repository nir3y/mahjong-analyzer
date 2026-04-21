"""Realtime WebSocket flow for the coaching table."""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.game_http import active_games
from game.engine import GamePhase
from llm.ollama_client import explain_realtime_coaching

router = APIRouter()
logger = logging.getLogger(__name__)

active_connections: dict[str, WebSocket] = {}
AI_THINK_DELAY = 0.7


@router.websocket("/ws/game/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: str):
    await websocket.accept()
    active_connections[game_id] = websocket

    game = active_games.get(game_id)
    if not game:
        await websocket.send_json({"event": "error", "code": "game_not_found", "message": "게임을 찾을 수 없습니다."})
        await websocket.close()
        return

    try:
        await websocket.send_json({"event": "game_start", **game.to_client_state()})
        await websocket.send_json(game.draw_for_human())

        async for raw_msg in websocket.iter_text():
            try:
                msg = json.loads(raw_msg)
            except json.JSONDecodeError:
                await _send_error(websocket, "invalid_json", "잘못된 메시지 형식입니다.")
                continue

            event = msg.get("event")
            if event == "player_discard":
                await _handle_discard(websocket, game, msg)
            elif event == "declare_riichi":
                await _handle_riichi(websocket, game, msg)
            elif event == "declare_tsumo":
                await _handle_tsumo(websocket, game)
            elif event == "declare_ron":
                await _handle_ron(websocket, game)
            elif event == "claim_call":
                await _handle_claim_call(websocket, game, msg)
            elif event == "pass_call":
                await _handle_pass_call(websocket, game)
            else:
                await _send_error(websocket, "unknown_event", f"지원하지 않는 이벤트입니다: {event}")
    except WebSocketDisconnect:
        logger.info("game %s disconnected", game_id)
    finally:
        active_connections.pop(game_id, None)


async def _handle_discard(websocket: WebSocket, game, msg: dict):
    tile_raw = msg.get("tile")
    if tile_raw is None:
        await _send_error(websocket, "missing_tile", "버릴 패를 지정해주세요.")
        return

    try:
        result = game.player_discard(tile_raw)
    except ValueError as exc:
        await _send_error(websocket, "invalid_discard", str(exc))
        return

    await _send_coaching_if_needed(websocket, result.get("coaching_data"))

    if result.get("result_event"):
        await websocket.send_json(result["result_event"])
        return

    await _run_ai_turns(websocket, game)


async def _handle_riichi(websocket: WebSocket, game, msg: dict):
    tile_raw = msg.get("tile")
    if tile_raw is None:
        await _send_error(websocket, "missing_tile", "리치 선언 시 버릴 패를 지정해주세요.")
        return

    try:
        result = game.declare_riichi(tile_raw)
    except ValueError as exc:
        await _send_error(websocket, "invalid_riichi", str(exc))
        return

    await websocket.send_json(
        {
            "event": "riichi_declared",
            "discards": result.get("discards"),
            "winning_tiles": result.get("winning_tiles", []),
            "scores": result.get("scores"),
            "riichi_sticks": result.get("riichi_sticks"),
        }
    )

    await _send_coaching_if_needed(websocket, result.get("coaching_data"))

    if result.get("result_event"):
        await websocket.send_json(result["result_event"])
        return

    await _run_ai_turns(websocket, game)


async def _handle_tsumo(websocket: WebSocket, game):
    try:
        await websocket.send_json(game.declare_tsumo())
    except ValueError as exc:
        await _send_error(websocket, "invalid_tsumo", str(exc))


async def _handle_ron(websocket: WebSocket, game):
    try:
        await websocket.send_json(game.declare_ron())
    except ValueError as exc:
        await _send_error(websocket, "invalid_ron", str(exc))


async def _handle_claim_call(websocket: WebSocket, game, msg: dict):
    kind = msg.get("kind")
    use_types = msg.get("use_types") or []
    if not kind:
        await _send_error(websocket, "missing_call_kind", "호출 종류를 전달해주세요.")
        return

    try:
        await websocket.send_json(game.claim_reaction(kind, list(use_types)))
    except ValueError as exc:
        await _send_error(websocket, "invalid_call", str(exc))


async def _handle_pass_call(websocket: WebSocket, game):
    try:
        result = game.pass_reaction()
    except ValueError as exc:
        await _send_error(websocket, "invalid_pass", str(exc))
        return
    await _run_ai_turns(websocket, game, start_player=result["resume_from"])


async def _run_ai_turns(websocket: WebSocket, game, start_player: int = 1):
    for ai_event in game.run_ai_turns(start_player=start_player):
        await asyncio.sleep(AI_THINK_DELAY)
        await websocket.send_json(ai_event)

        if ai_event["event"] in {"draw_game", "win_declared"}:
            return
        if game.phase == GamePhase.PLAYER_REACTION:
            return

    if game.phase == GamePhase.DRAW_GAME:
        return

    draw_event = game.draw_for_human()
    await websocket.send_json(draw_event)


async def _send_coaching_if_needed(websocket: WebSocket, coaching_data: dict | None):
    if not coaching_data:
        return

    await websocket.send_json({"event": "coaching_update", **coaching_data})
    asyncio.create_task(_send_llm_coaching(websocket, coaching_data))


async def _send_llm_coaching(websocket: WebSocket, coaching_data: dict):
    try:
        loop = asyncio.get_event_loop()
        message = await loop.run_in_executor(
            None,
            explain_realtime_coaching,
            {
                "your_discard_name": coaching_data["your_discard_name"],
                "best_discard_name": coaching_data["best_discard_name"],
                "shanten_your": coaching_data["shanten_after_your_choice"],
                "shanten_best": coaching_data["shanten_after_best_choice"],
                "effective_count_delta": coaching_data["effective_count_delta"],
                "hand_names": coaching_data["hand_names"],
            },
        )
        await websocket.send_json({"event": "coaching_update", **coaching_data, "llm_message": message})
    except Exception as exc:  # pragma: no cover - network/model failures are non-fatal
        logger.warning("LLM coaching failed: %s", exc)


async def _send_error(websocket: WebSocket, code: str, message: str):
    await websocket.send_json({"event": "error", "code": code, "message": message})
