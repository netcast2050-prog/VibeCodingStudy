# TodoFlow — 할 일 관리 웹앱

순수 HTML · CSS · JavaScript(Vanilla)로 구현한 미니멀 할 일 관리 앱입니다.  
별도 빌드 도구나 프레임워크 없이 `index.html`을 브라우저에서 열면 바로 사용할 수 있습니다.

---

## 파일 구조

```
study-04/
├── index.html   # 앱 마크업 (시맨틱 태그, 접근성 속성)
├── style.css    # 전체 스타일 (CSS 변수, 반응형, 애니메이션)
├── app.js       # 데이터 레이어 + UI 렌더링 + 이벤트 핸들러
└── README.md    # 이 파일
```

---

## 주요 기능

### 할 일 관리 (CRUD)
| 기능 | 동작 방법 |
|------|-----------|
| 추가 | 카테고리 선택 → 텍스트 입력 → `+ 추가` 버튼 또는 `Enter` |
| 완료 | 항목 왼쪽 체크박스 클릭 → 취소선 + 불투명도 처리 |
| 수정 | 항목 hover → ✎ 버튼 클릭 → 인라인 편집 → `Enter` 저장 / `Escape` 취소 |
| 삭제 | 항목 hover → 🗑 버튼 클릭 → 토스트 표시 → 2초 내 되돌리기 가능 |

### 카테고리 & 필터
- **업무 / 개인 / 공부** 3개 카테고리 지원
- 상단 탭 클릭으로 카테고리별 필터링
- 각 탭 뱃지에 `완료수 / 전체수` 실시간 표시

### select ↔ 탭 색상 연동
- 입력창 카테고리 선택(select)이 바뀔 때마다 해당 탭에 컬러 ring 강조 표시
- 필터 활성 상태(`.active`)와 독립적으로 동작 — 두 상태 동시 적용 가능

### 진행률 표시
- 전체 항목 기준 완료 퍼센트 계산 (`Math.round`)
- 텍스트: `완료 N / 전체 N (N%)`
- 프로그레스 바: 인디고→보라 그라데이션, `transition 0.35s`

### 데이터 영속
- `localStorage` 키 `todoflow_tasks` 에 JSON 직렬화 저장
- 새로고침·탭 재방문 후에도 데이터 유지
- 파싱 오류 시 `try-catch` fallback으로 빈 배열 초기화

### Undo (삭제 취소)
- 삭제 직전 `undoBuffer = { task, index }` 에 임시 저장
- 하단 토스트의 **되돌리기** 버튼 클릭 시 원래 위치에 `splice` 복원
- 연속 삭제 시 마지막 삭제만 Undo 가능 (버퍼 덮어쓰기)

---

## 데이터 구조

```js
// localStorage: 'todoflow_tasks' → JSON 배열
{
  id:        String,   // String(Date.now())
  text:      String,   // 할 일 내용 (최대 100자)
  category:  String,   // "업무" | "개인" | "공부"
  completed: Boolean,
  createdAt: String    // ISO 8601 (new Date().toISOString())
}
```

---

## 상태 변수

```js
let tasks         = [];    // 전체 할 일 배열
let currentFilter = 'all'; // 현재 선택된 카테고리 탭
let undoBuffer    = null;  // { task, index } — 삭제 취소용
let toastTimer    = null;  // 토스트 자동 닫힘 타이머 ID
```

---

## 주요 함수 목록

### 데이터 레이어

| 함수 | 역할 |
|------|------|
| `saveTasks()` | tasks 배열 → localStorage 직렬화 저장 |
| `loadTasks()` | localStorage → tasks 복원 (파싱 오류 시 빈 배열) |
| `addTask(text, category)` | trim 검증 후 새 객체 push → save |
| `updateTask(id, newText)` | id로 찾아 text 교체 → save |
| `deleteTask(id)` | undoBuffer 저장 후 splice 제거 → save |
| `toggleComplete(id)` | completed 반전 → save |
| `undoDelete()` | undoBuffer 위치에 splice 복원 → save → buffer null |
| `getFilteredTasks()` | currentFilter 기준 필터된 배열 반환 |
| `getProgress()` | `{ total, completed, percent }` 객체 반환 |

### UI 렌더링

