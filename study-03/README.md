# 상식 퀴즈 (Quiz Web App)

React + TypeScript + Vite + Tailwind CSS v4 + Zustand 로 만든 4지선다 상식 퀴즈 웹 앱입니다.

## 주요 기능

- 4개 카테고리 (한국사 / 과학 / 지리 / 예술과 문화) × 10문제 + 전체 도전 40문제
- 문제당 20초 카운트다운 타이머 (원형 SVG, 10초 이하 노랑 / 5초 이하 빨강, 시간 초과 시 자동 오답)
- 정답/오답 즉시 피드백 + 해설 (오답 진동 / 정답 반짝임 애니메이션)
- 등급제 (S / A / B / C / D) + 카테고리별 정답률 막대 그래프
- 닉네임 기록 저장 (localStorage 기반 명예의 전당 Top 10)
- 오답만 골라 복습할 수 있는 ReviewScreen
- 화면 전환 fade-in, 모바일 ~ 데스크톱 반응형 (터치 타겟 최소 48px)

## 요구 사항

- Node.js 18 이상
- npm 9 이상

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (기본 http://localhost:5173/)
npm run dev

# 3. 프로덕션 빌드
npm run build

# 4. 빌드 결과 미리보기
npm run preview
```

## 프로젝트 구조

```
src/
├── App.tsx                       # screen 상태 기반 화면 라우터 + fade-in 래퍼
├── main.tsx
├── index.css                     # Tailwind v4 + 커스텀 keyframes
├── types/index.ts                # Question / ScoreRecord / GameState
├── data/questions.ts             # 4 카테고리 × 10문제 = 40문제
├── store/useGameStore.ts         # Zustand 전역 상태 + localStorage
└── components/
    ├── HomeScreen.tsx            # 카테고리 선택
    ├── QuizScreen.tsx            # 문제 + 20초 타이머
    ├── FeedbackScreen.tsx        # 정/오답 + 해설 + 애니메이션
    ├── ResultScreen.tsx          # 등급 / 카테고리별 그래프 / 저장
    ├── LeaderboardScreen.tsx     # 명예의 전당 Top 10
    └── ReviewScreen.tsx          # 오답 복습
```

## 게임 플로우

```
HomeScreen
  ↓ (카테고리 선택)
QuizScreen ──[시간 초과]──┐
  ↓ (정답 확인)            │
FeedbackScreen ←───────────┘
  ↓ (마지막 문제)
ResultScreen ──[오답 복습]── ReviewScreen
  ↓ (홈으로 / 순위 보기)        ↓
HomeScreen / LeaderboardScreen ←┘
```

## 점수 등급 기준 (정답률)

| 등급 | 정답률      |
| ---- | ----------- |
| S    | 90% 이상    |
| A    | 75% 이상    |
| B    | 55% 이상    |
| C    | 35% 이상    |
| D    | 35% 미만    |

(40문제 기준: S 36~40 / A 30~35 / B 22~29 / C 14~21 / D 0~13)
