import ollama

MODEL = "qwen2.5:7b"


def explain_key_moment(moment: dict) -> str:
    """
    핵심 타패 순간을 받아서 초중급자가 이해할 수 있는 한국어 설명 생성
    moment: {
        "turn": 7,
        "actual_discard": "3통",
        "better_discard": "8삭",
        "hand_before": ["1만", "2만", ...],
        "possible_yaku": ["리치", "핑후"],
        "tenpai_waits": ["2만", "5만", "8만"],
        "expected_score_range": "3900~7700"
    }
    """
    prompt = f"""
당신은 리치마작 초중급자를 가르치는 친절한 코치입니다.
아래 상황을 초중급자도 이해할 수 있게 한국어로 설명해주세요.

[상황]
- {moment['turn']}순에 플레이어가 {moment['actual_discard']}을(를) 버렸습니다.
- 하지만 {moment['better_discard']}을(를) 버리는 것이 더 좋은 선택이었습니다.
- 당시 손패: {', '.join(moment['hand_before'])}
- {moment['better_discard']}을(를) 버렸다면 가능한 역: {', '.join(moment['possible_yaku'])}
- 텐파이 대기패: {', '.join(moment['tenpai_waits'])}
- 예상 점수: {moment['expected_score_range']}점

[설명 형식]
1. 어떤 선택이 더 좋았는지 (1~2문장)
2. 왜 더 좋은지 이유 (역과 점수 관점에서, 2~3문장)
3. 뉴비를 위한 핵심 교훈 (1문장)

전문 용어는 괄호 안에 간단히 설명을 붙여주세요.
"""
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]


def explain_summary(game_summary: dict) -> str:
    """
    전체 판 요약 설명 생성
    """
    prompt = f"""
당신은 리치마작 초중급자를 가르치는 친절한 코치입니다.
아래 게임 데이터를 바탕으로 이번 판 전체 평가를 한국어로 2~3문장으로 요약해주세요.

[데이터]
- 총 실수 횟수: {game_summary['mistake_count']}번
- 가장 큰 실수 순간: {game_summary['biggest_mistake']}
- 주요 플레이 경향: {game_summary['tendency']}

짧고 핵심만 담아서 설명해주세요.
"""
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]


def explain_pattern(pattern_data: dict) -> str:
    """
    다판 패턴 분석 설명 생성
    """
    prompt = f"""
당신은 리치마작 초중급자를 가르치는 친절한 코치입니다.
아래는 플레이어의 최근 {pattern_data['game_count']}판 분석 데이터입니다.
반복되는 약점을 초중급자가 이해할 수 있게 한국어로 설명해주세요.

[패턴 데이터]
- 평균 실수 횟수/판: {pattern_data['avg_mistakes']}번
- 가장 자주 하는 실수 유형: {pattern_data['common_mistakes']}
- 주의해야 할 상황: {pattern_data['warning_situations']}

[설명 형식]
1. 가장 고쳐야 할 습관 (1~2문장)
2. 구체적인 개선 방법 (2~3문장)
"""
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]


def analyze_screenshot(image_description: str) -> str:
    """
    스크린샷 상황 분석 및 설명 생성
    """
    prompt = f"""
당신은 리치마작 전문가이자 친절한 코치입니다.
아래 마작 게임 상황을 초보자도 이해할 수 있게 한국어로 설명해주세요.

[게임 상황]
{image_description}

다음을 포함해서 설명해주세요:
1. 현재 상황이 무엇인지 (후리텐, 론 불가, 역 설명 등)
2. 왜 그런 상황이 발생했는지
3. 앞으로 어떻게 하면 좋은지

전문 용어는 괄호 안에 쉽게 설명해주세요.
"""
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]
