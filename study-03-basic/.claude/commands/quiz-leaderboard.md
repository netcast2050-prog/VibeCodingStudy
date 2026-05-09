---
description: 퀴즈 게임의 순위 시스템(점수·정렬·필터·저장)을 관리/검증합니다.
argument-hint: [모드 (선택, 예: check / simulate / reset / json)]
---

# 순위 시스템 관리

작업 모드: $ARGUMENTS

## 동작 모드

- `check` 또는 비어 있음: 현재 리더보드 구현을 코드 단계에서 검증합니다(기본).
- `simulate`: 가상의 테스트 기록으로 정렬·필터·신기록 판정 로직을 검증합니다(파일은 수정하지 않음).
- `reset`: 사용자가 브라우저 콘솔에서 직접 실행할 수 있는 localStorage 초기화 스니펫을 제공합니다.
- `json`: 사용자가 메시지에 첨부한 `quizApp.history` JSON을 입력으로 받아 순위·통계를 산출합니다.

> 본 명령은 코드 검증과 (옵션) 첨부된 JSON 분석만 수행하며, **코드를 수정하지 않습니다.** 실제 사용자별 기록은 브라우저 localStorage에 있어 외부에서 접근할 수 없으므로 검증은 로직 단계에서만 진행합니다.

## 1. 구현 검증 (`check`)

`script.js`, `index.html`, `style.css`의 다음 항목을 점검합니다. 문제가 있으면 라인 번호와 함께 지적하고, 통과 항목은 ✅로 표시합니다.

### 1.1 데이터 모델
- `STORAGE_KEYS` (`PLAYER`, `HISTORY`, `THEME`)이 일관되게 사용되는가
- 저장 결과 객체가 다음 필드를 모두 가지는가:
  `id, timestamp, playerName, mode, modeLabel, category, totalScore, correctAnswers, totalQuestions, accuracy, avgTime, longestStreak, hintsUsed, categoryScores`
- `HISTORY_LIMIT` 트리밍이 제대로 적용되는가 (오래된 기록부터 제거)

### 1.2 순위 산출 로직
- 정렬 기준: `totalScore DESC`, 동점 시 `timestamp ASC`(먼저 달성한 사람 우선)
- 필터:
  - `daily`: 오늘 0시 이후 기록만
  - `weekly`: 최근 7일 이내 기록만
  - `category`: `mode === 'category'` 이면서 `category` 일치
- TOP N 슬라이스가 `LB_LIMIT`(=10)와 일치하는가
- 본인 기록 강조(`is-self`) 클래스가 현재 `playerName`과의 비교로 적용되는가

### 1.3 신기록 판정 (`getRecordStatus`)
- 같은 모드(전체/카테고리)·같은 플레이어의 이전 최고 점수와만 비교하는가
- 첫 도전(`comparable.length === 0`)을 `isFirst`로 분기하는가
- 동점은 신기록이 아닌가 (`>` 비교)

### 1.4 UI 일관성
- 리더보드 화면 탭 4종(전체/오늘/이번 주/카테고리별)과 카테고리 필터(4종)가 모두 동작하는가
- 빈 상태(`#lbEmpty`) 표시 조건이 정확한가
- 1·2·3위 메달 색상 클래스(`top1`/`top2`/`top3`)가 적용되는가
- `aria-selected` 속성이 활성 탭에만 `true`인가

### 1.5 무결성/예외
- localStorage JSON 파싱 실패 시 빈 배열로 폴백하는가
- 저장 실패(쿼터 초과 등) 시 콘솔 경고만 남기고 게임이 중단되지 않는가
- XSS 방지를 위해 닉네임/카테고리/모드 라벨이 `escapeHtml`로 출력되는가

## 2. 시뮬레이션 (`simulate`)

다음과 같은 가상 기록 세트를 생성한다고 가정하고 로직 결과를 보고합니다(파일 수정 없음).

```
- A 플레이어 / full 모드 / 점수 [80, 95, 110, 110]   ← 마지막 110은 동점
- B 플레이어 / full 모드 / 점수 [120, 100]
- A 플레이어 / category(한국사) / 점수 [60, 90]
- A 플레이어 / category(과학) / 점수 [50]
- C 플레이어 / speed 모드 / 8일 전 점수 [200]
- C 플레이어 / speed 모드 / 오늘 점수 [180]
- D 플레이어 / category(과학) / 어제 점수 [95]
```

