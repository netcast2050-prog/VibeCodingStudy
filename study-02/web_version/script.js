// ── 저장소 키 ──────────────────────────────────────────────────
const STORAGE_KEY = 'my-tasks';
const FILTER_KEY  = 'my-tasks-filter';
const THEME_KEY   = 'my-tasks-theme';
const SORT_KEY    = 'my-tasks-sort';

// ── 카테고리 정의 ──────────────────────────────────────────────
const CATEGORIES = {
  work:     { label: '업무', color: '#4A90E2' },
  personal: { label: '개인', color: '#27AE60' },
  study:    { label: '공부', color: '#8E44AD' },
};

// ── 오늘의 격언 목록 (날짜 기반으로 하루 한 개 노출) ──────────
const QUOTES = [
  { text: '오늘 할 수 있는 일을 내일로 미루지 마라.', author: '벤자민 프랭클린' },
  { text: '천 리 길도 한 걸음부터.', author: '노자' },
  { text: '작은 일에 최선을 다하는 사람만이 큰 일도 해낼 수 있다.', author: '세네카' },
  { text: '당신이 할 수 있다고 생각하든, 할 수 없다고 생각하든 당신이 옳다.', author: '헨리 포드' },
  { text: '완벽함이란 더 이상 뺄 것이 없을 때 달성된다.', author: '생텍쥐페리' },
  { text: '지금 이 순간이 당신이 가진 전부다. 지금을 살아라.', author: '에크하르트 톨레' },
  { text: '실패는 다시 시작할 기회다, 더 현명하게.', author: '헨리 포드' },
  { text: '성공이란 열정을 잃지 않고 실패에서 실패로 나아가는 것이다.', author: '윈스턴 처칠' },
  { text: '꿈을 계속 간직하고 있으면 반드시 실현할 때가 온다.', author: '괴테' },
  { text: '매일 조금씩 발전하면, 결국 큰 변화가 만들어진다.', author: '앤서니 로빈스' },
  { text: '시간은 우리가 가장 원하지만 가장 낭비하는 것이다.', author: '윌리엄 펜' },
  { text: '자신을 이기는 자가 가장 강한 자다.', author: '공자' },
  { text: '준비된 자에게 기회는 반드시 온다.', author: '루이 파스퇴르' },
];

// ── 완료율별 응원 메시지 ────────────────────────────────────────
// 완료율 0%일 때는 메시지 없음
const ENCOURAGEMENTS = [
  { min: 1,   max: 29,  msg: '시작이 반이에요! 첫 발을 내딛었군요.' },
  { min: 30,  max: 59,  msg: '절반을 향해 달려가고 있어요. 잘 하고 있어요!' },
  { min: 60,  max: 89,  msg: '거의 다 왔어요! 마지막 스퍼트!' },
  { min: 90,  max: 99,  msg: '대단해요! 거의 완성 단계예요.' },
  { min: 100, max: 100, msg: '모든 할 일을 완료했어요! 최고예요!' },
];

// ── 앱 상태 ──────────────────────────────────────────────────
let tasks                = load();
let activeFilter         = localStorage.getItem(FILTER_KEY) ?? 'all';
let sortMode             = localStorage.getItem(SORT_KEY)   ?? 'newest';
let searchQuery          = '';
let isDark               = localStorage.getItem(THEME_KEY) === 'dark';
let lastAddedId          = null;
let lastToggledId        = null;
let toastTimer           = null;   // 토스트 숨김 타이머
let undoTimer            = null;   // undo 스택 만료 타이머 (5초)
let undoStack            = null;   // { task, index } — 마지막 삭제 1건
let pendingDuplicateText = null;   // 중복 경고 후 한 번 더 누르면 추가 허용
let dragSrcId            = null;   // 드래그 중인 항목의 id
let saveTimer            = null;   // 디바운스 저장 타이머
let searchTimer          = null;   // 디바운스 검색 타이머

// ── DOM 참조 ─────────────────────────────────────────────────
const input             = document.getElementById('task-input');
const categorySelect    = document.getElementById('category-select');
const addBtn            = document.getElementById('add-btn');
const list              = document.getElementById('task-list');
const filterBtns        = document.querySelectorAll('.filter-btn');
const searchInput       = document.getElementById('search-input');
const sortSelect        = document.getElementById('sort-select');
const themeToggle       = document.getElementById('theme-toggle');
const themeLabel        = document.getElementById('theme-label');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const listFooter        = document.getElementById('list-footer');
const exportBtn         = document.getElementById('export-btn');
const importBtn         = document.getElementById('import-btn');
const importFile        = document.getElementById('import-file');
const toast             = document.getElementById('toast');
const srAnnouncer       = document.getElementById('sr-announcer');
const progressTrack     = document.getElementById('progress-track');
const encourageMsg      = document.getElementById('encourage-msg');
const quoteText         = document.getElementById('quote-text');

