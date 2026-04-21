"""Lightweight yaku detection and score estimation for the training table."""

from collections import Counter

from analyzer.mahjong_analyzer import get_effective_tiles, shanten
from game.tile_utils import is_terminal_or_honor, raw_to_type

WIND_TYPE_MAP = {"동": 27, "남": 28, "서": 29, "북": 30}
DRAGON_NAMES = {31: "백", 32: "발", 33: "중"}


def check_win(hand_raw: list[int], meld_count: int = 0) -> bool:
    types = [raw_to_type(r) for r in hand_raw]
    return shanten(types, meld_count=meld_count) == -1


def check_tenpai(hand_13_raw: list[int], meld_count: int = 0) -> bool:
    types = [raw_to_type(r) for r in hand_13_raw]
    return shanten(types, meld_count=meld_count) == 0


def get_winning_tiles(hand_13_raw: list[int], meld_count: int = 0) -> list[int]:
    types = [raw_to_type(r) for r in hand_13_raw]
    if shanten(types, meld_count=meld_count) != 0:
        return []
    return get_effective_tiles(types, meld_count=meld_count)


def count_dora(hand_raw: list[int], dora_indicators: list[int]) -> int:
    counts = Counter(raw_to_type(r) for r in hand_raw)
    total = 0
    for indicator in dora_indicators:
        total += counts.get(_next_dora_type(raw_to_type(indicator)), 0)
    return total


def detect_yaku(
    hand_raw: list[int],
    in_riichi: bool,
    is_tsumo: bool,
    melds: list[dict] | None = None,
    seat_wind: str | None = None,
    round_wind: str | None = None,
    dora_indicators: list[int] | None = None,
) -> list[str]:
    melds = melds or []
    dora_indicators = dora_indicators or []
    types = [raw_to_type(r) for r in hand_raw]
    counts = Counter(types)
    yaku: list[str] = []
    open_hand = any(m.get("open", True) for m in melds)

    if in_riichi:
        yaku.append("리치")
    if is_tsumo and not open_hand:
        yaku.append("멘젠쯔모")
    if _is_tanyao(types):
        yaku.append("탄야오")
    if _is_chiitoi(counts) and not open_hand:
        yaku.append("치또이")
    if _is_honroutou(types):
        yaku.append("혼로두")

    suit_yaku = _flush_yaku(types, open_hand)
    if suit_yaku:
        yaku.append(suit_yaku)

    for dtype, name in DRAGON_NAMES.items():
        if counts.get(dtype, 0) >= 3:
            yaku.append(f"역패({name})")

    for label, wind in (("자풍", seat_wind), ("장풍", round_wind)):
        wind_type = WIND_TYPE_MAP.get(wind)
        if wind_type is not None and counts.get(wind_type, 0) >= 3:
            yaku.append(f"역패({label} {wind})")

    triplet_melds = [m for m in melds if m.get("kind") in {"pon", "kan"}]
    if len(triplet_melds) >= 3 and _triplet_heavy(counts):
        yaku.append("또이또이")

    dora_count = count_dora(hand_raw, dora_indicators)
    if dora_count > 0:
        yaku.append(f"도라 {dora_count}")

    return yaku


