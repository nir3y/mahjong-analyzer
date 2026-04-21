"""
타일 유틸리티
- 타일 인코딩: raw(0-135) ↔ type(0-33) ↔ 이름
- 0-8: 1-9만, 9-17: 1-9통, 18-26: 1-9삭, 27-33: 동남서북백발중
"""
import random

SUIT_NAMES = ["만", "통", "삭"]
HONOR_NAMES = ["동", "남", "서", "북", "백", "발", "중"]


def raw_to_type(raw_tile: int) -> int:
    """텐호 raw ID(0-135) → 타일 타입(0-33)"""
    return raw_tile // 4


def type_to_name(tile_type: int) -> str:
    """타일 타입(0-33) → 표시 이름"""
    if tile_type < 27:
        suit = tile_type // 9
        num = tile_type % 9 + 1
        return f"{num}{SUIT_NAMES[suit]}"
    if tile_type < 34:
        return HONOR_NAMES[tile_type - 27]
    return "??"


def raw_to_name(raw_tile: int) -> str:
    """raw ID(0-135) → 표시 이름"""
    return type_to_name(raw_to_type(raw_tile))


def name_to_type(name: str) -> int | None:
    """표시 이름 → 타일 타입(0-33)"""
    for i, h in enumerate(HONOR_NAMES):
        if name == h:
            return 27 + i
    for si, suit in enumerate(SUIT_NAMES):
        if name.endswith(suit):
            try:
                num = int(name[:-1])
                if 1 <= num <= 9:
                    return si * 9 + (num - 1)
            except ValueError:
                pass
    return None


def is_terminal_or_honor(tile_type: int) -> bool:
    """노패(1,9) 또는 자패 여부"""
    if tile_type >= 27:
        return True
    return tile_type % 9 in (0, 8)


def isolation_score(tile_type: int) -> int:
    """
    동률(샨텐·유효패 동일) 시 버림 우선순위 점수 — 낮을수록 먼저 버림
    마작 이론: 자패 > 노패(1·9) > 2·8 > 가운데(3-7) 순으로 고립도 높음

    자패는 순쯔(연속패)를 만들 수 없고 오직 커쯔(3장 같은 패)만 가능 →
    같은 효율이면 자패를 먼저 버리는 것이 정석.
    """
    if tile_type >= 27:              return 0  # 자패 (동·남·서·북·백·발·중)
    num = tile_type % 9              # 0-indexed (0=1, 8=9)
    if num in (0, 8):                return 1  # 노패 (1만, 9만 등)
    if num in (1, 7):                return 2  # 2·8 (연결 약함)
    return 3                                   # 가운데 3-7 (가장 유연)


def build_wall() -> list[int]:
    """136장 패산 생성 (raw ID 0-135, 셔플 완료)"""
    wall = list(range(136))
    random.shuffle(wall)
    return wall


def hand_to_types(hand_raw: list[int]) -> list[int]:
    """raw ID 손패 → type ID 리스트"""
    return [raw_to_type(r) for r in hand_raw]


def analyze_discard_options_types(hand_14_raw: list[int], meld_count: int = 0) -> list[dict]:
    """
    14장 손패(raw ID)에서 각 버림패 선택 결과 분석
    shanten 계산은 type ID(0-33) 기준으로 수행
    반환: [{"discard_raw", "discard_name", "shanten", "effective_count", "effective_tiles", "tenpai"}, ...]
    """
    from analyzer.mahjong_analyzer import shanten, get_effective_tiles

    results = []
    seen_types = set()

    for i, raw in enumerate(hand_14_raw):
        t = raw_to_type(raw)
        if t in seen_types:
            continue
        seen_types.add(t)

        remaining_types = [raw_to_type(r) for j, r in enumerate(hand_14_raw) if j != i]
        s = shanten(remaining_types, meld_count=meld_count)
        effective_type_ids = get_effective_tiles(remaining_types, meld_count=meld_count) if s >= 0 else []

        results.append({
            "discard_raw": raw,
            "discard_name": type_to_name(t),
            "shanten": s,
            "effective_count": len(effective_type_ids),
            "effective_tiles": [type_to_name(et) for et in effective_type_ids],
            "tenpai": s == 0,
        })

    # 정렬 기준:
    # 1순위: 샨텐수 낮은 것 (화료에 가까울수록 좋음)
    # 2순위: 유효패 수 많은 것 (도움 되는 패가 많을수록 좋음)
    # 3순위(동률): 고립도 높은 패 먼저 버림 (자패 > 노패 > 2·8 > 가운데)
    results.sort(key=lambda x: (
        x["shanten"],
        -x["effective_count"],
        isolation_score(raw_to_type(x["discard_raw"])),
    ))
    return results
