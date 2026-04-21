/**
 * 타일 유틸리티 (프론트엔드)
 * raw ID(0-135) ↔ type ID(0-33) ↔ 이름 ↔ 유니코드 이모지
 */

const SUIT_NAMES = ['만', '통', '삭']
const HONOR_NAMES = ['동', '남', '서', '북', '백', '발', '중']

// 타일 타입(0-33) → 유니코드 마작 타일 이모지
const TILE_EMOJI = [
  // man (0-8)
  '🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏',
  // tong/pin (9-17)
  '🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡',
  // sou/bamboo (18-26)
  '🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘',
  // honors (27-33): 동남서북백발중
  '🀀','🀁','🀂','🀃','🀆','🀅','🀄',
]

export function rawToType(rawTile) {
  return Math.floor(rawTile / 4)
}

export function typeToName(tileType) {
  if (tileType < 27) {
    const suit = Math.floor(tileType / 9)
    const num = (tileType % 9) + 1
    return `${num}${SUIT_NAMES[suit]}`
  }
  if (tileType < 34) return HONOR_NAMES[tileType - 27]
  return '??'
}

export function rawToName(rawTile) {
  return typeToName(rawToType(rawTile))
}

export function typeToEmoji(tileType) {
  if (tileType >= 0 && tileType < 34) return TILE_EMOJI[tileType]
  return '🀫'
}

export function rawToEmoji(rawTile) {
  return typeToEmoji(rawToType(rawTile))
}

/** 수패 종류별 색상 반환 */
export function getTileSuitColor(tileType) {
  if (tileType < 9)  return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' }  // 만 - 빨강
  if (tileType < 18) return { bg: '#eff6ff', border: '#93c5fd', text: '#2563eb' }  // 통 - 파랑
  if (tileType < 27) return { bg: '#f0fdf4', border: '#86efac', text: '#16a34a' }  // 삭 - 초록
  return { bg: '#fffbeb', border: '#fcd34d', text: '#d97706' }                      // 자패 - 황금
}

export function rawToSuitColor(rawTile) {
  return getTileSuitColor(rawToType(rawTile))
}

export function handsToNames(handRaw) {
  return handRaw.map(rawToName)
}