// ── 초기화 ───────────────────────────────────────────────────
applyTheme(isDark, false);
renderFilters();
sortSelect.value = sortMode;
showDailyQuote();
render();

// ── 이벤트 리스너 ─────────────────────────────────────────────
addBtn.addEventListener('click', addTask);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// 검색: 200ms 디바운스로 불필요한 렌더 감소
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = searchInput.value.trim();
    render();
  }, 200);
});

sortSelect.addEventListener('change', () => {
  sortMode = sortSelect.value;
  localStorage.setItem(SORT_KEY, sortMode);
  render();
});

themeToggle.addEventListener('click', toggleTheme);
clearCompletedBtn.addEventListener('click', clearCompleted);
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importData);

// ── 키보드 단축키 ─────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // 입력 필드 포커스 중 Alt 없이 타이핑하면 단축키 차단
  const inInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName) && !e.altKey;
  if (inInput) return;
  if (!e.altKey) return;

  const keyMap = {
    'n': () => { input.focus(); showToast('새 할 일 입력'); },
    'N': () => { input.focus(); showToast('새 할 일 입력'); },
    '1': () => { setFilter('all');      showToast('필터: 전체'); },
    '2': () => { setFilter('work');     showToast('필터: 업무'); },
    '3': () => { setFilter('personal'); showToast('필터: 개인'); },
    '4': () => { setFilter('study');    showToast('필터: 공부'); },
    'd': () => { toggleTheme(); showToast(isDark ? '다크 모드' : '라이트 모드'); },
    'D': () => { toggleTheme(); showToast(isDark ? '다크 모드' : '라이트 모드'); },
    'z': () => undoDelete(),
    'Z': () => undoDelete(),
  };

  const action = keyMap[e.key];
  if (action) { e.preventDefault(); action(); }
});

// ══════════════════════════════════════════════════════════════
//  다크 모드
// ══════════════════════════════════════════════════════════════

function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  applyTheme(isDark, true);
}

function applyTheme(dark, animate = true) {
  if (animate) {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 400);
  }
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeToggle.classList.toggle('active', dark);
  themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
  themeLabel.textContent = dark ? '다크' : '라이트';
}

// ══════════════════════════════════════════════════════════════
//  할 일 CRUD
// ══════════════════════════════════════════════════════════════

function addTask() {
  const text = input.value.trim();
  if (!text) { shake(input); return; }

  // 미완료 항목 중 동일 텍스트가 있으면 경고 — 한 번 더 누르면 추가 허용
  const isDuplicate = tasks.some((t) => t.text === text && !t.completed);
  if (isDuplicate && pendingDuplicateText !== text) {
    pendingDuplicateText = text;
    showToast(`이미 있는 할 일입니다. 한 번 더 추가하려면 다시 누르세요.`);
    return;
  }
  pendingDuplicateText = null;

  const task = {
    id: Date.now(),
    text,
    completed: false,
    category: categorySelect.value,
    createdAt: new Date().toISOString(),
  };
  lastAddedId = task.id;
  tasks.push(task);
  input.value = '';
  debouncedSave();
  render();
  announce(`할 일 추가됨: ${text}`);
}

function deleteTask(id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const task = tasks[idx];
  const li   = list.querySelector(`[data-id="${id}"]`);

  // splice로 삭제하고 undo 스택에 저장
  tasks.splice(idx, 1);
  undoStack = { task, index: idx };
  debouncedSave();

  if (li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      render();
      showUndoToast(task.text);
    }, { once: true });
  } else {
    render();
    showUndoToast(task.text);
  }
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  lastToggledId = id;
  debouncedSave();
  render();
}

function clearCompleted() {
  const count = tasks.filter((t) => t.completed).length;
  if (count === 0) return;
  if (!confirm(`완료된 항목 ${count}개를 모두 삭제할까요?`)) return;
  tasks = tasks.filter((t) => !t.completed);
  undoStack = null; // 일괄 삭제는 단건 undo 불가
  debouncedSave();
  render();
}

function undoDelete() {
  if (!undoStack) {
    showToast('되돌릴 삭제가 없습니다.');
    return;
  }
  clearTimeout(undoTimer);
  const { task, index } = undoStack;
  tasks.splice(index, 0, task); // 원래 위치에 복원
  undoStack = null;
  lastAddedId = task.id;
  debouncedSave();
  render();
  announce(`복구됨: ${task.text}`);
  showToast(`'${task.text}' 복구됨`);
}

