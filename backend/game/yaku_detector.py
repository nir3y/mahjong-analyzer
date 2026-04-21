"""Yaku detection and lightweight score estimation for the training table."""

from __future__ import annotations

from collections import Counter, defaultdict
from functools import lru_cache

from analyzer.mahjong_analyzer import get_effective_tiles, shanten
from game.tile_utils import is_terminal_or_honor, raw_to_type

WIND_TYPE_MAP = {"동": 27, "남": 28, "서": 29, "북": 30}
DRAGON_NAMES = {31: "백", 32: "발", 33: "중"}
YAOCHU_TYPES = {0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33}

HAN_VALUES_CLOSED = {
    "리치": 1,
    "더블리치": 2,
    "일발": 1,
    "멘젠쯔모": 1,
    "하이테이": 1,
    "호우테이": 1,
    "영상개화": 1,
    "창깡": 1,
    "탄야오": 1,
    "핑후": 1,
    "이페코": 1,
    "삼색동순": 2,
    "일기통관": 2,
    "혼전대요구": 2,
    "또이또이": 2,
    "산안커": 2,
    "산색동각": 2,
    "삼깡자": 2,
    "치또이": 2,
    "혼일색": 3,
    "순전대요구": 3,
    "량페코": 3,
    "혼로두": 2,
    "청일색": 6,
    "소삼원": 2,
}

HAN_VALUES_OPEN = {
    "탄야오": 1,
    "하이테이": 1,
    "호우테이": 1,
    "영상개화": 1,
    "창깡": 1,
    "삼색동순": 1,
    "일기통관": 1,
    "혼전대요구": 1,
    "또이또이": 2,
    "산안커": 2,
    "산색동각": 2,
    "삼깡자": 2,
    "혼일색": 2,
    "순전대요구": 2,
    "혼로두": 2,
    "청일색": 5,
    "소삼원": 2,
}

YAKUMAN = {
    "국사무쌍",
    "대삼원",
    "사암각",
    "자일색",
    "청로두",
    "녹일색",
    "소사희",
    "대사희",
    "사깡자",
}


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
    winning_tile: int | None = None,
    is_double_riichi: bool = False,
    is_ippatsu: bool = False,
    is_haitei: bool = False,
    is_houtei: bool = False,
    is_rinshan: bool = False,
    is_chankan: bool = False,
) -> list[str]:
    evaluation = evaluate_hand(
        hand_raw=hand_raw,
        in_riichi=in_riichi,
        is_tsumo=is_tsumo,
        melds=melds,
        seat_wind=seat_wind,
        round_wind=round_wind,
        dora_indicators=dora_indicators,
        winning_tile=winning_tile,
        is_double_riichi=is_double_riichi,
        is_ippatsu=is_ippatsu,
        is_haitei=is_haitei,
        is_houtei=is_houtei,
        is_rinshan=is_rinshan,
        is_chankan=is_chankan,
    )
    return evaluation["yaku"]


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
        hints.append({"name": "청일색", "icon": "🀇", "status": "possible", "desc": "한 가지 수패만 남기면 최고 타점 루트를 노릴 수 있습니다."})
    elif len(suits_in_hand) == 1 and honor_tiles:
        hints.append({"name": "혼일색", "icon": "🎯", "status": "possible", "desc": "한 종류 수패에 자패를 섞는 혼일색 루트가 보입니다."})

    if len(suits_in_hand) == 3:
        if _has_sanshoku_seed(types):
            hints.append({"name": "삼색동순", "icon": "🌈", "status": "building", "desc": "같은 숫자의 연속형이 여러 색에 보입니다."})
        if _has_sanshoku_doukou_seed(types):
            hints.append({"name": "삼색동각", "icon": "🧱", "status": "building", "desc": "같은 숫자의 또이츠/커쯔가 여러 색에 보입니다."})

    non_simple = len(honor_tiles) + len(terminal_tiles)
    if non_simple == 0:
        hints.append({"name": "탄야오", "icon": "⚡", "status": "secured", "desc": "자패와 1, 9가 없어 탄야오 형태가 이미 갖춰졌습니다."})
    elif non_simple <= 2:
        hints.append({"name": "탄야오", "icon": "⚡", "status": "possible", "desc": f"고립된 자패/노두패 {non_simple}장만 정리하면 탄야오가 됩니다."})

    pairs = sum(1 for c in counts.values() if c >= 2)
    if pairs >= 6 and not open_hand:
        hints.append({"name": "치또이", "icon": "🧩", "status": "possible", "desc": f"현재 {pairs}쌍이라 치또이까지 거의 도달했습니다."})

    if not open_hand and _has_iipeiko_seed(types):
        hints.append({"name": "이페코", "icon": "🪞", "status": "building", "desc": "같은 순자 후보가 겹쳐 이페코가 보입니다."})

    if _has_ittsu_seed(types):
        hints.append({"name": "일기통관", "icon": "🛣", "status": "building", "desc": "한 색의 123 / 456 / 789 연결이 보입니다."})

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
        hints.append({"name": "리치", "icon": "🎌", "status": "possible", "desc": "멘젠을 유지 중이라 텐파이 시 리치를 선언할 수 있습니다."})

    return hints


