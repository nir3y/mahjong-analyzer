from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./mahjong.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    tenhou_id = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    games = relationship("Game", back_populates="user")


class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    log_id = Column(String, unique=True, nullable=False)
    played_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="games")
    report = relationship("Report", back_populates="game", uselist=False)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"), unique=True)
    summary = Column(Text)           # 전체 판 한 줄 평가
    key_moments = Column(Text)       # JSON: 핵심 순간 TOP 3
    pattern_data = Column(Text)      # JSON: 패턴 분석용 원시 데이터
    created_at = Column(DateTime, default=datetime.utcnow)
    game = relationship("Game", back_populates="report")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
