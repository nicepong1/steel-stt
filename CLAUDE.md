# CLAUDE.md - 철강회사 실시간 STT 웹앱 프로젝트 규칙

## GitHub
- **계정:** nicepong1
- **리포지토리:** steel-stt
- **Git 설정:** user.name=nicepong1, email=nicepong1@users.noreply.github.com

## 프로젝트 개요
철강회사 고객의 음성 주문을 실시간으로 텍스트 변환하는 웹앱 프로토타입.
예: "H빔 10톤 주문할게" → 실시간 텍스트 출력

## 아키텍처
```
[브라우저 마이크] → (WebSocket) → [FastAPI 서버] → [Google STT API]
                  ← (WebSocket) ←              ← (Streaming 응답)
```

- **Frontend:** Next.js + React + TailwindCSS (Web Audio API로 마이크 스트리밍)
- **Backend:** Python FastAPI + WebSocket 엔드포인트
- **STT:** Google Cloud Speech-to-Text Streaming API
- **배포:** Vercel (Frontend)

## 디렉토리 구조
```
C:\Projects\STT\
├── frontend/          # Next.js 프론트엔드
├── backend/           # FastAPI 백엔드
├── stt_plan.md        # 프로젝트 기획서
└── CLAUDE.md          # 이 파일
```

## 핵심 규칙

### 1. 보안
- **API 키, 서비스 계정 JSON 등 민감 정보는 절대 코드에 하드코딩 금지**
- 모든 시크릿은 `.env` 파일로 관리하고, `.gitignore`에 반드시 포함
- Google Cloud 서비스 계정 키 파일(`.json`)은 커밋 금지

### 2. 통신 프로토콜
- 프론트엔드 ↔ 백엔드 간 오디오/텍스트 통신은 **WebSocket만 사용**
- REST API는 보조 기능(상태 확인 등)에만 사용
- 오디오 포맷: PCM 16-bit, 16kHz, mono

### 3. STT 모듈화
- STT API 연동 코드는 별도 모듈(`stt_service.py`)로 분리
- 향후 자체 Conformer/RNN-T 모델로 교체 가능하도록 인터페이스 설계
- STT 서비스는 추상 클래스/프로토콜로 정의

### 4. Phase별 진행
- 기획서(`stt_plan.md`)의 Phase 순서를 반드시 준수
- 각 Phase 완료 후 사용자 확인 없이 다음 Phase로 넘어가지 않음

### 5. 코드 스타일
- Frontend: TypeScript 사용, ESLint + Prettier
- Backend: Python 3.11+, type hints 필수, ruff 포매터
- 한국어 주석 허용, 변수/함수명은 영어