def estimate_score(yaku: list[str], is_tsumo: bool, open_hand: bool = False) -> int:
    han, fu = estimate_han_fu(yaku, open_hand=open_hand)

    if any(name in YAKUMAN for name in yaku):
        multiplier = max(1, sum(1 for name in yaku if name in YAKUMAN))
        return 32000 * multiplier

    base_points = fu * (2 ** (han + 2))
    if han >= 13:
        total = 32000
    elif han >= 11:
        total = 24000
    elif han >= 8:
        total = 16000
    elif han >= 6:
        total = 12000
    elif han >= 5 or base_points >= 2000:
        total = 8000
    else:
        total = base_points * (4 if not is_tsumo else 2)

    return int(round(total / 100.0) * 100)


def estimate_han_fu(yaku: list[str], open_hand: bool = False) -> tuple[int, int]:
    han = 0
    for name in yaku:
        if name in YAKUMAN:
            continue
        if name.startswith("역패"):
            han += 1
        elif name.startswith("도라 "):
            han += int(name.split()[-1])
        else:
            mapping = HAN_VALUES_OPEN if open_hand else HAN_VALUES_CLOSED
            han += mapping.get(name, HAN_VALUES_CLOSED.get(name, 0))
    fu = 25 if "치또이" in yaku else (30 if not open_hand else 40)
    if "핑후" in yaku and not open_hand:
        fu = 20
    return han, fu


def evaluate_hand(
    hand_raw: list[int],
    in_riichi: bool,
    is_tsumo: bool,
    melds: list[dict] | None = None,
    seat_wind: str | None = None,
    round_wind: str | None = None,
    dora_indicators: list[int] | None = None,
    winning_tile: int | None = None,
    is_double_riichi: bool = False,
    is_ippatsu: bool = False,
    is_haitei: bool = False,
    is_houtei: bool = False,
    is_rinshan: bool = False,
    is_chankan: bool = False,
) -> dict:
    melds = melds or []
    dora_indicators = dora_indicators or []
    open_hand = any(m.get("open", True) for m in melds)
    types = [raw_to_type(r) for r in hand_raw]
    counts = Counter(types)
    open_groups = [_meld_group_info(m) for m in melds]
    concealed_types = _remove_open_tiles(types, open_groups)

    special_yaku = _detect_special_hands(counts, open_hand, winning_tile)
    if special_yaku:
        yaku = special_yaku[:]
    else:
        decompositions = _standard_hand_decompositions(tuple(sorted(concealed_types)))
        best_yaku: list[str] = []
        best_han_fu = (-1, -1)
        for pair_type, groups_cache in decompositions:
            closed_groups = _groups_from_cache(groups_cache)
            yaku = _base_yaku(
                pair_type=pair_type,
                closed_groups=closed_groups,
                open_groups=open_groups,
                counts=counts,
                in_riichi=in_riichi,
                is_tsumo=is_tsumo,
                open_hand=open_hand,
                seat_wind=seat_wind,
                round_wind=round_wind,
                winning_tile=raw_to_type(winning_tile) if winning_tile is not None else None,
                is_double_riichi=is_double_riichi,
                is_ippatsu=is_ippatsu,
                is_haitei=is_haitei,
                is_houtei=is_houtei,
                is_rinshan=is_rinshan,
                is_chankan=is_chankan,
            )
            han_fu = estimate_han_fu(yaku, open_hand=open_hand)
            if han_fu > best_han_fu:
                best_han_fu = han_fu
                best_yaku = yaku
        yaku = best_yaku

    dora_count = count_dora(hand_raw, dora_indicators)
    if dora_count > 0:
        yaku = list(yaku) + [f"도라 {dora_count}"]

    han, fu = estimate_han_fu(yaku, open_hand=open_hand)
    score = estimate_score(yaku, is_tsumo=is_tsumo, open_hand=open_hand)
    return {"yaku": yaku, "han": han, "fu": fu, "score": score}


