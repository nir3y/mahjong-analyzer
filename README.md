# 🀄 마작 복기 코치

천봉 리플레이를 분석해서 내가 놓친 고타점 루트와 패 선택 이유를 쉬운 말로 설명해주는 AI 복기 서비스

---

## 주요 기능

### 📊 판 리포트카드
- 천봉 로그를 분석해서 1페이지 요약 자동 생성
- 핵심 타패 결정 TOP 3 하이라이트
- "X 대신 Y를 버렸다면 → 가능 족보 + 예상 타점 + 이유" 언어로 설명

### 📈 다판 패턴 분석
- 여러 판을 누적해서 반복되는 약점 진단
- "리치 타이밍이 항상 늦다", "수비 전환을 못 한다" 등 패턴 레벨 피드백

### 🔍 스크린샷 상황 분석기
- 게임 스크린샷 업로드 → AI가 상황 설명
- 후리텐, 론 불가, 역 성립 여부, 점수 계산 등 즉시 분석

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + FastAPI |
| 마작 분석 | 커스텀 샨텐수/유효패 엔진 |
| LLM | Ollama (qwen2.5:7b) |
| DB | SQLite |

---

## 시작하기

### 사전 준비

- Python 3.10 이상
- Node.js 18 이상
- [Ollama](https://ollama.com) 설치 후 모델 다운로드

```bash
ollama pull qwen2.5:7b
```

### 설치 및 실행

```bash
git clone https://github.com/nir3y/mahjong-analyzer.git
cd mahjong-analyzer
```

**윈도우:** `start.bat` 더블클릭

**맥/리눅스:**
```bash
# 백엔드
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# 프론트엔드 (새 터미널)
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 사용 방법

1. 메인 화면에서 천봉 아이디 입력
2. 게임 목록에서 분석할 판 선택 후 **분석하기** 클릭
3. 잠시 후 리포트카드 확인
4. 판이 쌓이면 **패턴 분석** 으로 반복 약점 확인
5. 스크린샷 분석기에서 궁금한 상황 즉시 질문 가능

---

## 현재 제한사항

- 천봉(Tenhou) 로그만 지원 (작혼 추후 지원 예정)
- LLM은 로컬 Ollama 사용 (인터넷 연결 불필요, 단 모델 품질에 따라 설명 품질 차이 있음)
