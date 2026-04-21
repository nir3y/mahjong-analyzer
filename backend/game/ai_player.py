"""
룰베이스 AI 플레이어
- 샨텐수가 가장 낮아지는 패를 버리는 전략
- 동점 시 자패 > 노패(1,9) > 수패 순으로 우선 버림
"""
from game.tile_utils import raw_to_type, is_terminal_or_honor, analyze_discard_options_types


class RuleBasedAI:
    def choose_discard(self, hand_raw: list[int]) -> int:
        """
        14장 손패(raw ID)에서 버릴 패 선택
        반환: 버릴 패의 raw ID
        """
        if not hand_raw:
            return hand_raw[0]

        options = analyze_discard_options_types(hand_raw)
        if not options:
            return hand_raw[-1]

        # 최선 선택 (샨텐수 최소, 유효패 최대)
        best = options[0]
        best_shanten = best["shanten"]
        best_effective = best["effective_count"]

        # 동점 후보 중 자패·노패 우선 버림
        candidates = [
            o for o in options
            if o["shanten"] == best_shanten and o["effective_count"] == best_effective
        ]

        # 자패 먼저
        for c in candidates:
            t = raw_to_type(c["discard_raw"])
            if t >= 27:
                return c["discard_raw"]

        # 노패(1,9) 다음
        for c in candidates:
            t = raw_to_type(c["discard_raw"])
            if is_terminal_or_honor(t):
                return c["discard_raw"]

        return candidates[0]["discard_raw"]