def _detect_special_hands(counts: Counter, open_hand: bool, winning_tile: int | None) -> list[str]:
    if open_hand:
        return []

    yaku: list[str] = []
    if _is_kokushi(counts):
        yaku.append("국사무쌍")
    if _is_tsuuiisou(counts):
        yaku.append("자일색")
    if _is_chinroutou(counts):
        yaku.append("청로두")
    if _is_ryuuiisou(counts):
        yaku.append("녹일색")
    winds = [27, 28, 29, 30]
    wind_triplets = sum(1 for t in winds if counts.get(t, 0) >= 3)
    wind_pairs = sum(1 for t in winds if counts.get(t, 0) >= 2)
    if wind_triplets == 4:
        yaku.append("대사희")
    elif wind_triplets == 3 and wind_pairs >= 1:
        yaku.append("소사희")
    if sum(1 for t in DRAGON_NAMES if counts.get(t, 0) >= 3) == 3:
        yaku.append("대삼원")
    if yaku:
        return yaku
    return []


def _base_yaku(
    pair_type: int,
    closed_groups: list[dict],
    open_groups: list[dict],
    counts: Counter,
    in_riichi: bool,
    is_tsumo: bool,
    open_hand: bool,
    seat_wind: str | None,
    round_wind: str | None,
    winning_tile: int | None,
    is_double_riichi: bool,
    is_ippatsu: bool,
    is_haitei: bool,
    is_houtei: bool,
    is_rinshan: bool,
    is_chankan: bool,
) -> list[str]:
    all_groups = open_groups + closed_groups
    yaku: list[str] = []

    if is_double_riichi:
        yaku.append("더블리치")
    elif in_riichi:
        yaku.append("리치")
    if is_ippatsu and in_riichi:
        yaku.append("일발")
    if is_tsumo and not open_hand:
        yaku.append("멘젠쯔모")
    if is_haitei:
        yaku.append("하이테이")
    if is_houtei:
        yaku.append("호우테이")
    if is_rinshan:
        yaku.append("영상개화")
    if is_chankan:
        yaku.append("창깡")
    if _is_tanyao(list(counts.elements())):
        yaku.append("탄야오")
    if _is_chiitoi(counts) and not open_hand:
        yaku.append("치또이")
    if _is_honroutou(list(counts.elements())):
        yaku.append("혼로두")

    suit_yaku = _flush_yaku(list(counts.elements()), open_hand)
    if suit_yaku:
        yaku.append(suit_yaku)

    yakuhai = _yakuhai_yaku(counts, seat_wind, round_wind)
    yaku.extend(yakuhai)

    if _is_all_sequences(all_groups) and not open_hand:
        if _is_pinfu(pair_type, all_groups, seat_wind, round_wind, winning_tile):
            yaku.append("핑후")
        peiko_count = _peiko_count(closed_groups)
        if peiko_count >= 2:
            yaku.append("량페코")
        elif peiko_count == 1:
            yaku.append("이페코")

    if _has_ittsu(all_groups):
        yaku.append("일기통관")
    if _has_sanshoku_doujun(all_groups):
        yaku.append("삼색동순")
    if _has_sanshoku_doukou(all_groups):
        yaku.append("산색동각")

    if _is_toitoi(all_groups):
        yaku.append("또이또이")
    if _is_sanankou(all_groups, open_groups):
        yaku.append("산안커")
    if sum(1 for g in all_groups if g["kind"] == "kan") >= 3:
        yaku.append("삼깡자")

    if _is_chanta(pair_type, all_groups, strict=False):
        yaku.append("혼전대요구")
    if _is_chanta(pair_type, all_groups, strict=True):
        yaku.append("순전대요구")

    if _is_shousangen(counts):
        yaku.append("소삼원")
    if _is_suuankou(all_groups, open_groups):
        yaku.append("사암각")
    if sum(1 for g in all_groups if g["kind"] == "kan") >= 4:
        yaku.append("사깡자")

    return _dedupe_keep_order(yaku)


