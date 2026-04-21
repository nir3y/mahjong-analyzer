"""Realtime mahjong table engine for the coaching mode."""

from __future__ import annotations

import uuid
from collections import Counter
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from game.ai_player import RuleBasedAI
from game.tile_utils import analyze_discard_options_types, build_wall, raw_to_name, raw_to_type, type_to_name
from game.yaku_detector import check_tenpai, check_win, count_dora, detect_yaku, estimate_score, get_hand_yaku_hints, get_winning_tiles


class GamePhase(str, Enum):
    WAITING = "waiting"
    PLAYER_DRAW = "player_draw"
    PLAYER_REACTION = "player_reaction"
    AI_TURN = "ai_turn"
    PLAYER_WIN = "player_win"
    AI_WIN = "ai_win"
    DRAW_GAME = "draw_game"


@dataclass
class Meld:
    kind: str
    tiles: list[int]
    from_player: int
    called_tile: int
    open: bool = True

    def to_client(self) -> dict:
        return {
            "kind": self.kind,
            "tiles": list(self.tiles),
            "tile_names": [raw_to_name(t) for t in self.tiles],
            "from_player": self.from_player,
            "called_tile": self.called_tile,
            "open": self.open,
        }


@dataclass
class ReactionOption:
    kind: str
    use_types: list[int]
    label: str
    reason: str

    def to_client(self) -> dict:
        return {
            "kind": self.kind,
            "use_types": list(self.use_types),
            "use_names": [type_to_name(t) for t in self.use_types],
            "label": self.label,
            "reason": self.reason,
        }


@dataclass
class PendingReaction:
    from_player: int
    discard: int
    options: list[ReactionOption] = field(default_factory=list)
    can_ron: bool = False

    def to_client(self) -> dict:
        return {
            "from_player": self.from_player,
            "discard": self.discard,
            "discard_name": raw_to_name(self.discard),
            "can_ron": self.can_ron,
            "options": [o.to_client() for o in self.options],
        }


@dataclass
class PlayerState:
    index: int
    hand: list[int] = field(default_factory=list)
    discards: list[int] = field(default_factory=list)
    melds: list[Meld] = field(default_factory=list)
    in_riichi: bool = False
    is_human: bool = False
    score: int = 25000


