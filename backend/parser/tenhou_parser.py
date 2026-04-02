import xml.etree.ElementTree as ET
import requests
from typing import Optional

# 천봉 패 번호 → 패 이름 변환
# 0-35: 만수패 (0-8: 1-9만), 36-71: 통수패, 72-107: 삭수패
# 108-111: 동남서북, 112-114: 백발중, 116-119: 적도라(5만/5통/5삭)
TILE_NAMES = {}

def _build_tile_names():
    suits = ["만", "통", "삭"]
    for s, suit in enumerate(suits):
        for n in range(9):
            for k in range(4):
                tile_id = s * 36 + n * 4 + k
                TILE_NAMES[tile_id] = f"{n+1}{suit}"
    honors = ["동", "남", "서", "북", "백", "발", "중"]
    for i, name in enumerate(honors):
        for k in range(4):
            TILE_NAMES[108 + i * 4 + k] = name

_build_tile_names()


def tile_to_name(tile_id: int) -> str:
    return TILE_NAMES.get(tile_id, f"?({tile_id})")


def fetch_log(log_id: str) -> Optional[str]:
    url = f"https://tenhou.net/0/log/?{log_id}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        return res.text
    except Exception as e:
        print(f"로그 가져오기 실패: {e}")
        return None


def parse_log(log_xml: str) -> dict:
    """
    천봉 mjlog XML을 파싱해서 구조화된 데이터로 반환
    반환값: {
        "rounds": [
            {
                "round_index": 0,
                "dealer": 0,
                "initial_hands": [[패 목록 x4]],
                "turns": [
                    {
                        "player": 0,
                        "draw": 패번호 or None,
                        "discard": 패번호 or None,
                        "hand_before_discard": [패 목록]
                    }
                ]
            }
        ]
    }
    """
    root = ET.fromstring(log_xml)
    rounds = []

    # 플레이어별 드로우/버림 태그
    DRAW_TAGS = {0: "T", 1: "U", 2: "V", 3: "W"}
    DISCARD_TAGS = {0: "D", 1: "E", 2: "F", 3: "G"}

    current_round = None
    hands = [[], [], [], []]

    for elem in root:
        tag = elem.tag

        # 라운드 시작
        if tag == "INIT":
            current_round = {
                "round_index": len(rounds),
                "dealer": int(elem.get("oya", 0)),
                "initial_hands": [],
                "turns": []
            }
            hands = [[], [], [], []]
            for i in range(4):
                hai = elem.get(f"hai{i}", "")
                if hai:
                    hand = [int(t) for t in hai.split(",") if t]
                    hands[i] = sorted(hand)
                    current_round["initial_hands"].append(
                        [tile_to_name(t) for t in hands[i]]
                    )
            rounds.append(current_round)
            continue

        if current_round is None:
            continue

        # 드로우 감지
        for player, prefix in DRAW_TAGS.items():
            if tag.startswith(prefix) and tag[len(prefix):].isdigit():
                tile = int(tag[len(prefix):])
                hands[player].append(tile)
                current_round["turns"].append({
                    "player": player,
                    "action": "draw",
                    "tile": tile_to_name(tile),
                    "hand": [tile_to_name(t) for t in sorted(hands[player])]
                })
                break

        # 버림 감지
        for player, prefix in DISCARD_TAGS.items():
            if tag.startswith(prefix) and tag[len(prefix):].isdigit():
                tile = int(tag[len(prefix):])
                hand_before = sorted(hands[player][:])
                if tile in hands[player]:
                    hands[player].remove(tile)
                current_round["turns"].append({
                    "player": player,
                    "action": "discard",
                    "tile": tile_to_name(tile),
                    "hand_before_discard": [tile_to_name(t) for t in hand_before]
                })
                break

    return {"rounds": rounds, "total_rounds": len(rounds)}