def _dedupe_keep_order(values: list[str]) -> list[str]:
    seen = set()
    result = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _remove_open_tiles(types: list[int], open_groups: list[dict]) -> list[int]:
    counter = Counter(types)
    for group in open_groups:
        for tile_type in group["types"]:
            counter[tile_type] -= 1
    result: list[int] = []
    for tile_type, count in counter.items():
        result.extend([tile_type] * count)
    return sorted(result)


def _meld_group_info(meld: dict) -> dict:
    kind = meld.get("kind", "pon")
    tile_types = sorted(raw_to_type(t) for t in meld.get("tiles", []))
    normalized_kind = kind
    if kind == "kan":
        normalized_kind = "kan"
    elif len(tile_types) >= 3 and tile_types[0] == tile_types[1] == tile_types[2]:
        normalized_kind = "pon"
    else:
        normalized_kind = "chi"
    return {"kind": normalized_kind, "types": tile_types, "open": meld.get("open", True)}


@lru_cache(maxsize=4096)
def _standard_hand_decompositions(types_tuple: tuple[int, ...]) -> tuple[tuple[int, tuple[tuple[str, tuple[int, ...]], ...]], ...]:
    counts = [0] * 34
    for t in types_tuple:
        counts[t] += 1

    results: list[tuple[int, tuple[tuple[str, tuple[int, ...]], ...]]] = []
    for pair in range(34):
        if counts[pair] < 2:
            continue
        counts[pair] -= 2
        for groups in _decompose_groups(tuple(counts)):
            results.append((pair, groups))
        counts[pair] += 2
    return tuple(results)


@lru_cache(maxsize=8192)
def _decompose_groups(counts_tuple: tuple[int, ...]) -> tuple[tuple[tuple[str, tuple[int, ...]], ...], ...]:
    counts = list(counts_tuple)
    first = next((i for i, c in enumerate(counts) if c > 0), None)
    if first is None:
        return (tuple(),)

    results: list[tuple[tuple[str, tuple[int, ...]], ...]] = []
    if counts[first] >= 3:
        counts[first] -= 3
        for rest in _decompose_groups(tuple(counts)):
            results.append((("pon", (first, first, first)),) + rest)
        counts[first] += 3

    if first < 27 and first % 9 <= 6 and counts[first + 1] > 0 and counts[first + 2] > 0:
        counts[first] -= 1
        counts[first + 1] -= 1
        counts[first + 2] -= 1
        for rest in _decompose_groups(tuple(counts)):
            results.append((("chi", (first, first + 1, first + 2)),) + rest)
        counts[first] += 1
        counts[first + 1] += 1
        counts[first + 2] += 1
    return tuple(results)


def _groups_from_cache(groups_cache: tuple[tuple[str, tuple[int, ...]], ...]) -> list[dict]:
    return [{"kind": kind, "types": list(types), "open": False} for kind, types in groups_cache]


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