각 케이스에서 다음을 보고합니다.

- **전체 TOP 10**: 점수 내림차순, 동점 시 timestamp 오름차순
- **오늘 TOP**: 오늘 0시 이후만
- **이번 주 TOP**: 최근 7일 이내만 (8일 전 기록 제외 확인)
- **카테고리(과학) TOP**: `mode === 'category' && category === '과학'` 만 필터
- **신기록 판정**: A의 full 110점이 신기록인가 (이전 95점 → 신기록 ✅), 두 번째 110은? (동점 ❌)

## 3. 초기화 스니펫 (`reset`)

브라우저 콘솔에서 직접 실행할 수 있는 안전한 스니펫을 제시합니다(자동 실행하지 않음).

**기록만 초기화 (이름·테마 유지)**
```js
localStorage.removeItem('quizApp.history');
location.reload();
```

**전체 초기화 (이름·테마 포함)**
```js
['quizApp.history', 'quizApp.player', 'quizApp.theme'].forEach(k => localStorage.removeItem(k));
location.reload();
```

스니펫 위에 "되돌릴 수 없습니다" 경고를 함께 표시합니다.

## 4. JSON 분석 (`json`)

사용자가 메시지에 `quizApp.history` JSON 배열을 첨부한 경우에 한해 다음을 산출합니다.

- **전체 TOP 10** (점수 내림차순, 동점 시 timestamp 오름차순)
- **오늘 / 이번 주 TOP 10**
- **카테고리별 TOP 10** (각 4개 카테고리)
- **본인 기록 통계**: 총 플레이, 평균 점수, 최고 점수, 카테고리별 정답률
- **신기록 갱신 이력**: 모드별 최고 점수가 갱신된 시점 목록

JSON이 첨부되지 않았는데 `json` 모드가 호출되면, 다음 안내를 출력하고 종료합니다.

```
JSON이 필요합니다. 브라우저 콘솔에서 다음을 실행하고 결과를 그대로 메시지에 붙여넣어 주세요.

  copy(localStorage.getItem('quizApp.history'))

(클립보드에 복사됩니다.)
```

## 출력 형식 (check 기본)

```
# 순위 시스템 검증

## 데이터 모델
- 결과 스키마: ✅ / ⚠️ (누락 필드: __)
- 트리밍: ✅ (HISTORY_LIMIT=200) / ⚠️ (script.js:L__)

## 정렬·필터
- 점수 정렬: ✅ / ⚠️
- 동점 정렬 기준: ✅ (timestamp ASC) / ⚠️
- daily 필터: ✅ / ⚠️ (script.js:L__)
- weekly 필터: ✅ / ⚠️
- category 필터: ✅ / ⚠️

## 신기록 판정
- 모드/카테고리 일치 비교: ✅ / ⚠️
- 첫 도전 분기: ✅ / ⚠️
- 동점 비신기록 처리: ✅ / ⚠️

## UI 일관성
- 탭 동작: ✅ / ⚠️
- 카테고리 필터 표시 조건: ✅ / ⚠️
- 빈 상태(`#lbEmpty`): ✅ / ⚠️
- 본인 강조(`is-self`): ✅ / ⚠️
- 메달 색상: ✅ / ⚠️
- aria-selected: ✅ / ⚠️

## 보안/예외
- 파싱 실패 폴백: ✅ / ⚠️
- 저장 실패 폴백: ✅ / ⚠️
- XSS 이스케이프: ✅ / ⚠️ (escapeHtml 누락 위치: __)

## 결론
- 통과 항목: N개 / 경고: M개
- 권장 조치 우선순위:
  1. ___
  2. ___
```

## 마무리

- 본 명령은 **읽기와 분석만** 수행합니다. `script.js`, `index.html`, `style.css` 등 파일을 수정하지 않습니다.
- `reset` 모드도 스니펫을 제공만 하고, 실제로 localStorage를 변경하지 않습니다.
- `json` 모드는 사용자가 명시적으로 JSON을 첨부했을 때만 분석합니다.