// ══════════════════════════════════════════════════════════════
//  필터
// ══════════════════════════════════════════════════════════════

function setFilter(filter) {
  activeFilter = filter;
  localStorage.setItem(FILTER_KEY, activeFilter);
  renderFilters();
  render();
}

// ══════════════════════════════════════════════════════════════
//  정렬
// ══════════════════════════════════════════════════════════════

// 필터된 항목에 정렬을 적용하여 반환
// 수동 정렬(manual)은 tasks[] 배열 순서 그대로 사용
function getSortedVisible(visible) {
  if (sortMode === 'manual') return visible;

  return [...visible].sort((a, b) => {
    // 완료 항목은 항상 하단
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    switch (sortMode) {
      case 'oldest':   return new Date(a.createdAt) - new Date(b.createdAt);
      case 'category': return a.category.localeCompare(b.category, 'ko');
      case 'alpha':    return a.text.localeCompare(b.text, 'ko');
      default:         return new Date(b.createdAt) - new Date(a.createdAt); // newest
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  내보내기 / 가져오기
// ══════════════════════════════════════════════════════════════

function exportData() {
  const json     = JSON.stringify(tasks, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  const filename = `my-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.href     = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('내보내기 완료');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  importFile.value = ''; // 동일 파일 재선택 허용

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error('not an array');

      if (tasks.length > 0) {
        // 기존 데이터가 있으면 합치기/교체 선택
        const merge = confirm(
          `현재 할 일 ${tasks.length}개가 있습니다.\n` +
          `가져온 데이터와 합치겠습니까?\n` +
          `(취소 선택 시 현재 데이터를 가져온 데이터로 교체합니다.)`
        );
        if (merge) {
          // id 기준 중복 제거 후 합치기
          const existingIds = new Set(tasks.map((t) => t.id));
          const newItems    = data
            .filter((t) => !existingIds.has(t.id))
            .map((t) => ({ category: 'work', ...t }));
          tasks = [...tasks, ...newItems];
        } else {
          tasks = data.map((t) => ({ category: 'work', ...t }));
        }
      } else {
        tasks = data.map((t) => ({ category: 'work', ...t }));
      }

      debouncedSave();
      render();
      showToast(`가져오기 완료: ${data.length}개 항목`);
    } catch {
      showToast('올바르지 않은 JSON 파일입니다.');
    }
  };
  reader.readAsText(file, 'utf-8');
}

// ══════════════════════════════════════════════════════════════
//  드래그 앤 드롭 (수동 정렬 전용)
// ══════════════════════════════════════════════════════════════

function bindDnD(li, id) {
  if (sortMode !== 'manual') return;

  li.setAttribute('draggable', 'true');

  li.addEventListener('dragstart', (e) => {
    dragSrcId = id;
    e.dataTransfer.effectAllowed = 'move';
    // 브라우저가 드래그 고스트를 그리기 전 스타일 적용
    setTimeout(() => li.classList.add('dragging'), 0);
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    list.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    dragSrcId = null;
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // 이전 drag-over 해제 후 현재 항목에만 적용
    list.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    if (id !== dragSrcId) li.classList.add('drag-over');
  });

  li.addEventListener('dragleave', () => li.classList.remove('drag-over'));

  li.addEventListener('drop', (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    if (dragSrcId === null || dragSrcId === id) return;

    const srcIdx  = tasks.findIndex((t) => t.id === dragSrcId);
    const destIdx = tasks.findIndex((t) => t.id === id);
    if (srcIdx === -1 || destIdx === -1) return;

    // tasks[] 배열에서 직접 순서 변경 — 이게 수동 정렬의 영구 순서
    const [moved] = tasks.splice(srcIdx, 1);
    tasks.splice(destIdx, 0, moved);
    debouncedSave();
    render();
  });
}

// ══════════════════════════════════════════════════════════════
//  인라인 수정
// ══════════════════════════════════════════════════════════════

function startEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  const li = list.querySelector(`[data-id="${id}"]`);
  if (!li || li.classList.contains('editing')) return;

  li.classList.add('editing');
  li.querySelector('input[type="checkbox"]').style.visibility = 'hidden';
  li.querySelector('.category-tag').style.display             = 'none';
  li.querySelector('.delete-btn').style.display               = 'none';
  const handle = li.querySelector('.drag-handle');
  if (handle) handle.style.display = 'none';

  const content   = li.querySelector('.task-content');
  content.innerHTML = '';

  const editInput     = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'edit-input';
  editInput.value     = task.text;
  editInput.setAttribute('aria-label', '할 일 수정');

  const editCat     = document.createElement('select');
  editCat.className = 'edit-cat-select';
  editCat.setAttribute('aria-label', '카테고리 변경');
  Object.entries(CATEGORIES).forEach(([key, { label }]) => {
    const opt       = document.createElement('option');
    opt.value       = key;
    opt.textContent = label;
    opt.selected    = key === task.category;
    editCat.appendChild(opt);
  });

  content.append(editInput, editCat);
  editInput.focus();
  editInput.select();

  function commitEdit() {
    const newText = editInput.value.trim();
    if (!newText) { cancelEdit(); return; }
    task.text     = newText;
    task.category = editCat.value;
    debouncedSave();
    render();
  }

  function cancelEdit() { render(); }

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') cancelEdit();
  });

  // editInput → editCat 포커스 이동 시 취소되지 않도록 150ms 딜레이 활용
  let blurTimer;
  function onBlur()  { blurTimer = setTimeout(() => {
    if (document.activeElement !== editInput && document.activeElement !== editCat) cancelEdit();
  }, 150); }
  function onFocus() { clearTimeout(blurTimer); }

  editInput.addEventListener('blur',  onBlur);
  editInput.addEventListener('focus', onFocus);
  editCat.addEventListener('blur',    onBlur);
  editCat.addEventListener('focus',   onFocus);
}

// ══════════════════════════════════════════════════════════════
//  렌더링
// ══════════════════════════════════════════════════════════════

function renderFilters() {
  filterBtns.forEach((btn) => {
    const active = btn.dataset.filter === activeFilter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderDashboard() {
  const total     = tasks.length;
  const done      = tasks.filter((t) => t.completed).length;
  const remaining = total - done;
  const pct       = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('dash-count').textContent    = `${done}/${total} 완료`;
  document.getElementById('dash-pct').textContent      = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;

  // progressbar ARIA 동적 업데이트
  progressTrack.setAttribute('aria-valuenow', pct);
  progressTrack.setAttribute('aria-label', `전체 진행률 ${pct}%`);

  // 남은 할 일 배지
  const badge = document.getElementById('remaining-badge');
  badge.textContent   = remaining;
  badge.style.display = remaining > 0 ? 'inline-flex' : 'none';
  badge.setAttribute('aria-label', `남은 할 일 ${remaining}개`);

  // 오늘 추가한 항목 수
  const todayStr   = new Date().toDateString();
  const todayCount = tasks.filter((t) => new Date(t.createdAt).toDateString() === todayStr).length;
  document.getElementById('stat-today').textContent = todayCount;

  // 카테고리별 미니 진행률
  Object.keys(CATEGORIES).forEach((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat);
    const catDone  = catTasks.filter((t) => t.completed).length;
    const catPct   = catTasks.length ? Math.round((catDone / catTasks.length) * 100) : 0;
    document.getElementById(`stat-${cat}`).textContent      = `${catDone}/${catTasks.length}`;
    document.getElementById(`mini-fill-${cat}`).style.width = `${catPct}%`;
  });

  // 완료 항목 삭제 버튼 표시
  listFooter.style.display = done > 0 ? 'flex' : 'none';

  // 응원 메시지 — 할 일이 없을 때는 숨김
  if (total === 0) {
    encourageMsg.textContent = '';
    encourageMsg.classList.remove('celebrate');
    return;
  }
  const enc = ENCOURAGEMENTS.find((e) => pct >= e.min && pct <= e.max);
  if (enc) {
    const isNew = encourageMsg.textContent !== enc.msg;
    encourageMsg.textContent = enc.msg;
    if (pct === 100 && isNew) {
      // 100% 달성 시 축하 애니메이션 (reflow 강제로 재생)
      encourageMsg.classList.remove('celebrate');
      void encourageMsg.offsetWidth;
      encourageMsg.classList.add('celebrate');
    } else if (pct < 100) {
      encourageMsg.classList.remove('celebrate');
    }
  } else {
    encourageMsg.textContent = '';
    encourageMsg.classList.remove('celebrate');
  }
}

function render() {
  list.innerHTML = '';

  const q = searchQuery.toLowerCase();
  const filtered = tasks.filter((t) => {
    if (activeFilter !== 'all' && t.category !== activeFilter) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  const visible = getSortedVisible(filtered);

  if (visible.length === 0) {
    let msg;
    if (q) {
      msg = `'${searchQuery}'에 대한 검색 결과가 없습니다.`;
    } else if (activeFilter === 'all') {
      msg = '할 일이 없습니다. 추가해보세요!';
    } else {
      msg = '이 카테고리에 할 일이 없습니다.';
    }
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = msg;
    list.appendChild(p);
    renderDashboard();
    return;
  }

  // DocumentFragment로 DOM 조작 최소화 (100+ 항목 성능 대응)
  const fragment = document.createDocumentFragment();

  visible.forEach((task) => {
    const cat = CATEGORIES[task.category] ?? CATEGORIES.work;

    const li      = document.createElement('li');
    li.className  = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    // 수동 정렬 모드에서만 드래그 핸들 표시
    if (sortMode === 'manual') {
      const handle         = document.createElement('span');
      handle.className     = 'drag-handle';
      handle.textContent   = '⠿';
      handle.title         = '드래그하여 순서 변경';
      handle.setAttribute('aria-hidden', 'true');
      li.appendChild(handle);
    }

    const checkbox   = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `완료: ${task.text}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const content     = document.createElement('div');
    content.className = 'task-content';

    const span       = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.text;
    span.title       = '더블클릭하여 수정';
    span.addEventListener('dblclick', (e) => { e.preventDefault(); startEdit(task.id); });

    const time       = document.createElement('span');
    time.className   = 'task-time';
    time.textContent = relativeTime(task.createdAt);

    content.append(span, time);

    const tag                 = document.createElement('span');
    tag.className             = 'category-tag';
    tag.textContent           = cat.label;
    tag.style.backgroundColor = cat.color;

    const del = document.createElement('button');
    del.className   = 'delete-btn';
    del.textContent = '✕';
    del.setAttribute('aria-label', `${task.text} 삭제`);
    del.addEventListener('click', () => deleteTask(task.id));

    li.append(checkbox, content, tag, del);

    bindDnD(li, task.id);
    fragment.appendChild(li);
  });

  list.appendChild(fragment);

  // 추가/토글 애니메이션 — 해당 항목에만 적용
  if (lastAddedId !== null) {
    list.querySelector(`[data-id="${lastAddedId}"]`)?.classList.add('entering');
    lastAddedId = null;
  }
  if (lastToggledId !== null) {
    list.querySelector(`[data-id="${lastToggledId}"]`)?.classList.add('toggling');
    lastToggledId = null;
  }

  renderDashboard();
}

// ══════════════════════════════════════════════════════════════
//  오늘의 격언
// ══════════════════════════════════════════════════════════════

// 날짜 기반 인덱스 — 하루 동안 동일한 격언 표시
function showDailyQuote() {
  const idx = Math.floor(Date.now() / 86400000) % QUOTES.length;
  const q   = QUOTES[idx];
  quoteText.textContent = `"${q.text}" — ${q.author}`;
}

// ══════════════════════════════════════════════════════════════
//  유틸
// ══════════════════════════════════════════════════════════════

function relativeTime(isoString) {
  if (!isoString) return '';
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return '방금 전';
  if (mins < 60)  return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days  = Math.floor(hours / 24);
  if (days < 7)   return `${days}일 전`;
  return new Date(isoString).toLocaleDateString('ko-KR');
}

/** 짧은 피드백 토스트 (기본 1.4초) */
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg; // textContent로 XSS 방지
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
}

/** 삭제 직후 Undo 버튼을 포함한 토스트 (5초) */
function showUndoToast(taskText) {
  clearTimeout(toastTimer);
  clearTimeout(undoTimer);

  toast.innerHTML = '';
  const msg = document.createElement('span');
  msg.textContent = `'${taskText}' 삭제됨`;

  const btn       = document.createElement('button');
  btn.className   = 'undo-btn';
  btn.textContent = '되돌리기';
  btn.addEventListener('click', () => {
    clearTimeout(toastTimer);
    clearTimeout(undoTimer);
    toast.classList.remove('show');
    undoDelete();
  });

  toast.append(msg, btn);
  toast.classList.add('show');

  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
  // 5초 후 undo 스택 만료 — 그 이후엔 되돌리기 불가
  undoTimer  = setTimeout(() => { undoStack = null; }, 5000);
}

/** 빈 값 제출 시 입력 필드 흔들기 */
function shake(el) {
  el.style.animation = 'none';
  el.getBoundingClientRect(); // reflow 강제
  el.style.animation = 'shakeInput 0.35s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

/** 스크린 리더에게 메시지 전달 (aria-live) */
function announce(msg) {
  srAnnouncer.textContent = '';
  requestAnimationFrame(() => { srAnnouncer.textContent = msg; });
}

/** 저장을 300ms 디바운스하여 빠른 연속 조작 시 localStorage 쓰기 최소화 */
function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    // category 필드 없는 구버전 데이터 호환
    return data.map((t) => ({ category: 'work', ...t }));
  } catch {
    return [];
  }
}
