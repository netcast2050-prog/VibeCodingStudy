# TodoFlow — Claude Code 단계별 프롬프트

> **사용법**: 각 단계를 순서대로 Claude Code에 붙여넣기 하세요.  
> 이전 단계가 완료된 것을 확인한 후 다음 단계로 진행하세요.

---

## STEP 1 of 5 — 프로젝트 뼈대 + HTML 구조

```
아래 사양으로 TodoFlow 할 일 관리 앱의 파일 구조와 HTML을 만들어줘.

## 생성할 파일
- index.html
- style.css  (빈 파일, 링크만 연결)
- app.js     (빈 파일, 스크립트만 연결)

## index.html 요구사항

### 문서 기본 설정
- lang="ko", charset UTF-8
- viewport meta 태그 (모바일 대응)
- 타이틀: "TodoFlow"
- style.css, app.js 링크 연결

### 마크업 구조 (시맨틱 태그 사용)
아래 5개 섹션을 순서대로 작성:

1. <header>
   - 앱 이름 "TodoFlow" (h1)
   - 오늘 날짜/요일 표시 영역 (id="today-date")

2. <section id="progress-section">
   - 진행률 텍스트: "완료 0 / 전체 0 (0%)" (id="progress-text")
   - <progress> 태그 또는 div로 만든 프로그레스 바 (id="progress-bar")

3. <nav id="category-tabs">
   - 탭 버튼 4개: 전체 / 업무 / 개인 / 공부
   - 각 버튼에 data-category 속성 부여 ("all" / "업무" / "개인" / "공부")
   - "전체" 탭에 class="active" 기본 적용
   - 각 탭 안에 카운트 뱃지 <span class="tab-badge"> 포함

4. <section id="input-section">
   - <select id="category-select">: 업무/개인/공부 옵션
   - <input type="text" id="todo-input" placeholder="할 일을 입력하세요..." maxlength="100">
   - <button id="add-btn">+ 추가</button>

5. <ul id="todo-list">
   - 비어 있는 상태에서 보여줄 빈 상태 메시지 <li id="empty-msg">할 일을 추가해보세요 ✏️</li>

6. <div id="toast"> (Undo 토스트, 기본 hidden)
   - 텍스트 영역 <span id="toast-msg">
   - <button id="undo-btn">되돌리기</button>

### 접근성
- input과 select에 aria-label 속성 추가
- 버튼에 의미 있는 텍스트 또는 aria-label 추가

완료 후 index.html, style.css, app.js 3개 파일이 생성됐는지 확인해줘.
```

---

## STEP 2 of 5 — CSS 스타일링 (반응형 포함)

```
style.css에 TodoFlow 앱의 전체 스타일을 작성해줘.

## 디자인 방향
- 깔끔하고 실용적인 미니멀 스타일
- 밝은 배경 (#f8f9fa), 카드형 컨테이너 (흰 배경 + 그림자)
- 최대 너비 600px, 중앙 정렬

## CSS 변수 (루트에 정의)
--color-업무: #3b82f6   (파랑)
--color-개인: #22c55e   (초록)
--color-공부: #f97316   (주황)
--color-completed: #9ca3af
--radius: 10px
--shadow: 0 2px 8px rgba(0,0,0,0.08)

## 섹션별 스타일

### header
- 앱 이름: 굵은 폰트, 진한 색
- 날짜: 작은 폰트, 회색
- 상하 패딩 16px

### progress-section
- 텍스트와 바 사이 간격 8px
- 프로그레스 바: 높이 8px, 둥근 모서리, 배경 #e5e7eb
- 채워진 부분 (id="progress-fill"): 배경 #3b82f6, transition 0.3s

### category-tabs
- 가로 스크롤 가능 (overflow-x: auto, 스크롤바 숨김)
- 탭 버튼: 둥근 pill 형태, 배경 #f1f5f9, 테두리 없음
- .active 상태: 배경 #1e293b, 텍스트 흰색
- .tab-badge: 작은 원형, 탭 색상에 따라 변경

### input-section
- Flexbox 한 줄 배치
- select: 너비 고정 90px
- input: flex-grow 1
- 버튼: 배경 #1e293b, 텍스트 흰색, hover 시 약간 어둡게

### todo-list (li 항목)
- 각 항목: Flex, 세로 중앙 정렬, 하단 테두리 구분선
- 체크박스: 커스텀 스타일 (기본 체크박스 숨기고 CSS로 재구현)
- 완료 상태 (.completed): 텍스트 취소선, 색상 --color-completed, 불투명도 0.6
- 카테고리 뱃지: 작은 pill, 카테고리 색상 배경
- 수정/삭제 버튼: 기본 숨김, 부모 li:hover 시 표시
- 인라인 편집 input: 기본 input 스타일 제거, 텍스트처럼 보이되 포커스 시 밑줄

### toast
- 화면 하단 중앙 고정 (position: fixed, bottom: 24px)
- 어두운 배경 (#1e293b), 흰 텍스트, 둥근 모서리
- 기본: opacity 0, pointer-events none
- .show 클래스: opacity 1, pointer-events auto
- transition: opacity 0.2s

## 반응형 (모바일 ≤ 480px)
- 컨테이너 패딩 줄이기
- input-section: 두 줄로 변경 (select+input 한 줄, 버튼 전체 너비)
- li 항목의 수정/삭제 버튼: hover 대신 항상 표시
- 탭 버튼 폰트 크기 줄이기

완료 후 index.html을 브라우저에서 열어 레이아웃이 깨지지 않는지 확인해줘.
```

