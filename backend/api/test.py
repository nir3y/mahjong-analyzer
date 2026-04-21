from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db, User, Game, Report
from datetime import datetime
import json

router = APIRouter()

DUMMY_MOMENTS = [
    {
        "turn": 7,
        "round": 0,
        "actual_discard": "3통",
        "better_discard": "8삭",
        "hand_before": ["1만", "2만", "3만", "4만", "5만", "3통", "4통", "5통", "8삭", "중", "중", "발", "발", "동"],
        "actual_shanten": 1,
        "better_shanten": 0,
        "actual_effective_count": 4,
        "better_effective_count": 9,
        "better_tenpai_waits": ["2만", "5만", "8만"],
        "possible_yaku": ["리치", "핑후", "탄야오"],
        "expected_score_range": "3900~7700",
        "diff_score": 5,
        "explanation": "8삭을 버렸다면 리치+핑후 텐파이가 됩니다.\n2만, 5만, 8만으로 완성 가능하고 리치+핑후 기준 3900점, 도라가 붙으면 7700점까지 가능합니다.\n반면 실제로 버린 3통은 텐파이 형태가 줄어들고 역이 리치만 남아 평균 기대점이 낮아집니다.\n\n[핵심 교훈] 타패 선택 시 유효패 수를 최대화하는 방향을 고려하세요."
    },
    {
        "turn": 12,
        "round": 0,
        "actual_discard": "발",
        "better_discard": "동",
        "hand_before": ["1만", "2만", "3만", "4통", "5통", "6통", "2삭", "3삭", "4삭", "발", "중", "중", "동", "백"],
        "actual_shanten": 0,
        "better_shanten": 0,
        "actual_effective_count": 3,
        "better_effective_count": 6,
        "better_tenpai_waits": ["중"],
        "possible_yaku": ["리치", "탄야오"],
        "expected_score_range": "2000~3900",
        "diff_score": 3,
        "explanation": "동을 버리면 안전도가 높아지면서 중 단기 텐파이를 유지할 수 있습니다.\n발은 이미 상대가 1장 버린 상태라 론 대상이 될 수 있어 위험합니다.\n\n[핵심 교훈] 텐파이 상태에서는 상대 버림패를 보고 안전한 쪽을 버리세요."
    },
    {
        "turn": 4,
        "round": 1,
        "actual_discard": "1만",
        "better_discard": "9삭",
        "hand_before": ["1만", "2만", "3만", "4만", "3통", "4통", "5통", "7삭", "8삭", "9삭", "중", "중", "중", "백"],
        "actual_shanten": 1,
        "better_shanten": 1,
        "actual_effective_count": 5,
        "better_effective_count": 8,
        "better_tenpai_waits": ["5삭", "6삭"],
        "possible_yaku": ["리치", "탄야오", "이페코"],
        "expected_score_range": "5200~8000",
        "diff_score": 3,
        "explanation": "9삭을 버리면 탄야오(2~8 수패만) 조건을 유지하면서 유효패가 늘어납니다.\n1만을 버리면 탄야오가 깨지지 않지만 이미 중이 3장 있어 중 커쯔(3장 세트) 방향이 더 타점이 높습니다.\n\n[핵심 교훈] 초반에는 고타점 역 방향을 먼저 결정하고 그에 맞는 패를 정리하세요."
    }
]

DUMMY_SUMMARY = "전반적으로 공격적인 플레이를 보였으나 타패 선택에서 고타점 루트를 놓치는 경우가 있었습니다. 특히 텐파이 판단 시 유효패 수보다 빠른 완성을 우선시하는 경향이 보입니다. 안전패 관리와 고타점 루트 선택을 함께 고려하면 더 좋은 결과를 얻을 수 있습니다."


@router.get("/seed/{tenhou_id}")
def seed_test_data(tenhou_id: str, db: Session = Depends(get_db)):
    # 유저 생성 or 가져오기
    user = db.query(User).filter_by(tenhou_id=tenhou_id).first()
    if not user:
        user = User(tenhou_id=tenhou_id)
        db.add(user)
        db.commit()
        db.refresh(user)

    created_games = []

    # 3개 더미 게임 생성
    for i in range(3):
        log_id = f"test-dummy-{tenhou_id}-{i}"
        existing = db.query(Game).filter_by(log_id=log_id).first()
        if existing:
            created_games.append(existing)
            continue

        game = Game(
            user_id=user.id,
            log_id=log_id,
            played_at=datetime(2026, 4, i + 1)
        )
        db.add(game)
        db.commit()
        db.refresh(game)

        # 리포트도 바로 생성
        report = Report(
            game_id=game.id,
            summary=DUMMY_SUMMARY,
            key_moments=json.dumps(DUMMY_MOMENTS[:2 if i == 0 else 3], ensure_ascii=False),
            pattern_data=json.dumps({"mistake_count": 3, "tendency": "공격형"}, ensure_ascii=False)
        )
        db.add(report)
        db.commit()
        created_games.append(game)

    return {
        "message": f"{tenhou_id} 테스트 데이터 생성 완료",
        "games": [{"game_id": g.id, "log_id": g.log_id} for g in created_games]
    }
