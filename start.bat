@echo off
cd /d "%~dp0"

:: Backend
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt -q
start cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn main:app --reload"
cd ..

:: Frontend
cd frontend
call npm install -q
start cmd /k "cd /d %~dp0frontend && npm run dev"
cd ..

echo Done. Open http://localhost:5173
pause
