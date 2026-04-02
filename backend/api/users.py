from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import get_db, User
from crawler.tenhou_crawler import fetch_recent_games
from db.database import SessionLocal, Game
from datetime import datetime

router = APIRouter()


class UserCreate(BaseModel):
    tenhou_id: str


def _fetch_games_for_user(user_id: int, tenhou_id: str):
    db = SessionLocal()
    try:
        games = fetch_recent_games(tenhou_id)
        for game_data in games:
            exists = db.query(Game).filter_by(log_id=game_data["log_id"]).first()
            if not exists:
                db.add(Game(user_id=user_id, log_id=game_data["log_id"], played_at=game_data["played_at"]))
        db.commit()
    finally:
        db.close()


@router.post("/register")
def register_user(body: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(User).filter_by(tenhou_id=body.tenhou_id).first()
    if existing:
        background_tasks.add_task(_fetch_games_for_user, existing.id, existing.tenhou_id)
        return {"message": "이미 등록된 아이디입니다.", "user_id": existing.id}
    user = User(tenhou_id=body.tenhou_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    background_tasks.add_task(_fetch_games_for_user, user.id, user.tenhou_id)
    return {"message": "등록 완료", "user_id": user.id, "tenhou_id": user.tenhou_id}


@router.post("/{tenhou_id}/refresh")
def refresh_games(tenhou_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(tenhou_id=tenhou_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
    background_tasks.add_task(_fetch_games_for_user, user.id, user.tenhou_id)
    return {"message": "게임 목록을 새로고침합니다."}


@router.get("/{tenhou_id}")
def get_user(tenhou_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(tenhou_id=tenhou_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
    return {"user_id": user.id, "tenhou_id": user.tenhou_id}
