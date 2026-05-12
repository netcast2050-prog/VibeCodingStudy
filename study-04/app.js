/* ── 상태 변수 ── */
let tasks = [];
let currentFilter = 'all';
let undoBuffer = null;
let toastTimer = null;

/* ── LocalStorage ── */
function saveTasks() {
  localStorage.setItem('todoflow_tasks', JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const stored = localStorage.getItem('todoflow_tasks');
    tasks = stored ? JSON.parse(stored) : [];
  } catch {
    tasks = [];
  }
}

/* ── CRUD ── */
function addTask(text, category) {
  if (!text.trim()) return;
  tasks.push({
    id: String(Date.now()),
    text: text.trim(),
    category,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  saveTasks();
}

function updateTask(id, newText) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.text = newText;
    saveTasks();
  }
}

function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return;
  undoBuffer = { task: tasks[index], index };
  tasks.splice(index, 1);
  saveTasks();
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
  }
}

/* ── Undo ── */
function undoDelete() {
  if (!undoBuffer) return;
  tasks.splice(undoBuffer.index, 0, undoBuffer.task);
  saveTasks();
  undoBuffer = null;
}

/* ── 필터 ── */
function getFilteredTasks() {
  if (currentFilter === 'all') return tasks;
  return tasks.filter(t => t.category === currentFilter);
}

/* ── 진행률 ── */
function getProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total === 0 ? 0 : Math.round(completed / total * 100);
  return { total, completed, percent };
}

/* ── 렌더링 ── */
function renderAll() {
  renderProgress();
  renderTabs();
  renderTodoList();
}

function renderProgress() {
  const { total, completed, percent } = getProgress();

  document.getElementById('progress-text').textContent =
    `완료 ${completed} / 전체 ${total} (${percent}%)`;

  document.getElementById('progress-fill').style.width = `${percent}%`;
}

function renderTabs() {
  const buttons = document.querySelectorAll('#category-tabs button');

  buttons.forEach(btn => {
    const cat = btn.dataset.category;
    const badge = btn.querySelector('.tab-badge');

    let total, completed;
    if (cat === 'all') {
      total = tasks.length;
      completed = tasks.filter(t => t.completed).length;
    } else {
      const catTasks = tasks.filter(t => t.category === cat);
      total = catTasks.length;
      completed = catTasks.filter(t => t.completed).length;
    }

    badge.textContent = `${completed}/${total}`;

    btn.classList.toggle('active', cat === currentFilter);
  });
}

function renderTodoList() {
  const list = document.getElementById('todo-list');
  const emptyMsg = document.getElementById('empty-msg');
  const filtered = getFilteredTasks();

  // 기존 항목 제거 (empty-msg 제외)
  Array.from(list.children).forEach(child => {
    if (child.id !== 'empty-msg') child.remove();
  });

  if (filtered.length === 0) {
    emptyMsg.style.display = '';
    return;
  }

  emptyMsg.style.display = 'none';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    // 커스텀 체크박스
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.id = `chk-${task.id}`;
    checkbox.checked = task.completed;

    const checkLabel = document.createElement('label');
    checkLabel.className = 'checkbox-label';
    checkLabel.htmlFor = `chk-${task.id}`;

    // 텍스트 + 뱃지 묶음
    const content = document.createElement('div');
    content.className = 'todo-content';

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = task.text;

    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.dataset.cat = task.category;
    badge.textContent = task.category;

    content.appendChild(textSpan);
    content.appendChild(badge);

    // 수정/삭제 버튼
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.dataset.id = task.id;
    editBtn.setAttribute('aria-label', '수정');
    editBtn.textContent = '✎';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = task.id;
    deleteBtn.setAttribute('aria-label', '삭제');
    deleteBtn.textContent = '🗑';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(checkLabel);
    li.appendChild(content);
    li.appendChild(actions);

    list.appendChild(li);
  });
}

/* ── 인라인 수정 ── */
function startEdit(li, id) {
  const content = li.querySelector('.todo-content');
  const textSpan = content.querySelector('.todo-text');
  const originalText = textSpan.textContent;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'edit-input';
  editInput.value = originalText;

  content.replaceChild(editInput, textSpan);
  editInput.focus();
  editInput.select();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    const newText = editInput.value.trim();
    if (newText && newText !== originalText) {
      updateTask(id, newText);
    }
    renderAll();
  }

  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { committed = true; renderAll(); }
  });

  editInput.addEventListener('blur', commit);
}

/* ── 토스트 ── */
function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = message;

  clearTimeout(toastTimer);
  toast.hidden = false;
  // 다음 프레임에서 .show 추가해야 transition 작동
  requestAnimationFrame(() => toast.classList.add('show'));

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => { toast.hidden = true; }, { once: true });
  }, 2000);
}

function hideToast() {
  clearTimeout(toastTimer);
  const toast = document.getElementById('toast');
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => { toast.hidden = true; }, { once: true });
}

/* ── 날짜 표시 ── */
function renderDate() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const day = days[now.getDay()];
  document.getElementById('today-date').textContent =
    `${y}년 ${m}월 ${d}일 ${day}요일`;
}

/* ── select ↔ 탭 색상 연동 ── */
function syncSelectHint() {
  const select = document.getElementById('category-select');
  const cat = select.value;

  // select 자체 색상 (data-cat 속성으로 CSS 제어)
  select.dataset.cat = cat;

  // 탭 버튼 select-hint 클래스 갱신
  document.querySelectorAll('#category-tabs button').forEach(btn => {
    btn.classList.toggle('select-hint', btn.dataset.category === cat);
  });
}

/* ── 이벤트 핸들러 등록 ── */
function registerEvents() {
  const input = document.getElementById('todo-input');
  const select = document.getElementById('category-select');
  const addBtn = document.getElementById('add-btn');
  const todoList = document.getElementById('todo-list');
  const categoryTabs = document.getElementById('category-tabs');
  const undoBtn = document.getElementById('undo-btn');

  // select 변경 시 탭 연동
  select.addEventListener('change', syncSelectHint);

  // 할 일 추가
  function handleAdd() {
    if (!input.value.trim()) {
      input.classList.remove('shake');
      void input.offsetWidth; // reflow — 같은 프레임에서 애니메이션 재시작
      input.classList.add('shake');
      input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
      return;
    }
    addTask(input.value, select.value);
    input.value = '';
    renderAll();
  }

  addBtn.addEventListener('click', handleAdd);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAdd();
  });

  // 이벤트 위임: 체크, 수정, 삭제
  todoList.addEventListener('change', e => {
    if (e.target.classList.contains('todo-checkbox')) {
      const id = e.target.closest('li').dataset.id;
      toggleComplete(id);
      renderAll();
    }
  });

  todoList.addEventListener('click', e => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (editBtn) {
      const li = editBtn.closest('li');
      startEdit(li, editBtn.dataset.id);
    }

    if (deleteBtn) {
      deleteTask(deleteBtn.dataset.id);
      renderAll();
      showToast('삭제됐습니다');
    }
  });

  // 카테고리 탭 필터
  categoryTabs.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    currentFilter = btn.dataset.category;
    renderAll();
  });

  // Undo
  undoBtn.addEventListener('click', () => {
    undoDelete();
    renderAll();
    hideToast();
  });
}

/* ── 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  renderDate();
  renderAll();
  registerEvents();
  syncSelectHint(); // 페이지 로드 시 초기 select 값 반영
});