---

## STEP 3 of 5 — 데이터 모델 + LocalStorage 연동

```
app.js에 데이터 관리 레이어를 작성해줘. UI 렌더링은 아직 하지 않아도 돼.

## 데이터 구조
각 할 일 객체:
{
  id: String,        // String(Date.now())
  text: String,      // 할 일 내용
  category: String,  // "업무" | "개인" | "공부"
  completed: Boolean,
  createdAt: String  // new Date().toISOString()
}

## 구현할 것

### 1. 상태 변수
let tasks = [];          // 현재 할 일 배열
let currentFilter = 'all';  // 현재 선택된 카테고리 필터
let undoBuffer = null;   // 삭제 취소용 임시 저장 { task, index }

### 2. LocalStorage 함수 2개
function saveTasks()
- tasks 배열을 JSON.stringify 해서 'todoflow_tasks' 키로 저장

function loadTasks()
- 'todoflow_tasks' 키에서 읽어 JSON.parse 후 tasks에 할당
- 키가 없으면 tasks = [] 로 초기화
- 파싱 오류 시 tasks = [] 로 fallback (try-catch)

### 3. CRUD 함수 4개
function addTask(text, category)
- 입력 검증: text.trim() 이 비어 있으면 얼리 리턴
- 새 객체 생성 후 tasks 배열에 push
- saveTasks() 호출

function updateTask(id, newText)
- tasks 배열에서 id 일치 항목 찾아 text 업데이트
- saveTasks() 호출

function deleteTask(id)
- 삭제 전 undoBuffer = { task: 삭제할객체, index: 현재인덱스 } 저장
- tasks 배열에서 제거
- saveTasks() 호출

function toggleComplete(id)
- tasks에서 id 일치 항목의 completed 를 반전
- saveTasks() 호출

### 4. Undo 함수
function undoDelete()
- undoBuffer가 null이면 리턴
- undoBuffer.index 위치에 undoBuffer.task 를 splice로 삽입
- saveTasks() 호출
- undoBuffer = null 초기화

### 5. 필터 함수
function getFilteredTasks()
- currentFilter === 'all' 이면 tasks 전체 반환
- 아니면 category가 currentFilter인 항목만 filter해서 반환

### 6. 진행률 계산 함수
function getProgress()
- 전체 tasks 기준 (필터 무관)
- { total, completed, percent } 객체 반환
- percent = total이 0이면 0, 아니면 Math.round(completed/total*100)

### 7. 초기화
- DOMContentLoaded 이벤트에서 loadTasks() 호출
- 이후 renderAll() 호출 (다음 단계에서 구현할 함수, 지금은 console.log로 placeholder)

완료 후 브라우저 콘솔에서 addTask("테스트", "업무") 를 실행하고
localStorage에 데이터가 저장되는지 확인해줘.
```

---

## STEP 4 of 5 — 렌더링 + 이벤트 핸들러

