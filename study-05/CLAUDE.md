# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참조하는 가이드입니다.

## 프로젝트 개요

**study-05** — VibeCodingStudy 시리즈의 AI 활용 프로젝트.  
OpenRouter API를 이용해 냉장고 사진에서 재료를 인식하고 레시피를 추천하는 웹 앱 **"냉장고 셰프"** 를 구현했습니다.

이전 학습 참고:
- `study-02/` — Vanilla JS 할일 관리 (index.html / style.css / script.js 3파일 SPA)
- `study-04/` — TodoFlow 바닐라 JS 웹앱 (localStorage CRUD, 카테고리 탭, 진행바)

## 환경 설정

`.env` 파일에 다음 변수를 설정합니다:

```
OPENROUTER_API_Key=<key>
```

`process.env.OPENROUTER_API_Key` 로 읽습니다. **절대 하드코딩하거나 로그에 출력하지 마세요.**

## 시리즈 공통 규칙

- 한국어 UI (`ko` 로케일)
- 번들러 없음 (study-03만 Vite/React 사용, 나머지는 번들러 불필요)
- 브라우저 전용 프로젝트는 `localStorage` 로 데이터 유지
- 모바일 우선 반응형 레이아웃 (브레이크포인트 ≤ 480–600px)
- 커밋 메시지 접두사: `add :`, `update :`, `fix :` + 한국어 또는 영어 요약

---

## 구현 완료 내역

### 아키텍처

| 구분 | 내용 |
|------|------|
| 백엔드 | Node.js + Express (`server.js`) |
| 프론트엔드 | Vanilla HTML/CSS/JS (`public/`) |
| 포트 | 3000 (`npm run dev` → `node --watch server.js`) |
| API 프록시 | 모든 OpenRouter 호출은 서버 경유 — API 키 브라우저 노출 없음 |

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health?model=xxx` | 지정 모델 연결 확인 (실제 핑 전송) |
| GET | `/api/models` | 사용 가능한 비전 모델 목록 반환 |
| POST | `/api/recognize` | 이미지 → 재료 인식 (비전 모델, `model` 파라미터 지원) |
| POST | `/api/recipe` | 재료 → 레시피 3개 생성 (`deepseek/deepseek-v4-flash`, 90초 타임아웃) |

### 비전 모델 목록 (재료 인식용)

```javascript
const VISION_MODELS = [
  { id: 'google/gemini-3.1-flash-lite',       name: 'Gemini 3.1 Flash Lite' }, // 기본
  { id: 'meta-llama/llama-4-maverick:free',   name: 'Llama 4 Maverick' },
  { id: 'meta-llama/llama-4-scout:free',      name: 'Llama 4 Scout' },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL 72B' },
];
```

기본 모델: `google/gemini-3.1-flash-lite`  
선택한 모델은 `localStorage('fridge_vision_model')` 에 저장됩니다.

### 주요 기능

#### Step 1 — 재료 인식
- 이미지 업로드 (파일 선택 / 카메라 / 드래그&드롭)
- 클라이언트 캔버스 리사이즈 (최대 1024px, JPEG 85%) 후 Base64 인코딩
- **서버 체크 버튼**: 현재 모델로 실제 핑 → 실패 시 대체 모델 선택 UI 표시
- **모델 전환**: 헬스체크 실패 시 4개 모델 버튼 표시, 선택하면 자동 재시도
- **429 자동 재시도**: rate limit 발생 시 15초 카운트다운 후 자동 재인식
- 재료 태그 추가/삭제, 수동 입력 지원

#### Step 2 — 레시피 생성
- 재료를 `sessionStorage` 에 저장해 탭 간 전달
- 레시피 3개 생성 (쉬움/보통/어려움 각 1개)
- 스켈레톤 로딩 카드 → 실제 레시피 카드 전환
- 아코디언으로 조리 순서 펼치기/접기
- 레시피 저장/취소 토글

#### Step 3 — 저장된 레시피
- 저장 목록 (localStorage)
- 이름·재료 검색, 난이도 필터 (전체/쉬움/보통/어려움)
- 삭제 + 3초 되돌리기 (Undo) 토스트

#### 프로필 모달
- 닉네임, 기본 인분 수 (1–4인), 식이제한 (채식/글루텐프리/유제품프리) 설정
- 첫 실행 시 자동 표시
- 저장 시 레시피 탭 자동 재생성 트리거

### 알려진 이슈 및 해결책

| 이슈 | 원인 | 해결 |
|------|------|------|
| 탭 전환 후 Step 2가 보이지 않음 | `section.hidden` + `.active` CSS 충돌 (`.hidden { !important }`) | HTML에서 step2·step3 섹션의 `hidden` 클래스 제거 |
| 재료 인식 오류 (429) | 무료 모델 rate limit | 15초 카운트다운 자동 재시도 + 모델 전환 UI |
| 레시피 API 타임아웃 | `gpt-oss-120b` 응답 ~44초 소요 | 타임아웃 90초로 증가 |
| 구 서버 프로세스 포트 점유 | `node --watch` 재시작 시 포트 충돌 | 수동으로 구 PID 종료 후 재시작 |

### 파일 구조

```
study-05/
├── server.js          # Express 서버, OpenRouter 프록시
├── public/
│   ├── index.html     # 3탭 SPA 마크업
│   ├── style.css      # 모바일 우선 스타일
│   └── app.js         # 전체 클라이언트 로직
├── .env               # OPENROUTER_API_Key (git 제외)
├── .env.example       # 키 형식 예시
├── .gitignore
├── package.json       # scripts: start / dev
└── CLAUDE.md
