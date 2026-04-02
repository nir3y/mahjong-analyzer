#!/bin/bash
echo "🀄 마작 복기 코치 시작"

# 백엔드
echo "백엔드 시작..."
cd backend
source venv/Scripts/activate
uvicorn main:app --reload --port 8000 &
cd ..

# 프론트엔드
echo "프론트엔드 시작..."
cd frontend
npm run dev &

echo ""
echo "✅ 실행 완료"
echo "프론트엔드: http://localhost:5173"
echo "백엔드 API: http://localhost:8000"
echo "API 문서:   http://localhost:8000/docs"