def _is_kokushi(counts: Counter) -> bool:
    unique = sum(1 for t in YAOCHU_TYPES if counts.get(t, 0) >= 1)
    pair = any(counts.get(t, 0) >= 2 for t in YAOCHU_TYPES)
    return unique == 13 and pair


def _is_tsuuiisou(counts: Counter) -> bool:
    return counts and all(t >= 27 for t in counts)


def _is_chinroutou(counts: Counter) -> bool:
    return counts and all(t in YAOCHU_TYPES and t < 27 for t in counts)


def _is_ryuuiisou(counts: Counter) -> bool:
    green = {19, 20, 21, 23, 25, 32}
    return counts and all(t in green for t in counts)


def _yakuhai_yaku(counts: Counter, seat_wind: str | None, round_wind: str | None) -> list[str]:
    yaku: list[str] = []
    for dtype, name in DRAGON_NAMES.items():
        if counts.get(dtype, 0) >= 3:
            yaku.append(f"역패({name})")
    for label, wind in (("자풍", seat_wind), ("장풍", round_wind)):
        wind_type = WIND_TYPE_MAP.get(wind)
        if wind_type is not None and counts.get(wind_type, 0) >= 3:
            yaku.append(f"역패({label} {wind})")
    return yaku


def _is_all_sequences(groups: list[dict]) -> bool:
    return all(group["kind"] == "chi" for group in groups)


def _is_pinfu(pair_type: int, groups: list[dict], seat_wind: str | None, round_wind: str | None, winning_tile: int | None) -> bool:
    if any(group["kind"] != "chi" for group in groups):
        return False
    value_pair_types = {31, 32, 33}
    if seat_wind:
        value_pair_types.add(WIND_TYPE_MAP.get(seat_wind))
    if round_wind:
        value_pair_types.add(WIND_TYPE_MAP.get(round_wind))
    if pair_type in value_pair_types:
        return False
    if winning_tile is None:
        return True
    # simplified: reject obvious edge/closed waits, accept otherwise
    for group in groups:
        if group["kind"] != "chi" or winning_tile not in group["types"]:
            continue
        a, b, c = group["types"]
        if winning_tile == a and a % 9 == 6:
            return False
        if winning_tile == c and c % 9 == 2:
            return False
        if winning_tile == b:
            return False
    return True


