"""Mahjong hand analysis helpers."""

from typing import Optional


def tile_name_to_id(name: str) -> Optional[int]:
    suit_map = {"만": 0, "통": 1, "삭": 2}
    honor_map = {"동": 27, "남": 28, "서": 29, "북": 30, "백": 31, "발": 32, "중": 33}
    if name in honor_map:
        return honor_map[name]
    if len(name) >= 2 and name[-1] in suit_map:
        try:
            num = int(name[:-1])
            return suit_map[name[-1]] * 9 + (num - 1)
        except ValueError:
            return None
    return None


def tiles_to_ids(tile_names: list[str]) -> list[int]:
    result: list[int] = []
    for name in tile_names:
        tid = tile_name_to_id(name)
        if tid is not None:
            result.append(tid)
    return result


def shanten(tiles: list[int], meld_count: int = 0) -> int:
    """Return shanten number for a standard hand, with light special-hand support."""
    counts = [0] * 34
    for t in tiles:
        if 0 <= t < 34:
            counts[t] += 1

    needed_groups = max(0, 4 - meld_count)
    best = max(0, 8 - meld_count * 2)

    for pair in range(34):
        if counts[pair] < 2:
            continue
        counts[pair] -= 2
        best = min(best, _calc_shanten_mentsu(counts, needed_groups, True))
        counts[pair] += 2

    best = min(best, _calc_shanten_mentsu(counts, needed_groups, False))

    if meld_count == 0:
        pairs = sum(1 for c in counts if c >= 2)
        best = min(best, 6 - pairs)

        terminals = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]
        unique = sum(1 for t in terminals if counts[t] >= 1)
        has_pair = any(counts[t] >= 2 for t in terminals)
        best = min(best, 13 - unique - (1 if has_pair else 0))

    return best


def _calc_shanten_mentsu(counts: list[int], needed: int, has_pair: bool) -> int:
    if needed == 0:
        return -1 if has_pair else 0

    best = needed * 2 + (0 if has_pair else 1)

    for i in range(34):
        if counts[i] == 0:
            continue

        if counts[i] >= 3:
            counts[i] -= 3
            best = min(best, _calc_shanten_mentsu(counts, needed - 1, has_pair))
            counts[i] += 3

        if i < 27 and i % 9 <= 6 and counts[i + 1] > 0 and counts[i + 2] > 0:
            counts[i] -= 1
            counts[i + 1] -= 1
            counts[i + 2] -= 1
            best = min(best, _calc_shanten_mentsu(counts, needed - 1, has_pair))
            counts[i] += 1
            counts[i + 1] += 1
            counts[i + 2] += 1

    return best


def get_effective_tiles(hand: list[int], meld_count: int = 0) -> list[int]:
    current = shanten(hand, meld_count=meld_count)
    effective: list[int] = []
    for tile in range(34):
        if shanten(hand + [tile], meld_count=meld_count) < current:
            effective.append(tile)
    return effective


def analyze_discard_options(hand_14: list[int], meld_count: int = 0) -> list[dict]:
    from parser.tenhou_parser import tile_to_name

    results = []
    seen = set()

    for i, tile in enumerate(hand_14):
        if tile in seen:
            continue
        seen.add(tile)

        remaining = hand_14[:i] + hand_14[i + 1 :]
        s = shanten(remaining, meld_count=meld_count)
        effective = get_effective_tiles(remaining, meld_count=meld_count) if s >= 0 else []

        results.append(
            {
                "discard": tile_to_name(tile),
                "discard_id": tile,
                "shanten": s,
                "effective_count": len(effective),
                "tenpai": s == 0,
                "effective_tiles": [tile_to_name(t) for t in effective],
            }
        )

    results.sort(key=lambda x: (x["shanten"], -x["effective_count"]))
    return results


def extract_key_moments(parsed_game: dict, player_index: int = 0) -> list[dict]:
    from parser.tenhou_parser import tile_to_name

    moments = []

    for round_data in parsed_game["rounds"]:
        draw_count = 0
        hand: list[int] = []

        if player_index < len(round_data["initial_hands"]):
            initial_names = round_data["initial_hands"][player_index]
            hand = tiles_to_ids(initial_names)

        for turn in round_data["turns"]:
            if turn["player"] != player_index:
                continue

            if turn["action"] == "draw":
                tile_id = tile_name_to_id(turn["tile"])
                if tile_id is not None:
                    hand.append(tile_id)
                draw_count += 1

            elif turn["action"] == "discard" and len(hand) == 14:
                options = analyze_discard_options(hand[:])
                if not options:
                    continue

                best = options[0]
                actual_discard = turn["tile"]
                actual = next((o for o in options if o["discard"] == actual_discard), None)

                if actual and best["discard"] != actual["discard"]:
                    diff = best["effective_count"] - actual["effective_count"]
                    if diff >= 2:
                        moments.append(
                            {
                                "turn": draw_count,
                                "round": round_data["round_index"],
                                "actual_discard": actual_discard,
                                "better_discard": best["discard"],
                                "hand_before": [tile_to_name(t) for t in sorted(hand)],
                                "actual_shanten": actual["shanten"],
                                "better_shanten": best["shanten"],
                                "actual_effective_count": actual["effective_count"],
                                "better_effective_count": best["effective_count"],
                                "better_tenpai_waits": best["effective_tiles"],
                                "possible_yaku": _guess_yaku(hand, best["discard_id"]),
                                "expected_score_range": _estimate_score(best),
                                "diff_score": diff,
                            }
                        )

                tile_id = tile_name_to_id(actual_discard)
                if tile_id is not None and tile_id in hand:
                    hand.remove(tile_id)

    moments.sort(key=lambda x: -x["diff_score"])
    return moments[:3]


def _guess_yaku(hand: list[int], discard_id: int) -> list[str]:
    remaining = [t for t in hand if t != discard_id]
    yaku: list[str] = []

    if all(2 <= (t % 9) <= 6 for t in remaining if t < 27) and all(t < 27 for t in remaining):
        yaku.append("탄야오")

    for suit in range(3):
        suit_tiles = [t for t in remaining if suit * 9 <= t < suit * 9 + 9]
        honor_tiles = [t for t in remaining if t >= 27]
        if len(suit_tiles) + len(honor_tiles) == len(remaining) and suit_tiles:
            yaku.append("혼일색")
            break

    if "리치" not in yaku:
        yaku.insert(0, "리치")

    return yaku[:3]


def _estimate_score(best_option: dict) -> str:
    if best_option["tenpai"]:
        waits = best_option["effective_count"]
        if waits >= 6:
            return "3900~7700"
        if waits >= 3:
            return "2000~5200"
        return "1000~3900"
    return "계산 중"
