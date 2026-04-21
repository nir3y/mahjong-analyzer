from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db, Report, Game, User
from llm.ollama_client import explain_pattern
import json

router = APIRouter()


@router.get("/game/{game_id}")
def get_report(game_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter_by(game_id=game_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="아직 분석이 완료되지 않았습니다.")

    key_moments = json.loads(report.key_moments) if report.key_moments else []

    return {
        "game_id": game_id,
        "summary": report.summary,
        "key_moments": key_moments,
        "created_at": report.created_at
    }


@router.get("/pattern/{tenhou_id}")
def get_pattern_analysis(tenhou_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(tenhou_id=tenhou_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    games = db.query(Game).filter_by(user_id=user.id).all()
    reports = [g.report for g in games if g.report]

    if len(reports) < 3:
        return {"message": f"패턴 분석은 최소 3판 이상 필요합니다. (현재 {len(reports)}판)"}

    # 전체 핵심 순간 수집
    all_moments = []
    for r in reports:
        moments = json.loads(r.key_moments) if r.key_moments else []
        all_moments.extend(moments)

    # 자주 하는 실수 유형 집계
    mistake_types = {}
    for m in all_moments:
        key = f"{m.get('actual_discard', '?')} 대신 {m.get('better_discard', '?')}"
        mistake_types[key] = mistake_types.get(key, 0) + 1

    top_mistakes = sorted(mistake_types.items(), key=lambda x: -x[1])[:3]

    pattern_data = {
        "game_count": len(reports),
        "avg_mistakes": round(len(all_moments) / len(reports), 1),
        "common_mistakes": ", ".join([f"{k}({v}회)" for k, v in top_mistakes]),
        "warning_situations": "리치 타이밍" if len(all_moments) > 5 else "수비 전환"
    }

    try:
        explanation = explain_pattern(pattern_data)
    except Exception:
        explanation = None

    return {
        "tenhou_id": tenhou_id,
        "game_count": len(reports),
        "avg_mistakes_per_game": pattern_data["avg_mistakes"],
        "top_mistakes": top_mistakes,
        "explanation": explanation
    }