| 함수 | 역할 |
|------|------|
| `renderAll()` | progress + tabs + list 순서로 전체 재렌더 |
| `renderProgress()` | `#progress-text`, `#progress-fill` 업데이트 |
| `renderTabs()` | 탭 뱃지 수치 · `.active` 클래스 갱신 |
| `renderTodoList()` | 필터된 항목 `createElement`로 동적 생성 |
| `renderDate()` | `#today-date` — `YYYY년 M월 D일 요일` 형식 출력 |
| `syncSelectHint()` | select 값 → 탭 `.select-hint` 클래스 + `data-cat` 동기화 |
| `startEdit(li, id)` | todo-text를 `.edit-input`으로 교체, `committed` 플래그로 이중 호출 방지 |
| `showToast(message)` | 토스트 표시 + 2초 타이머 (연속 호출 시 타이머 리셋) |
| `hideToast()` | 토스트 즉시 닫기 (Undo 클릭 시) |

---

## 디자인 시스템

### CSS 변수

```css
:root {
  --color-업무:       #6366f1;   /* 인디고 */
  --color-업무-light: #eef2ff;
  --color-업무-ring:  #c7d2fe;
  --color-개인:       #059669;   /* 에메랄드 */
  --color-개인-light: #ecfdf5;
  --color-개인-ring:  #6ee7b7;
  --color-공부:       #d97706;   /* 앰버 */
  --color-공부-light: #fffbeb;
  --color-공부-ring:  #fcd34d;
  --color-completed:  #a8b5c8;
  --radius: 14px;
  --shadow: 0 2px 16px rgba(99, 102, 241, 0.08);
}
```

### 색상 체계
- **배경**: 인디고 → 보라 → 앰버 3색 그라데이션 (`background-attachment: fixed`)
- **카드**: 반투명 흰 배경 + `backdrop-filter: blur(10px)` 유리(glass) 효과
- **헤더**: 왼쪽 인디고 테두리 + 그라데이션 텍스트 (`-webkit-background-clip: text`)
- **진행률 바**: 인디고 → 보라 그라데이션
- **추가 버튼**: 인디고 그라데이션 + 컬러 box-shadow

### 카테고리 색상 규칙
| 카테고리 | 비활성 탭 | 활성 탭 | 뱃지 |
|---------|----------|---------|------|
| 업무 | 인디고 연배경 + 인디고 글자 | 인디고 배경 + 흰 글자 | 인디고 그라데이션 |
| 개인 | 에메랄드 연배경 + 에메랄드 글자 | 에메랄드 배경 + 흰 글자 | 에메랄드 그라데이션 |
| 공부 | 앰버 연배경 + 앰버 글자 | 앰버 배경 + 흰 글자 | 앰버 그라데이션 |

---

## UX 세부 처리

| 항목 | 처리 방식 |
|------|-----------|
| 빈 입력 추가 시도 | `shake` 애니메이션 (0.3s, `void offsetWidth` reflow로 재시작 보장) |
| iOS Safari 자동 줌 | input · select · `.edit-input` 모두 `font-size: 1rem` (16px) 이상 적용 |
| 모바일 터치 타깃 | 체크박스 레이블 · 수정/삭제 버튼 44×44px (≤480px 미디어 쿼리) |
| 긴 텍스트 처리 | `white-space: nowrap` + `text-overflow: ellipsis` |
| 인라인 수정 이중 호출 | `committed` 플래그 — Enter 후 blur 이벤트 중복 실행 차단 |
| 토스트 연속 삭제 | `clearTimeout` 후 타이머 재시작 — 마지막 삭제만 Undo 가능 |
| 수정/삭제 버튼 노출 | 데스크톱: `li:hover` 시 표시 / 모바일(≤480px): 항상 표시 |

---

## 반응형 (≤480px)

- 카드 패딩 축소
- 입력 영역: select + input 한 줄 → 추가 버튼 전체 너비로 2줄 전환
- 탭 버튼 폰트 크기 축소 (`0.78rem`)
- 수정/삭제 버튼 항상 노출 (`opacity: 1`)
- 체크박스 · 버튼 44×44px 터치 타깃 확보

---

## 브라우저 지원

`backdrop-filter`는 Firefox 103+ 이상에서 지원됩니다.  
미지원 브라우저에서는 반투명 효과 없이 흰 배경으로 자동 폴백됩니다.

---

## 개발 환경

| 항목 | 내용 |
|------|------|
| 빌드 도구 | 없음 (순수 정적 파일) |
| 외부 의존성 | 없음 |
| 실행 방법 | `index.html`을 브라우저에서 열기 |
| 데이터 저장 | 브라우저 localStorage |