def _peiko_count(groups: list[dict]) -> int:
    seq_counts = Counter(tuple(group["types"]) for group in groups if group["kind"] == "chi")
    return sum(count // 2 for count in seq_counts.values())


def _has_ittsu(groups: list[dict]) -> bool:
    by_suit = defaultdict(set)
    for group in groups:
        if group["kind"] != "chi":
            continue
        start = group["types"][0]
        by_suit[start // 9].add(start % 9)
    return any({0, 3, 6}.issubset(starts) for starts in by_suit.values())


def _has_sanshoku_doujun(groups: list[dict]) -> bool:
    starts = defaultdict(set)
    for group in groups:
        if group["kind"] != "chi":
            continue
        start = group["types"][0]
        starts[start % 9].add(start // 9)
    return any({0, 1, 2}.issubset(suits) for suits in starts.values())


def _has_sanshoku_doukou(groups: list[dict]) -> bool:
    values = defaultdict(set)
    for group in groups:
        if group["kind"] not in {"pon", "kan"}:
            continue
        tile_type = group["types"][0]
        if tile_type >= 27:
            continue
        values[tile_type % 9].add(tile_type // 9)
    return any({0, 1, 2}.issubset(suits) for suits in values.values())


def _is_toitoi(groups: list[dict]) -> bool:
    return all(group["kind"] in {"pon", "kan"} for group in groups)


def _is_sanankou(groups: list[dict], open_groups: list[dict]) -> bool:
    concealed_triplets = sum(1 for group in groups if group["kind"] == "pon" and not group["open"])
    concealed_triplets += sum(1 for group in groups if group["kind"] == "kan" and not group["open"])
    return concealed_triplets >= 3


def _is_suuankou(groups: list[dict], open_groups: list[dict]) -> bool:
    if any(group["open"] for group in open_groups):
        return False
    concealed_triplets = sum(1 for group in groups if group["kind"] in {"pon", "kan"} and not group["open"])
    return concealed_triplets >= 4


def _is_chanta(pair_type: int, groups: list[dict], strict: bool) -> bool:
    if strict and is_terminal_or_honor(pair_type):
        if pair_type >= 27:
            return False
    elif not is_terminal_or_honor(pair_type):
        return False

    for group in groups:
        types = group["types"]
        if group["kind"] == "chi":
            if strict:
                if types[0] % 9 not in (0, 6):
                    return False
            elif not (types[0] % 9 in (0, 6) or any(t >= 27 for t in types)):
                return False
        else:
            if strict:
                if types[0] >= 27 or types[0] % 9 not in (0, 8):
                    return False
            elif not is_terminal_or_honor(types[0]):
                return False
    return True


def _is_shousangen(counts: Counter) -> bool:
    triplets = sum(1 for t in DRAGON_NAMES if counts.get(t, 0) >= 3)
    pairs = sum(1 for t in DRAGON_NAMES if counts.get(t, 0) >= 2)
    return triplets == 2 and pairs == 3


def _append_wind_hint(hints: list[dict], counts: Counter, wind: str, label: str) -> None:
    wind_type = WIND_TYPE_MAP.get(wind)
    if wind_type is None:
        return
    cnt = counts.get(wind_type, 0)
    if cnt >= 3:
        hints.append({"name": f"역패({label} {wind})", "icon": "🌬", "status": "secured", "desc": f"{label} {wind} 3장으로 1판이 확정됩니다."})
    elif cnt == 2:
        hints.append({"name": f"역패({label} {wind})", "icon": "🌬", "status": "possible", "desc": f"{label} {wind} 2장이라 1장만 더 오면 빠른 1판입니다."})


def _has_sanshoku_seed(types: list[int]) -> bool:
    counts = Counter(t for t in types if t < 27)
    for start in range(0, 7):
        for suit in range(3):
            base = suit * 9
            if all(counts.get(base + start + offset, 0) >= 1 for offset in range(3)):
                continue
        # weak heuristic: any same-number adjacency across 2 suits
    starts = defaultdict(set)
    for t in counts:
        if t % 9 <= 6 and counts.get(t + 1, 0) and counts.get(t + 2, 0):
            starts[t % 9].add(t // 9)
    return any(len(suits) >= 2 for suits in starts.values())


def _has_sanshoku_doukou_seed(types: list[int]) -> bool:
    values = defaultdict(set)
    counts = Counter(t for t in types if t < 27)
    for t, count in counts.items():
        if count >= 2:
            values[t % 9].add(t // 9)
    return any(len(suits) >= 2 for suits in values.values())


def _has_iipeiko_seed(types: list[int]) -> bool:
    counts = Counter(t for t in types if t < 27)
    for suit in range(3):
        base = suit * 9
        for start in range(0, 7):
            if min(counts.get(base + start + offset, 0) for offset in range(3)) >= 2:
                return True
    return False


def _has_ittsu_seed(types: list[int]) -> bool:
    counts = Counter(t for t in types if t < 27)
    for suit in range(3):
        base = suit * 9
        if any(counts.get(base + i, 0) for i in range(3)) and any(counts.get(base + i, 0) for i in range(3, 6)) and any(counts.get(base + i, 0) for i in range(6, 9)):
            return True
    return False


def _next_dora_type(indicator_type: int) -> int:
    if indicator_type < 27:
        base = (indicator_type // 9) * 9
        offset = indicator_type % 9
        return base + ((offset + 1) % 9)
    if indicator_type in (27, 28, 29, 30):
        return 27 + ((indicator_type - 27 + 1) % 4)
    return 31 + ((indicator_type - 31 + 1) % 3)
