@echo off
echo 마작 복기 코치 시작 중...

:: 백엔드
cd backend
if not exist venv (
    echo 가상환경 생성 중...
    python -m venv venv
)
call venv\Scripts\activate
echo 패키지 설치 중...
pip install -r requirements.txt -q
echo 백엔드 시작...
start cmd /k "call venv\Scripts\activate && uvicorn main:app --reload"
cd ..

:: 프론트엔드
cd frontend
echo 프론트엔드 패키지 설치 중...
call npm install -q
echo 프론트엔드 시작...
start cmd /k "npm run dev"
cd ..

echo.
echo 실행 완료
echo 브라우저에서 http://localhost:5173 접속하세요
