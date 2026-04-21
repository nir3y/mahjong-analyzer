"""
게임 REST API
- POST /api/game/new  → 새 게임 생성, game_id 반환
- GET  /api/game/{game_id}/state → 현재 게임 상태 반환 (폴백용)
"""
from fastapi import APIRouter, HTTPException
from game.engine import MahjongGame

router = APIRouter()

# 인메모리 게임 세션 저장소 (websocket.py와 공유)
active_games: dict[str, MahjongGame] = {}


@router.post("/new")
def create_game() -> dict:
    """새 게임을 생성하고 game_id를 반환합니다."""
    game = MahjongGame()
    game.initialize()
    active_games[game.game_id] = game
    return {
        "game_id": game.game_id,
        "message": "게임이 생성되었습니다."
    }


@router.get("/{game_id}/state")
def get_game_state(game_id: str) -> dict:
    """현재 게임 상태를 반환합니다 (WebSocket 연결 불가 시 폴백)."""
    game = active_games.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다.")
    return game.to_client_state()
