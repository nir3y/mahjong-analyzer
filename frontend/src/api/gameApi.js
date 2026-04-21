import client from './client'

/** 새 게임 생성 → { game_id } */
export async function createGame() {
  const { data } = await client.post('/game/new')
  return data
}

/** 현재 게임 상태 조회 (폴백용) */
export async function getGameState(gameId) {
  const { data } = await client.get(`/game/${gameId}/state`)
  return data
}
