from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from db.database import get_db, User, Game, Report
from parser.tenhou_parser import fetch_log, parse_log
from analyzer.mahjong_analyzer import extract_key_moments
from llm.ollama_client import explain_key_moment, explain_summary
import json

router = APIRouter()


@router.get("/{tenhou_id}/list")
def get_game_list(tenhou_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(tenhou_id=tenhou_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    games = db.query(Game).filter_by(user_id=user.id).order_by(Game.played_at.desc()).limit(20).all()
    return {
        "games": [
            {
                "game_id": g.id,
                "log_id": g.log_id,
                "played_at": g.played_at,
                "has_report": g.report is not None
            }
            for g in games
        ]
    }


def _analyze_game_background(game_id: int, log_id: str):
    """백그라운드에서 게임 분석 실행"""
    from db.database import SessionLocal
    db = SessionLocal()
    try:
        log_xml = fetch_log(log_id)
        if not log_xml:
            return

        parsed = parse_log(log_xml)
        moments = extract_key_moments(parsed, player_index=0)

        # LLM으로 각 핵심 순간 설명 생성
        for moment in moments:
            moment["explanation"] = explain_key_moment(moment)

        # 전체 요약
        summary_data = {
            "mistake_count": len(moments),
            "biggest_mistake": moments[0]["actual_discard"] if moments else "없음",
            "tendency": "공격형" if len(moments) > 2 else "균형형"
        }
        summary_text = explain_summary(summary_data)

        report = Report(
            game_id=game_id,
            summary=summary_text,
            key_moments=json.dumps(moments, ensure_ascii=False),
            pattern_data=json.dumps(summary_data, ensure_ascii=False)
        )
        db.add(report)
        db.commit()
    finally:
        db.close()


@router.post("/{game_id}/analyze")
def analyze_game(game_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    game = db.query(Game).filter_by(id=game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다.")
    if game.report:
        return {"message": "이미 분석된 게임입니다.", "game_id": game_id}

    background_tasks.add_task(_analyze_game_background, game_id, game.log_id)
    return {"message": "분석을 시작했습니다. 잠시 후 리포트를 확인해주세요.", "game_id": game_id}