def get_hand_yaku_hints(
    hand_raw: list[int],
    seat_wind: str | None = None,
    round_wind: str | None = None,
    open_hand: bool = False,
) -> list[dict]:
    types = [raw_to_type(r) for r in hand_raw]
    counts = Counter(types)
    hints: list[dict] = []

    suits_in_hand = set(t // 9 for t in types if t < 27)
    honor_tiles = [t for t in types if t >= 27]
    terminal_tiles = [t for t in types if t < 27 and t % 9 in (0, 8)]

    if len(suits_in_hand) == 1 and not honor_tiles:
        hints.append({"name": "청일색", "icon": "🀇", "status": "possible", "desc": "한 가지 수패만 남기면 큰 타점 루트를 노릴 수 있습니다."})
    elif len(suits_in_hand) == 1 and honor_tiles:
        hints.append({"name": "혼일색", "icon": "🎯", "status": "possible", "desc": "한 종류 수패에 자패를 섞는 형태가 보입니다."})

    non_simple = len(honor_tiles) + len(terminal_tiles)
    if non_simple == 0:
        hints.append({"name": "탄야오", "icon": "⚡", "status": "secured", "desc": "자패와 1, 9가 없어 탄야오 형태가 이미 갖춰졌습니다."})
    elif non_simple <= 2:
        hints.append({"name": "탄야오", "icon": "⚡", "status": "possible", "desc": f"고립된 자패/노두패 {non_simple}장만 정리하면 탄야오가 됩니다."})

    pairs = sum(1 for c in counts.values() if c >= 2)
    if pairs >= 6 and not open_hand:
        hints.append({"name": "치또이", "icon": "🧩", "status": "possible", "desc": f"현재 {pairs}쌍이라 치또이까지 거의 도달했습니다."})

    for dtype, name in DRAGON_NAMES.items():
        cnt = counts.get(dtype, 0)
        if cnt >= 3:
            hints.append({"name": f"역패({name})", "icon": "🔥", "status": "secured", "desc": f"{name} 3장이 있어 1판이 확보됩니다."})
        elif cnt == 2:
            hints.append({"name": f"역패({name})", "icon": "🔥", "status": "possible", "desc": f"{name} 2장 보유 중이라 1장만 더 오면 빠른 1판입니다."})

    if seat_wind:
        _append_wind_hint(hints, counts, seat_wind, "자풍")
    if round_wind and round_wind != seat_wind:
        _append_wind_hint(hints, counts, round_wind, "장풍")

    if not open_hand:
        hints.append({"name": "리치", "icon": "🎌", "status": "possible", "desc": "멘젠을 유지 중이라 텐파이 시 리치 선택이 가능합니다."})

    return hints


def estimate_score(
    yaku: list[str],
    is_tsumo: bool,
    open_hand: bool = False,
) -> int:
    han = 0
    for name in yaku:
        if name in {"리치", "멘젠쯔모", "탄야오"}:
            han += 1
        elif name.startswith("역패"):
            han += 1
        elif name == "치또이":
            han += 2
        elif name == "또이또이":
            han += 2
        elif name == "혼로두":
            han += 2
        elif name == "혼일색":
            han += 2 if open_hand else 3
        elif name == "청일색":
            han += 5 if open_hand else 6
        elif name.startswith("도라 "):
            han += int(name.split()[-1])

    fu = 25 if "치또이" in yaku else (30 if not open_hand else 40)
    base_points = fu * (2 ** max(0, han + 2))

    if han >= 5 or base_points >= 2000:
        total = 8000
    else:
        total = base_points * (4 if not is_tsumo else 2)

    return int(round(total / 100.0) * 100)


def _is_tanyao(types: list[int]) -> bool:
    return all(t < 27 and t % 9 not in (0, 8) for t in types)


def _is_honroutou(types: list[int]) -> bool:
    return all(is_terminal_or_honor(t) for t in types)


def _is_chiitoi(counts: Counter) -> bool:
    return sum(1 for c in counts.values() if c >= 2) >= 7


def _flush_yaku(types: list[int], open_hand: bool) -> str | None:
    suits = {t // 9 for t in types if t < 27}
    honors = any(t >= 27 for t in types)
    if len(suits) != 1:
        return None
    return "혼일색" if honors else "청일색"


def _triplet_heavy(counts: Counter) -> bool:
    triplets = sum(1 for c in counts.values() if c >= 3)
    pairs = sum(1 for c in counts.values() if c >= 2)
    return triplets >= 4 or (triplets >= 3 and pairs >= 1)


def _append_wind_hint(hints: list[dict], counts: Counter, wind: str, label: str) -> None:
    wind_type = WIND_TYPE_MAP.get(wind)
    if wind_type is None:
        return
    cnt = counts.get(wind_type, 0)
    if cnt >= 3:
        hints.append({"name": f"역패({label} {wind})", "icon": "🌬", "status": "secured", "desc": f"{label} {wind} 3장으로 1판이 확정됩니다."})
    elif cnt == 2:
        hints.append({"name": f"역패({label} {wind})", "icon": "🌬", "status": "possible", "desc": f"{label} {wind} 2장이라 1장만 더 오면 빠른 1판입니다."})


def _next_dora_type(indicator_type: int) -> int:
    if indicator_type < 27:
        base = (indicator_type // 9) * 9
        offset = indicator_type % 9
        return base + ((offset + 1) % 9)
    if indicator_type in (27, 28, 29, 30):
        return 27 + ((indicator_type - 27 + 1) % 4)
    return 31 + ((indicator_type - 31 + 1) % 3)