class MahjongGame:
    ROUND_NAMES = ["동1국", "동2국", "동3국", "동4국"]

    def __init__(self):
        self.game_id = str(uuid.uuid4())
        self.wall: list[int] = []
        self.dead_wall: list[int] = []
        self.wall_index = 0
        self.dead_wall_index = 0
        self.dora_indicators: list[int] = []
        self.players: list[PlayerState] = []
        self.current_player = 0
        self.dealer = 0
        self.turn_number = 0
        self.phase = GamePhase.WAITING
        self.round_name = self.ROUND_NAMES[0]
        self.honba = 0
        self.riichi_sticks = 0
        self.drawn_tile: Optional[int] = None
        self.last_discard: Optional[int] = None
        self.last_discard_player: Optional[int] = None
        self.pending_reaction: Optional[PendingReaction] = None
        self.history: list[dict] = []
        self._ai = RuleBasedAI()

    def initialize(self) -> None:
        wall = build_wall()
        self.dead_wall = wall[-14:]
        self.wall = wall[:-14]
        self.wall_index = 0
        self.dead_wall_index = 0
        self.dora_indicators = [self.dead_wall[4]]
        self.players = [PlayerState(index=i, is_human=(i == 0)) for i in range(4)]

        for player in self.players:
            for _ in range(13):
                player.hand.append(self._draw_from_wall())

        self.current_player = self.dealer
        self.turn_number = 0
        self.phase = GamePhase.WAITING
        self.honba = 0
        self.riichi_sticks = 0
        self.drawn_tile = None
        self.last_discard = None
        self.last_discard_player = None
        self.pending_reaction = None
        self.history = []

    def _draw_from_wall(self) -> int:
        if self.wall_index >= len(self.wall):
            return -1
        tile = self.wall[self.wall_index]
        self.wall_index += 1
        return tile

    def _draw_from_dead_wall(self) -> int:
        if self.dead_wall_index >= len(self.dead_wall):
            return -1
        tile = self.dead_wall[self.dead_wall_index]
        self.dead_wall_index += 1
        return tile

    def _reveal_extra_dora(self) -> None:
        reveal_idx = 4 + len(self.dora_indicators)
        if reveal_idx < len(self.dead_wall):
            self.dora_indicators.append(self.dead_wall[reveal_idx])

    def tiles_remaining(self) -> int:
        return max(0, len(self.wall) - self.wall_index)

    def _meld_count(self, player_index: int) -> int:
        return len(self.players[player_index].melds)

    def _full_hand(self, player_index: int, extra_tile: Optional[int] = None) -> list[int]:
        tiles = list(self.players[player_index].hand)
        for meld in self.players[player_index].melds:
            tiles.extend(meld.tiles)
        if extra_tile is not None:
            tiles.append(extra_tile)
        return tiles

    def _seat_winds(self) -> dict[str, str]:
        winds = ["동", "남", "서", "북"]
        return {str(i): winds[(i - self.dealer) % 4] for i in range(4)}

    def _round_wind(self) -> str:
        return "동"

    def _all_discards(self) -> dict[str, list[int]]:
        return {str(i): list(player.discards) for i, player in enumerate(self.players)}

    def _all_melds(self) -> dict[str, list[dict]]:
        return {str(i): [meld.to_client() for meld in player.melds] for i, player in enumerate(self.players)}

    def _shared_state(self) -> dict:
        seat_winds = self._seat_winds()
        return {
            "phase": self.phase.value,
            "round_name": self.round_name,
            "round_wind": self._round_wind(),
            "dealer": self.dealer,
            "turn_number": self.turn_number,
            "tiles_remaining": self.tiles_remaining(),
            "discards": self._all_discards(),
            "melds": self._all_melds(),
            "scores": {str(i): self.players[i].score for i in range(4)},
            "ai_hand_sizes": [len(self.players[i].hand) for i in range(1, 4)],
            "your_in_riichi": self.players[0].in_riichi,
            "your_seat_wind": seat_winds["0"],
            "seat_winds": seat_winds,
            "dora_indicators": list(self.dora_indicators),
            "dora_indicator_names": [raw_to_name(t) for t in self.dora_indicators],
            "honba": self.honba,
            "riichi_sticks": self.riichi_sticks,
            "pending_reaction": self.pending_reaction.to_client() if self.pending_reaction else None,
        }

    def to_client_state(self) -> dict:
        return {
            "game_id": self.game_id,
            "your_hand": list(self.players[0].hand),
            "your_hand_names": [raw_to_name(r) for r in self.players[0].hand],
            "drawn_tile": self.drawn_tile,
            **self._shared_state(),
        }

    def _build_draw_event(self, tile: Optional[int] = None, call_context: Optional[dict] = None) -> dict:
        can_tsumo = check_win(self._full_hand(0), meld_count=self._meld_count(0))
        options = analyze_discard_options_types(self.players[0].hand, meld_count=self._meld_count(0))
        best_discard_raw = options[0]["discard_raw"] if options else None
        yaku_hints = get_hand_yaku_hints(
            self._full_hand(0),
            seat_wind=self._seat_winds()["0"],
            round_wind=self._round_wind(),
            open_hand=bool(self.players[0].melds),
        )

        strategic_note = self._strategic_note(options[0] if options else None)
        return {
            "event": "draw_tile",
            "tile": tile,
            "tile_name": raw_to_name(tile) if tile is not None else None,
            "your_hand": list(self.players[0].hand),
            "shanten_options": options,
            "best_discard_raw": best_discard_raw,
            "can_tsumo": can_tsumo,
            "yaku_hints": yaku_hints,
            "strategic_note": strategic_note,
            "call_context": call_context,
            **self._shared_state(),
        }

    def draw_for_human(self, from_dead_wall: bool = False, call_context: Optional[dict] = None) -> dict:
        if self.tiles_remaining() == 0 and not from_dead_wall:
            self.phase = GamePhase.DRAW_GAME
            return {
                "event": "draw_game",
                "tenpai_players": self._get_tenpai_players(),
                "history": self.history,
                **self._shared_state(),
            }

        self.turn_number += 1
        tile = self._draw_from_dead_wall() if from_dead_wall else self._draw_from_wall()
        self.drawn_tile = tile
        if tile >= 0:
            self.players[0].hand.append(tile)
        self.phase = GamePhase.PLAYER_DRAW
        return self._build_draw_event(tile=tile, call_context=call_context)

    def _strategic_note(self, best_option: Optional[dict]) -> dict:
        if not best_option:
            return {"title": "패산 분석 대기", "detail": "다음 패를 받은 뒤 추천이 계산됩니다."}
        if self.tiles_remaining() <= 18 and best_option["shanten"] >= 2:
            return {"title": "속도보다 안전", "detail": "종반이라 느린 손입니다. 리치자 현물과 수비패를 함께 확인하세요."}
        if self.players[0].melds:
            return {"title": "오픈핸드 운영", "detail": "후로를 했으니 빠른 텐파이와 역 확보를 우선하는 편이 좋습니다."}
        if best_option["tenpai"]:
            return {"title": "리치 후보", "detail": "최선 타패가 텐파이를 만듭니다. 대기 수와 타점을 함께 보고 선택하세요."}
        return {"title": "효율 우선", "detail": "현재는 유효패 수를 늘리는 선택이 가장 중요합니다."}

    def _coaching_payload(self, hand_before: list[int], tile_raw: int) -> Optional[dict]:
        options = analyze_discard_options_types(hand_before, meld_count=self._meld_count(0))
        best_option = options[0] if options else None
        actual_option = next((o for o in options if o["discard_raw"] == tile_raw), None)
        if actual_option is None:
            tile_type = raw_to_type(tile_raw)
            actual_option = next((o for o in options if raw_to_type(o["discard_raw"]) == tile_type), None)

        if not best_option or not actual_option:
            return None

        is_suboptimal = raw_to_type(best_option["discard_raw"]) != raw_to_type(tile_raw) and (
            best_option["shanten"] < actual_option["shanten"]
            or best_option["effective_count"] - actual_option["effective_count"] >= 2
        )
        if not is_suboptimal:
            return None

        return {
            "your_discard_raw": tile_raw,
            "your_discard_name": raw_to_name(tile_raw),
            "best_discard_raw": best_option["discard_raw"],
            "best_discard_name": best_option["discard_name"],
            "shanten_after_your_choice": actual_option["shanten"],
            "shanten_after_best_choice": best_option["shanten"],
            "effective_count_delta": best_option["effective_count"] - actual_option["effective_count"],
            "hand_names": [raw_to_name(r) for r in self.players[0].hand if r != tile_raw],
            "dora_count": count_dora(self._full_hand(0), self.dora_indicators),
            "open_meld_count": len(self.players[0].melds),
            "llm_message": None,
        }

    def player_discard(self, tile_raw: int) -> dict:
        if self.phase not in {GamePhase.PLAYER_DRAW, GamePhase.PLAYER_REACTION}:
            raise ValueError("지금은 패를 버릴 수 없습니다.")
        if tile_raw not in self.players[0].hand:
            raise ValueError("해당 패가 손패에 없습니다.")

        hand_before = list(self.players[0].hand)
        coaching_data = self._coaching_payload(hand_before, tile_raw)

        self.players[0].hand.remove(tile_raw)
        self.players[0].discards.append(tile_raw)
        self.last_discard = tile_raw
        self.last_discard_player = 0
        self.drawn_tile = None
        self.pending_reaction = None

        ai_ron_event = self._maybe_ai_ron(tile_raw)
        was_optimal = coaching_data is None
        best_option = analyze_discard_options_types(hand_before, meld_count=self._meld_count(0))
        best_option = best_option[0] if best_option else None
        actual_option = analyze_discard_options_types(hand_before, meld_count=self._meld_count(0))
        actual_option = next((o for o in actual_option if raw_to_type(o["discard_raw"]) == raw_to_type(tile_raw)), None)

        self.history.append(
            {
                "turn": self.turn_number,
                "hand_before_names": [raw_to_name(r) for r in hand_before],
                "chosen_discard_raw": tile_raw,
                "chosen_discard_name": raw_to_name(tile_raw),
                "best_discard_raw": best_option["discard_raw"] if best_option else tile_raw,
                "best_discard_name": best_option["discard_name"] if best_option else raw_to_name(tile_raw),
                "was_optimal": was_optimal,
                "shanten_chosen": actual_option["shanten"] if actual_option else 0,
                "shanten_best": best_option["shanten"] if best_option else 0,
                "effective_chosen": actual_option["effective_count"] if actual_option else 0,
                "effective_best": best_option["effective_count"] if best_option else 0,
                "meld_count": len(self.players[0].melds),
                "dora_count": count_dora(self._full_hand(0), self.dora_indicators),
            }
        )

        if ai_ron_event:
            self.phase = GamePhase.AI_WIN
            return {"coaching_data": coaching_data, "result_event": ai_ron_event, **self._shared_state()}

        self.phase = GamePhase.AI_TURN
        return {"discards": self._all_discards(), "coaching_data": coaching_data, **self._shared_state()}

    def declare_riichi(self, discard_raw: int) -> dict:
        if self.players[0].melds:
            raise ValueError("후로한 손은 리치를 선언할 수 없습니다.")
        if self.players[0].in_riichi:
            raise ValueError("이미 리치를 선언했습니다.")
        if discard_raw not in self.players[0].hand:
            raise ValueError("해당 패가 손패에 없습니다.")

        temp_hand = [r for r in self.players[0].hand if r != discard_raw]
        if not check_tenpai(temp_hand, meld_count=self._meld_count(0)):
            raise ValueError("텐파이가 되는 버림패만 리치할 수 있습니다.")

        result = self.player_discard(discard_raw)
        self.players[0].in_riichi = True
        self.players[0].score -= 1000
        self.riichi_sticks += 1
        result["riichi_declared"] = True
        result["winning_tiles"] = [type_to_name(t) for t in get_winning_tiles(self.players[0].hand, meld_count=self._meld_count(0))]
        result["scores"] = {str(i): self.players[i].score for i in range(4)}
        result["riichi_sticks"] = self.riichi_sticks
        return result

    def declare_tsumo(self) -> dict:
        if not check_win(self._full_hand(0), meld_count=self._meld_count(0)):
            raise ValueError("아직 화료 형태가 아닙니다.")
        return self._resolve_win(winner=0, win_type="tsumo", winning_tile=self.drawn_tile, loser=None)

    def declare_ron(self) -> dict:
        if self.last_discard is None or self.last_discard_player == 0:
            raise ValueError("론할 패가 없습니다.")
        full_hand = self._full_hand(0, self.last_discard)
        if not check_win(full_hand, meld_count=self._meld_count(0)):
            raise ValueError("론할 수 있는 형태가 아닙니다.")
        return self._resolve_win(winner=0, win_type="ron", winning_tile=self.last_discard, loser=self.last_discard_player)

    def claim_reaction(self, kind: str, use_types: list[int]) -> dict:
        if not self.pending_reaction:
            raise ValueError("지금은 호출할 수 없습니다.")
        option = next((o for o in self.pending_reaction.options if o.kind == kind and o.use_types == use_types), None)
        if option is None:
            raise ValueError("선택한 호출이 현재 불가능합니다.")

        consumed = self._take_tiles_by_types(0, option.use_types)
        meld_tiles = sorted(consumed + [self.pending_reaction.discard], key=raw_to_type)
        meld = Meld(kind=kind, tiles=meld_tiles, from_player=self.pending_reaction.from_player, called_tile=self.pending_reaction.discard)
        self.players[0].melds.append(meld)
        self.pending_reaction = None

        if kind == "kan":
            self._reveal_extra_dora()
            return self.draw_for_human(
                from_dead_wall=True,
                call_context={
                    "kind": kind,
                    "called_tile": meld.called_tile,
                    "called_tile_name": raw_to_name(meld.called_tile),
                    "message": "대명깡 후 린샹패를 가져왔습니다.",
                },
            )

        self.phase = GamePhase.PLAYER_DRAW
        self.drawn_tile = None
        return self._build_draw_event(
            tile=None,
            call_context={
                "kind": kind,
                "called_tile": meld.called_tile,
                "called_tile_name": raw_to_name(meld.called_tile),
                "message": f"{kind.upper()} 후 직접 버림패를 선택하세요.",
            },
        )

    def pass_reaction(self) -> dict:
        if not self.pending_reaction:
            raise ValueError("지금은 패스를 할 상황이 아닙니다.")
        from_player = self.pending_reaction.from_player
        self.pending_reaction = None
        self.phase = GamePhase.AI_TURN
        return {"resume_from": (from_player + 1) % 4, **self._shared_state()}

    def run_ai_turns(self, start_player: int = 1):
        player = start_player % 4

        while player != 0:
            if self.tiles_remaining() == 0:
                self.phase = GamePhase.DRAW_GAME
                yield {
                    "event": "draw_game",
                    "tenpai_players": self._get_tenpai_players(),
                    "history": self.history,
                    **self._shared_state(),
                }
                return

            tile = self._draw_from_wall()
            self.players[player].hand.append(tile)

            if check_win(self._full_hand(player), meld_count=self._meld_count(player)):
                yield self._resolve_win(winner=player, win_type="tsumo", winning_tile=tile, loser=None)
                return

            discard_raw = self._ai.choose_discard(self.players[player].hand)
            self.players[player].hand.remove(discard_raw)
            self.players[player].discards.append(discard_raw)
            self.last_discard = discard_raw
            self.last_discard_player = player

            can_ron = check_win(self._full_hand(0, discard_raw), meld_count=self._meld_count(0)) and not self._is_furiten()
            reaction_options = self._reaction_options(player, discard_raw)
            self.phase = GamePhase.AI_TURN

            if can_ron or reaction_options:
                self.pending_reaction = PendingReaction(from_player=player, discard=discard_raw, options=reaction_options, can_ron=can_ron)
                self.phase = GamePhase.PLAYER_REACTION
            else:
                self.pending_reaction = None

            yield {
                "event": "ai_discard",
                "player": player,
                "tile": discard_raw,
                "tile_name": raw_to_name(discard_raw),
                "tiles_remaining": self.tiles_remaining(),
                "can_ron": can_ron,
                "ron_tile": discard_raw if can_ron else None,
                "reaction_options": [o.to_client() for o in reaction_options],
                "reaction_prompt": self.pending_reaction.to_client() if self.pending_reaction else None,
                **self._shared_state(),
            }

            if self.pending_reaction:
                return

            player = (player + 1) % 4

    def _reaction_options(self, from_player: int, discard_raw: int) -> list[ReactionOption]:
        if self.players[0].in_riichi:
            return []

        discard_type = raw_to_type(discard_raw)
        hand_types = sorted(raw_to_type(t) for t in self.players[0].hand)
        counts = Counter(hand_types)
        options: list[ReactionOption] = []

        if counts[discard_type] >= 3:
            options.append(ReactionOption("kan", [discard_type, discard_type, discard_type], "깡", "도라를 늘리지만 수비 여유는 줄어듭니다."))
        if counts[discard_type] >= 2:
            options.append(ReactionOption("pon", [discard_type, discard_type], "퐁", "속도를 크게 높일 수 있는 호출입니다."))

        if from_player == 3:
            base = discard_type // 9
            index = discard_type % 9
            if discard_type < 27:
                chi_patterns = []
                if index >= 2:
                    chi_patterns.append([discard_type - 2, discard_type - 1])
                if 1 <= index <= 7:
                    chi_patterns.append([discard_type - 1, discard_type + 1])
                if index <= 6:
                    chi_patterns.append([discard_type + 1, discard_type + 2])
                for pattern in chi_patterns:
                    if all(t // 9 == base and counts[t] >= 1 for t in pattern):
                        names = ", ".join(type_to_name(t) for t in pattern)
                        options.append(ReactionOption("chi", pattern, "치", f"{names}를 써서 순자를 만들 수 있습니다."))

        unique = {}
        for option in options:
            unique[(option.kind, tuple(option.use_types))] = option
        return list(unique.values())

    def _take_tiles_by_types(self, player_index: int, use_types: list[int]) -> list[int]:
        hand = self.players[player_index].hand
        consumed: list[int] = []
        for tile_type in use_types:
            raw = next((tile for tile in hand if raw_to_type(tile) == tile_type and tile not in consumed), None)
            if raw is None:
                raise ValueError("호출에 필요한 패가 손패에 없습니다.")
            consumed.append(raw)
        for raw in consumed:
            hand.remove(raw)
        return consumed

    def _maybe_ai_ron(self, discard_raw: int) -> Optional[dict]:
        for player_index in range(1, 4):
            full_hand = self._full_hand(player_index, discard_raw)
            if check_win(full_hand, meld_count=self._meld_count(player_index)):
                return self._resolve_win(winner=player_index, win_type="ron", winning_tile=discard_raw, loser=0)
        return None

    def _resolve_win(self, winner: int, win_type: str, winning_tile: Optional[int], loser: Optional[int]) -> dict:
        self.phase = GamePhase.PLAYER_WIN if winner == 0 else GamePhase.AI_WIN

        melds = [meld.to_client() for meld in self.players[winner].melds]
        open_hand = bool(self.players[winner].melds)
        hand = self._full_hand(winner, None if win_type == "tsumo" else winning_tile)
        yaku = detect_yaku(
            hand,
            self.players[winner].in_riichi,
            win_type == "tsumo",
            melds=melds,
            seat_wind=self._seat_winds()[str(winner)],
            round_wind=self._round_wind(),
            dora_indicators=self.dora_indicators,
        )
        score = estimate_score(yaku, win_type == "tsumo", open_hand=open_hand)
        self._apply_score_delta(winner, loser, score, win_type)

        if winner == 0 and self.riichi_sticks:
            self.players[0].score += self.riichi_sticks * 1000
            self.riichi_sticks = 0

        self.pending_reaction = None
        return {
            "event": "win_declared",
            "winner": winner,
            "win_type": win_type,
            "winning_tile": winning_tile,
            "hand": hand,
            "hand_names": [raw_to_name(r) for r in hand],
            "melds": melds,
            "yaku": yaku,
            "score": score,
            "is_human_win": winner == 0,
            "history": self.history,
            **self._shared_state(),
        }

    def _apply_score_delta(self, winner: int, loser: Optional[int], score: int, win_type: str) -> None:
        if win_type == "ron" and loser is not None:
            self.players[winner].score += score
            self.players[loser].score -= score
            return

        per_player = max(100, round(score / 3 / 100) * 100)
        for idx, player in enumerate(self.players):
            if idx == winner:
                continue
            player.score -= per_player
            self.players[winner].score += per_player

    def _get_tenpai_players(self) -> list[int]:
        result = []
        for player in self.players:
            if check_tenpai(player.hand, meld_count=len(player.melds)):
                result.append(player.index)
        return result

    def _is_furiten(self) -> bool:
        winning_types = set(get_winning_tiles(self.players[0].hand, meld_count=self._meld_count(0)))
        return any(raw_to_type(tile) in winning_types for tile in self.players[0].discards)
