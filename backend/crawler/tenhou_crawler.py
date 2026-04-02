import requests
import urllib3
from bs4 import BeautifulSoup
from datetime import datetime
from db.database import SessionLocal, User, Game

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

HEADERS = {"User-Agent": "Mozilla/5.0"}


def fetch_recent_games(tenhou_id: str) -> list[dict]:
    """
    천봉 공개 페이지에서 유저의 최근 게임 목록을 가져옴
    반환: [{"log_id": "...", "played_at": datetime}, ...]
    """
    url = f"https://tenhou.net/0/log/?"
    # 천봉 플레이어 로그 목록 페이지
    history_url = f"https://tenhou.net/sc/raw/dat/{tenhou_id}.js"
    try:
        res = requests.get(history_url, headers=HEADERS, timeout=10, verify=False)
        res.raise_for_status()
        games = []
        # 응답은 JS 형식: addData([...]) 형태
        text = res.text
        if "addData" in text:
            import re, json
            match = re.search(r'addData\((\[.*?\])\)', text, re.DOTALL)
            if match:
                data = json.loads(match.group(1))
                for entry in data:
                    if isinstance(entry, list) and len(entry) >= 2:
                        games.append({
                            "log_id": entry[0],
                            "played_at": datetime.utcnow()
                        })
        return games
    except Exception as e:
        print(f"천봉 기록 가져오기 실패 ({tenhou_id}): {e}")
        return []


def crawl_all_users():
    """
    등록된 모든 유저의 새 게임을 확인하고 DB에 저장
    크론잡으로 N분마다 실행됨
    """
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            games = fetch_recent_games(user.tenhou_id)
            new_count = 0
            for game_data in games:
                exists = db.query(Game).filter_by(log_id=game_data["log_id"]).first()
                if not exists:
                    new_game = Game(
                        user_id=user.id,
                        log_id=game_data["log_id"],
                        played_at=game_data["played_at"]
                    )
                    db.add(new_game)
                    new_count += 1
            if new_count > 0:
                db.commit()
                print(f"[크롤러] {user.tenhou_id}: {new_count}개 새 게임 발견")
    finally:
        db.close()