```
app.js에 UI 렌더링 함수와 이벤트 핸들러를 추가해줘.

## 렌더링 함수

### renderAll()
- renderProgress() 호출
- renderTabs() 호출
- renderTodoList() 호출

### renderProgress()
대상 요소: #progress-text, #progress-fill, (있다면 <progress> 태그)
- getProgress() 결과로 텍스트 업데이트: "완료 N / 전체 N (N%)"
- 프로그레스 바 너비(또는 value)를 percent 값으로 업데이트

### renderTabs()
대상 요소: #category-tabs 내 버튼들, .tab-badge
- 각 탭의 뱃지를 해당 카테고리의 완료수/전체수로 업데이트
  - "전체" 탭: 전체 완료수/전체수
  - 나머지: 해당 카테고리 완료수/해당 카테고리 전체수
- currentFilter와 일치하는 탭에 .active 클래스 추가, 나머지는 제거

### renderTodoList()
대상 요소: #todo-list
- getFilteredTasks() 결과로 렌더링
- 항목이 없으면 #empty-msg 표시, 있으면 숨김
- 각 할 일을 <li> 태그로 생성 (innerHTML 대신 createElement 사용 권장):
  - 커스텀 체크박스 (input[type=checkbox])
  - 텍스트 span (class="todo-text", completed 이면 .completed 클래스)
  - 카테고리 뱃지 span (class="category-badge", data-category 속성)
  - 수정 버튼 (✎ 아이콘, class="edit-btn", data-id 속성)
  - 삭제 버튼 (🗑 아이콘, class="delete-btn", data-id 속성)

## 이벤트 핸들러

### 할 일 추가
- #add-btn 클릭: addTask(input값, select값) → renderAll() → input 초기화
- #todo-input 에서 Enter 키: 위와 동일

### 완료 토글
- #todo-list에 이벤트 위임 (delegation)
- checkbox change 이벤트: toggleComplete(id) → renderAll()

### 인라인 수정
- .edit-btn 클릭 시:
  - 해당 li의 .todo-text span을 <input type="text">로 교체
  - 기존 텍스트 값 채워넣기, 포커스 및 전체 선택
- 수정 input에서 Enter 또는 blur:
  - updateTask(id, 새값) → renderAll()
- 수정 input에서 Escape:
  - 수정 취소, renderAll()로 원래 상태 복원

### 삭제 + Undo 토스트
- .delete-btn 클릭:
  - deleteTask(id) → renderAll()
  - showToast("삭제됐습니다") 호출
- showToast(message) 함수:
  - #toast 에 .show 클래스 추가
  - #toast-msg 텍스트 설정
  - 2초 후 자동으로 .show 제거
  - 타이머 ID를 변수에 저장 (연속 삭제 시 타이머 초기화)
- #undo-btn 클릭:
  - undoDelete() → renderAll()
  - 토스트 즉시 닫기

### 카테고리 탭 필터
- #category-tabs 에 이벤트 위임
- 버튼 클릭 시 currentFilter = 클릭한 버튼의 data-category → renderAll()

### 날짜 표시
- DOMContentLoaded 시 #today-date 요소에 오늘 날짜 출력
- 형식: "2026년 5월 12일 화요일"

## 초기화 수정
- DOMContentLoaded 에서 loadTasks() → renderAll() → 날짜 표시 순으로 실행
- 모든 이벤트 리스너 등록

완료 후 아래 시나리오를 직접 테스트해줘:
1. 할 일 3개 추가 (카테고리 다르게)
2. 1개 완료 체크
3. 1개 수정
4. 1개 삭제 후 Undo
5. 새로고침 후 데이터 유지 확인
```

---

## STEP 5 of 5 — 마무리: 모바일 UX + 최종 점검

```
TodoFlow 앱의 모바일 UX를 보완하고 최종 점검을 해줘.

## 1. 모바일 터치 UX
- 모바일(≤480px)에서 수정/삭제 버튼이 항상 표시되도록 CSS 확인
- 터치 타깃 크기: 체크박스, 버튼 모두 최소 44×44px 확보
- iOS Safari에서 input 포커스 시 자동 확대 방지:
  font-size: 16px 이상으로 설정 (16px 미만이면 iOS가 자동 줌)

## 2. 엣지 케이스 처리
아래 각 케이스가 오류 없이 동작하는지 확인하고, 문제 있으면 수정:
- 공백만 입력한 뒤 추가 시도 → 추가 안 됨, input에 흔들리는 애니메이션(shake)
- 할 일이 0개일 때 진행률 → "완료 0 / 전체 0 (0%)", 바 너비 0%
- 모든 항목 완료 시 → 진행률 100%, 바 꽉 참
- 긴 텍스트 (100자) → 줄 넘침 없이 말줄임표(...) 처리
- 빠르게 연속 삭제 → 토스트 타이머가 초기화되고 마지막 삭제만 Undo 가능

## 3. shake 애니메이션 추가
style.css에 추가:
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.shake { animation: shake 0.3s ease; }

app.js에서 빈 입력 시 #todo-input에 .shake 클래스 추가 후 300ms 뒤 제거

## 4. 텍스트 말줄임표
.todo-text 에 CSS 추가:
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
max-width: 200px; (화면 크기에 따라 조정)

## 5. 최종 체크리스트 확인
아래 항목을 하나씩 테스트하고 결과를 알려줘:

[ ] 새로고침 후 데이터 유지됨
[ ] 전체/업무/개인/공부 탭 필터 정상 동작
[ ] 진행률 바 퍼센트 정확히 계산됨
[ ] 인라인 수정 후 Enter/Escape 정상 동작
[ ] 삭제 후 Undo 정상 동작
[ ] 빈 입력 시 shake 애니메이션 표시됨
[ ] 모바일 화면(480px 이하)에서 레이아웃 깨짐 없음
[ ] 키보드만으로 할 일 추가 가능 (Tab→선택→입력→Enter)
[ ] 콘솔에 JavaScript 오류 없음

문제가 있는 항목은 바로 수정해줘.
최종 완료 후 "index.html을 브라우저에서 열면 바로 사용 가능합니다" 라고 알려줘.
```

---

## 참고: 단계별 산출물 요약

| 단계 | 주요 산출물 | 완료 확인 방법 |
|------|-------------|----------------|
| STEP 1 | `index.html`, `style.css`, `app.js` 파일 생성 | 3개 파일 존재 확인 |
| STEP 2 | 전체 CSS 스타일 완성 | 브라우저에서 레이아웃 확인 |
| STEP 3 | 데이터 CRUD + LocalStorage | 콘솔에서 `addTask()` 직접 실행 |
| STEP 4 | 렌더링 + 이벤트 연결 | 5가지 시나리오 수동 테스트 |
| STEP 5 | 모바일 UX + 버그 수정 | 체크리스트 9개 항목 전부 통과 |
