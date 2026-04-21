from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from db.database import init_db
from api import games, users, reports, screenshot, test, game_http, websocket as ws_router
from crawler.tenhou_crawler import crawl_all_users

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler.add_job(crawl_all_users, "interval", minutes=30)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Mahjong Analyzer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(screenshot.router, prefix="/api/screenshot", tags=["screenshot"])
app.include_router(test.router, prefix="/api/test", tags=["test"])
app.include_router(game_http.router, prefix="/api/game", tags=["game"])
app.include_router(ws_router.router, tags=["game-ws"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Mahjong Analyzer API"}
