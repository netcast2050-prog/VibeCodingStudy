// ─── 상태 ────────────────────────────────────────────────
let currentImage    = null;
let ingredients     = [];
let retryCountdownTimer = null;
let recognizeModel  = localStorage.getItem('fridge_vision_model') || 'google/gemini-3.1-flash-lite';

// ─── DOM 참조 ────────────────────────────────────────────
const uploadZone      = document.getElementById('uploadZone');
const uploadHolder    = document.getElementById('uploadPlaceholder');
const previewImg      = document.getElementById('previewImg');
const fileInput       = document.getElementById('fileInput');
const cameraInput     = document.getElementById('cameraInput');
const recognizeBtn    = document.getElementById('recognizeBtn');
const loadingState    = document.getElementById('loadingState');
const errorState      = document.getElementById('errorState');
const errorMsg        = document.getElementById('errorMsg');
const retryBtn        = document.getElementById('retryBtn');
const ingredientsCard = document.getElementById('ingredientsCard');
const tagContainer    = document.getElementById('tagContainer');
const emptyTags       = document.getElementById('emptyTags');
const addInput        = document.getElementById('addInput');
const addBtn          = document.getElementById('addBtn');
const goRecipeBtn     = document.getElementById('goRecipeBtn');
const reRecognizeBtn  = document.getElementById('reRecognizeBtn');
const healthBtn       = document.getElementById('healthBtn');
const healthStatus    = document.getElementById('healthStatus');
const modelPicker     = document.getElementById('modelPicker');
const modelBtns       = document.getElementById('modelBtns');
const toast           = document.getElementById('toast');
const savedBadge      = document.getElementById('savedBadge');

// ─── 탭 전환 ─────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === tabId);
  });
  if (tabId === 'step2') initStep2();
  if (tabId === 'step3') initStep3();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ─── 이미지 리사이즈 (canvas) ────────────────────────────
function resizeImage(file, maxPx = 1024) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round((h * maxPx) / w); w = maxPx; }
        else        { w = Math.round((w * maxPx) / h); h = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// ─── 이미지 선택 처리 ────────────────────────────────────
async function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 선택할 수 있어요.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('10MB 이하 이미지만 업로드 가능해요.');
    return;
  }

  const resized = await resizeImage(file);
  if (!resized) { showToast('이미지를 처리할 수 없어요.'); return; }

  currentImage = resized;
  previewImg.src = resized;
  previewImg.classList.remove('hidden');
  uploadHolder.classList.add('hidden');
  recognizeBtn.disabled = false;

  // 이전 결과 초기화
  ingredientsCard.classList.add('hidden');
  errorState.classList.add('hidden');
  loadingState.classList.add('hidden');
}

fileInput.addEventListener('change',  e => handleFile(e.target.files[0]));
cameraInput.addEventListener('change', e => handleFile(e.target.files[0]));

// 업로드 존 클릭 → 파일 선택
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

// 드래그&드롭
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});

// ─── 재료 인식 ────────────────────────────────────────────
async function recognize() {
  if (!currentImage) return;

  clearTimeout(retryCountdownTimer);
  resetLoadingText();
  setRecognizingState(true);

  let needCountdown = 0;

  try {
    const res = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: currentImage, model: recognizeModel }),
    });
    const data = await res.json();

    if (res.status === 429 && data.retryAfter) {
      needCountdown = data.retryAfter;
      return;
    }

    if (!res.ok) throw new Error(data.error || '서버 오류');

    ingredients = data.ingredients;
    renderTags();
    ingredientsCard.classList.remove('hidden');
    errorState.classList.add('hidden');

    if (ingredients.length === 0) showToast('재료를 인식하지 못했어요. 직접 추가해 보세요.');
  } catch (e) {
    errorMsg.textContent = e.message;
    errorState.classList.remove('hidden');
    ingredientsCard.classList.add('hidden');
  } finally {
    setRecognizingState(false);
    if (needCountdown > 0) startRetryCountdown(needCountdown);
  }
}

function resetLoadingText() {
  loadingState.querySelector('p').textContent        = '냉장고를 살펴보는 중...';
  loadingState.querySelector('.state-hint').textContent = '최대 30초 정도 걸릴 수 있어요';
}

function setRecognizingState(active) {
  recognizeBtn.disabled = active;
  loadingState.classList.toggle('hidden', !active);
  if (active) errorState.classList.add('hidden');
}

function startRetryCountdown(seconds) {
  clearTimeout(retryCountdownTimer);

  const loadingText = loadingState.querySelector('p');
  const loadingHint = loadingState.querySelector('.state-hint');

  loadingState.classList.remove('hidden');
  recognizeBtn.disabled = true;
  errorState.classList.add('hidden');

  let remaining = seconds;

  function tick() {
    loadingText.textContent = '잠시 후 자동 재시도...';
    loadingHint.textContent = `${remaining}초 후 다시 시도해요`;

    if (remaining <= 0) {
      recognize();
      return;
    }
    remaining--;
    retryCountdownTimer = setTimeout(tick, 1000);
  }

  tick();
}

recognizeBtn.addEventListener('click',    recognize);
retryBtn.addEventListener('click',        recognize);
reRecognizeBtn.addEventListener('click',  recognize);
healthBtn.addEventListener('click', checkHealth);

// ─── 서버 체크 ────────────────────────────────────────────
async function checkHealth() {
  healthBtn.disabled = true;
  healthStatus.textContent = '확인 중...';
  healthStatus.className = 'health-status checking';
  modelPicker.classList.add('hidden');

  try {
    const res  = await fetch(`/api/health?model=${encodeURIComponent(recognizeModel)}`);
    const data = await res.json();

    if (data.ok) {
      healthStatus.textContent = `✅ 서버 정상 (${data.latency}ms)`;
      healthStatus.className = 'health-status ok';
      if (currentImage) recognize();
    } else {
      healthStatus.textContent = `❌ ${data.error}`;
      healthStatus.className = 'health-status error';
      loadModelPicker();
    }
  } catch {
    healthStatus.textContent = '❌ 서버에 연결할 수 없어요';
    healthStatus.className = 'health-status error';
    loadModelPicker();
  } finally {
    healthBtn.disabled = false;
  }
}

// ─── 모델 피커 ────────────────────────────────────────────
async function loadModelPicker() {
  let models;
  try {
    const res = await fetch('/api/models');
    ({ models } = await res.json());
  } catch {
    models = [
      { id: 'google/gemma-4-31b-it:free',         name: 'Gemma 4 31B' },
      { id: 'meta-llama/llama-4-maverick:free',    name: 'Llama 4 Maverick' },
      { id: 'meta-llama/llama-4-scout:free',       name: 'Llama 4 Scout' },
      { id: 'qwen/qwen2.5-vl-72b-instruct:free',  name: 'Qwen 2.5 VL 72B' },
    ];
  }

  modelBtns.innerHTML = '';
  models.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'model-btn' + (m.id === recognizeModel ? ' active' : '');
    btn.textContent = m.name;
    btn.addEventListener('click', () => selectModel(m.id, m.name, btn));
    modelBtns.appendChild(btn);
  });

  modelPicker.classList.remove('hidden');
}

function selectModel(id, name, btn) {
  recognizeModel = id;
  localStorage.setItem('fridge_vision_model', id);
  modelBtns.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`${name} 모델로 변경됐어요`);
  checkHealth();
}

// ─── 태그 렌더링 ──────────────────────────────────────────
function renderTags() {
  tagContainer.innerHTML = '';
  const hasItems = ingredients.length > 0;
  emptyTags.classList.toggle('hidden', hasItems);
  goRecipeBtn.disabled = !hasItems;

  ingredients.forEach((name, i) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML =
      `${escapeHtml(name)}` +
      `<button class="tag-remove" data-i="${i}" aria-label="${escapeHtml(name)} 삭제">×</button>`;
    tagContainer.appendChild(tag);
  });
}

tagContainer.addEventListener('click', e => {
  const btn = e.target.closest('.tag-remove');
  if (!btn) return;
  ingredients.splice(Number(btn.dataset.i), 1);
  renderTags();
});

// ─── 재료 수동 추가 ───────────────────────────────────────
function addIngredient() {
  const val = addInput.value.trim();
  if (!val) return;
  if (ingredients.includes(val)) {
    showToast(`'${val}'은(는) 이미 있어요.`);
    return;
  }
  ingredients.push(val);
  renderTags();
  addInput.value = '';
  addInput.focus();
}

addBtn.addEventListener('click', addIngredient);
addInput.addEventListener('keydown', e => { if (e.key === 'Enter') addIngredient(); });

// ─── 레시피 생성으로 이동 ──────────────────────────────────
goRecipeBtn.addEventListener('click', () => {
  sessionStorage.setItem('fridge_ingredients', JSON.stringify(ingredients));
  switchTab('step2');
});

// ─── 저장 뱃지 초기화 ─────────────────────────────────────
function refreshSavedBadge() {
  const saved = JSON.parse(localStorage.getItem('fridge_saved_recipes') || '[]');
  if (saved.length > 0) {
    savedBadge.textContent = saved.length;
    savedBadge.classList.add('show');
  } else {
    savedBadge.classList.remove('show');
  }
}

refreshSavedBadge();

// ─── Toast ────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ─── 유틸 ────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ════════════════════════════════════════════════════════
//  Step 2 — 레시피 생성
// ════════════════════════════════════════════════════════

// ─── Step 2 상태 ─────────────────────────────────────────
let step2Ings    = [];    // sessionStorage에서 읽은 재료
let lastIngKey   = null;  // 마지막 생성에 사용한 재료 JSON (변경 감지)
let currentRecipes = [];

// ─── Step 2 DOM ──────────────────────────────────────────
const step2Empty      = document.getElementById('step2Empty');
const step2Main       = document.getElementById('step2Main');
const summaryTags     = document.getElementById('summaryTags');
const regenBtn        = document.getElementById('regenBtn');
const recipeLoading   = document.getElementById('recipeLoading');
const recipeError     = document.getElementById('recipeError');
const recipeErrorMsg  = document.getElementById('recipeErrorMsg');
const retryRecipeBtn  = document.getElementById('retryRecipeBtn');
const recipeList      = document.getElementById('recipeList');

// ─── Step 2 진입 ─────────────────────────────────────────
function initStep2() {
  const stored = sessionStorage.getItem('fridge_ingredients');
  step2Ings = stored ? JSON.parse(stored) : [];

  if (step2Ings.length === 0) {
    step2Empty.classList.remove('hidden');
    step2Main.classList.add('hidden');
    return;
  }

  step2Empty.classList.add('hidden');
  step2Main.classList.remove('hidden');

  // 재료 요약 태그 렌더링
  summaryTags.innerHTML = step2Ings
    .map(n => `<span class="tag">${escapeHtml(n)}</span>`)
    .join('');

  // 재료가 바뀌었을 때만 재생성
  if (stored !== lastIngKey) {
    lastIngKey = stored;
    fetchRecipes();
  }
}

// ─── 레시피 API 호출 ─────────────────────────────────────
async function fetchRecipes() {
  setRecipeLoading(true);

  const profile = JSON.parse(localStorage.getItem('fridge_user_profile') || '{}');

  try {
    const res = await fetch('/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: step2Ings,
        servings:    profile.servings ?? 2,
        dietary:     profile.dietary  ?? [],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '서버 오류');

    currentRecipes = data.recipes;
    renderRecipes();
    recipeError.classList.add('hidden');
  } catch (e) {
    recipeErrorMsg.textContent = e.message;
    recipeError.classList.remove('hidden');
    recipeList.innerHTML = '';
  } finally {
    setRecipeLoading(false);
  }
}

function setRecipeLoading(on) {
  recipeLoading.classList.toggle('hidden', !on);
  if (on) {
    recipeList.innerHTML = '';
    recipeError.classList.add('hidden');
  }
}

regenBtn.addEventListener('click', () => {
  lastIngKey = null;  // 강제 재생성
  fetchRecipes();
});

retryRecipeBtn.addEventListener('click', fetchRecipes);

// ─── 레시피 카드 렌더링 ───────────────────────────────────
function renderRecipes() {
  recipeList.innerHTML = '';
  currentRecipes.forEach(recipe => {
    recipeList.appendChild(buildRecipeCard(recipe));
  });
}

function buildRecipeCard(recipe, opts = {}) {
  const diffClass = { '쉬움': 'badge-easy', '보통': 'badge-medium', '어려움': 'badge-hard' };
  const badge  = diffClass[recipe.difficulty] || 'badge-medium';
  const saved  = isRecipeSaved(recipe);

  const usedHtml  = (recipe.usedIngredients  || [])
    .map(n => `<span class="tag tag-used">${escapeHtml(n)}</span>`).join('');
  const extraHtml = (recipe.extraIngredients || []).length > 0
    ? `<p class="ingredient-label ingredient-label-extra">추가 필요</p>
       <div class="tag-container">
         ${recipe.extraIngredients.map(n => `<span class="tag tag-extra">${escapeHtml(n)}</span>`).join('')}
       </div>`
    : '';
  const stepsHtml = (recipe.steps || [])
    .map(s => `<li>${escapeHtml(s.replace(/^\d+[.)]\s*/, ''))}</li>`).join('');

  const card = document.createElement('div');
  card.className = 'card recipe-card';
  card.innerHTML = `
    <div class="recipe-header">
      <div class="recipe-title-row">
        <h3>${recipeEmoji(recipe.name)} ${escapeHtml(recipe.name)}</h3>
        <span class="diff-badge ${badge}">${escapeHtml(recipe.difficulty)}</span>
      </div>
      <div class="recipe-meta">
        <span>⏱ ${escapeHtml(recipe.time)}</span>
        <span>·</span>
        <span>👥 ${escapeHtml(recipe.servings)}</span>
      </div>
    </div>

    <div class="recipe-ingredients">
      <p class="ingredient-label">사용 재료</p>
      <div class="tag-container">
        ${usedHtml || '<span style="font-size:.82rem;color:#a8a29e">정보 없음</span>'}
      </div>
      ${extraHtml}
    </div>

    <button class="accordion-btn" aria-expanded="false">
      <span class="accordion-label">📋 조리 순서 보기</span>
      <span class="accordion-arrow">▼</span>
    </button>
    <div class="accordion-body">
      <ol class="steps-list">${stepsHtml}</ol>
    </div>

    <div class="recipe-footer">
      ${opts.showDelete
        ? `<button class="delete-btn">🗑 삭제</button>`
        : `<button class="save-btn ${saved ? 'saved' : ''}">${saved ? '♥ 저장됨' : '♡ 저장'}</button>`
      }
    </div>
  `;

  // 아코디언
  const accBtn  = card.querySelector('.accordion-btn');
  const accBody = card.querySelector('.accordion-body');
  const accLabel = card.querySelector('.accordion-label');
  accBtn.addEventListener('click', () => {
    const open = accBtn.getAttribute('aria-expanded') === 'true';
    accBtn.setAttribute('aria-expanded', String(!open));
    accBody.classList.toggle('open', !open);
    accLabel.textContent = !open ? '📋 조리 순서 접기' : '📋 조리 순서 보기';
  });

  // 푸터 버튼
  if (opts.showDelete) {
    card.querySelector('.delete-btn').addEventListener('click', () => opts.onDelete?.(recipe));
  } else {
    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => toggleSave(recipe, saveBtn));
  }

  return card;
}

// ─── 저장 관리 ────────────────────────────────────────────
function recipeKey(r) {
  return `${r.name}||${(r.steps || [])[0] || ''}`;
}

function getSaved() {
  return JSON.parse(localStorage.getItem('fridge_saved_recipes') || '[]');
}

function isRecipeSaved(recipe) {
  const key = recipeKey(recipe);
  return getSaved().some(r => recipeKey(r) === key);
}

function toggleSave(recipe, btn) {
  const saved = getSaved();
  const key   = recipeKey(recipe);
  const idx   = saved.findIndex(r => recipeKey(r) === key);

  if (idx >= 0) {
    saved.splice(idx, 1);
    btn.textContent = '♡ 저장';
    btn.classList.remove('saved');
    showToast('저장이 취소됐습니다.');
  } else {
    saved.unshift({ ...recipe, id: String(Date.now()), savedAt: new Date().toISOString() });
    btn.textContent = '♥ 저장됨';
    btn.classList.add('saved');
    showToast('레시피가 저장됐습니다! 📚');
  }

  localStorage.setItem('fridge_saved_recipes', JSON.stringify(saved));
  refreshSavedBadge();
}

// ─── 요리 이모지 ──────────────────────────────────────────
function recipeEmoji(name) {
  const map = [
    ['볶음밥', '🍳'], ['볶음', '🥘'], ['찌개', '🍲'], ['국', '🥣'],
    ['죽',   '🥣'], ['구이', '🔥'], ['조림', '🥘'], ['무침', '🥗'],
    ['밥',   '🍚'], ['면',   '🍜'], ['국수', '🍜'], ['전',   '🥞'],
    ['튀김', '🍟'], ['샐러드','🥗'], ['수프', '🥣'], ['파스타','🍝'],
  ];
  for (const [kw, emoji] of map) {
    if (name.includes(kw)) return emoji;
  }
  return '🍽️';
}

// ════════════════════════════════════════════════════════
//  Step 3 — 저장된 레시피
// ════════════════════════════════════════════════════════

// ─── Step 3 상태 ─────────────────────────────────────────
let s3Filter  = '전체';
let s3Query   = '';
let undoItem  = null;
let undoTimer = null;

// ─── Step 3 DOM ──────────────────────────────────────────
const step3Empty      = document.getElementById('step3Empty');
const step3Main       = document.getElementById('step3Main');
const searchInput     = document.getElementById('searchInput');
const savedCountText  = document.getElementById('savedCountText');
const savedRecipeList = document.getElementById('savedRecipeList');

// ─── Step 3 진입 ─────────────────────────────────────────
function initStep3() {
  renderSavedList();
}

// ─── 저장 목록 렌더링 ─────────────────────────────────────
function renderSavedList() {
  const all = getSaved();

  if (all.length === 0) {
    step3Empty.classList.remove('hidden');
    step3Main.classList.add('hidden');
    return;
  }

  step3Empty.classList.add('hidden');
  step3Main.classList.remove('hidden');

  // 필터 + 검색 적용
  const q = s3Query.trim().toLowerCase();
  const filtered = all.filter(r => {
    const matchDiff = s3Filter === '전체' || r.difficulty === s3Filter;
    const matchQ    = !q
      || r.name.toLowerCase().includes(q)
      || (r.usedIngredients  || []).some(i => i.toLowerCase().includes(q))
      || (r.extraIngredients || []).some(i => i.toLowerCase().includes(q));
    return matchDiff && matchQ;
  });

  savedCountText.textContent = `${filtered.length}개의 레시피`;
  savedRecipeList.innerHTML  = '';

  if (filtered.length === 0) {
    savedRecipeList.innerHTML = '<p class="no-results">검색 결과가 없어요</p>';
    return;
  }

  filtered.forEach(recipe => {
    savedRecipeList.appendChild(
      buildRecipeCard(recipe, {
        showDelete: true,
        onDelete:   r => deleteSaved(r),
      })
    );
  });
}

// ─── 필터 탭 ─────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    s3Filter = btn.dataset.filter;
    renderSavedList();
  });
});

// ─── 검색 ────────────────────────────────────────────────
searchInput.addEventListener('input', e => {
  s3Query = e.target.value;
  renderSavedList();
});

// ─── 삭제 + Undo ─────────────────────────────────────────
function deleteSaved(recipe) {
  const saved = getSaved();
  const idx   = saved.findIndex(r => recipeKey(r) === recipeKey(recipe));
  if (idx < 0) return;

  undoItem = saved[idx];
  saved.splice(idx, 1);
  localStorage.setItem('fridge_saved_recipes', JSON.stringify(saved));
  refreshSavedBadge();
  renderSavedList();

  showUndoToast();
}

function showUndoToast() {
  clearTimeout(undoTimer);
  toast.innerHTML =
    `삭제됐습니다.&nbsp;` +
    `<button id="undoBtn" style="color:#fbbf24;font-weight:700;background:none;` +
    `border:none;cursor:pointer;font-size:inherit;padding:0;">되돌리기</button>`;
  toast.classList.remove('hidden');

  document.getElementById('undoBtn').addEventListener('click', undoDelete);

  undoTimer = setTimeout(() => {
    toast.classList.add('hidden');
    undoItem = null;
  }, 3000);
}

function undoDelete() {
  if (!undoItem) return;
  clearTimeout(undoTimer);

  const saved = getSaved();
  saved.unshift(undoItem);
  localStorage.setItem('fridge_saved_recipes', JSON.stringify(saved));
  undoItem = null;

  toast.classList.add('hidden');
  refreshSavedBadge();
  renderSavedList();
  showToast('복원됐습니다.');
}

// ════════════════════════════════════════════════════════
//  프로필 모달
// ════════════════════════════════════════════════════════

// ─── 프로필 DOM ───────────────────────────────────────────
const profileModal   = document.getElementById('profileModal');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profileNickname = document.getElementById('profileNickname');
const servingOptions  = document.getElementById('servingOptions');
const dietaryOptions  = document.getElementById('dietaryOptions');
const saveProfileBtn  = document.getElementById('saveProfileBtn');

// ─── 프로필 열기/닫기 ─────────────────────────────────────
function openProfile() {
  loadProfileToModal();
  profileModal.classList.remove('hidden');
}

function closeProfile() {
  profileModal.classList.add('hidden');
}

profileBtn.addEventListener('click', openProfile);
closeProfileBtn.addEventListener('click', closeProfile);
profileModal.addEventListener('click', e => {
  if (e.target === profileModal) closeProfile();
});

// ─── 모달에 현재 프로필 값 채우기 ────────────────────────
function loadProfileToModal() {
  const p = JSON.parse(localStorage.getItem('fridge_user_profile') || '{}');
  profileNickname.value = p.nickname ?? '';

  // 인분 수 버튼
  servingOptions.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.val) === (p.servings ?? 2));
  });

  // 식이제한 버튼
  const dietary = p.dietary ?? [];
  dietaryOptions.querySelectorAll('.option-btn').forEach(btn => {
    const val = btn.dataset.val;
    btn.classList.toggle('active',
      dietary.length === 0 ? val === '' : dietary.includes(val)
    );
  });
}

// ─── 인분 수 단일 선택 ────────────────────────────────────
servingOptions.addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;
  servingOptions.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

// ─── 식이제한 복수 선택 (없음 배타적) ─────────────────────
dietaryOptions.addEventListener('click', e => {
  const btn = e.target.closest('.option-btn');
  if (!btn) return;

  if (btn.dataset.val === '') {
    // "없음" 선택 → 나머지 해제
    dietaryOptions.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    // 다른 항목 선택 → "없음" 해제
    dietaryOptions.querySelector('[data-val=""]').classList.remove('active');
    btn.classList.toggle('active');
    // 아무것도 선택 안 되면 "없음" 복원
    const anyActive = [...dietaryOptions.querySelectorAll('.option-btn')]
      .some(b => b.classList.contains('active'));
    if (!anyActive) dietaryOptions.querySelector('[data-val=""]').classList.add('active');
  }
});

// ─── 프로필 저장 ─────────────────────────────────────────
saveProfileBtn.addEventListener('click', () => {
  const nickname = profileNickname.value.trim();
  if (!nickname) {
    profileNickname.focus();
    showToast('닉네임을 입력해 주세요.');
    return;
  }

  const servings = Number(
    servingOptions.querySelector('.option-btn.active')?.dataset.val ?? 2
  );

  const dietary = [...dietaryOptions.querySelectorAll('.option-btn.active')]
    .map(b => b.dataset.val)
    .filter(v => v !== '');

  localStorage.setItem('fridge_user_profile', JSON.stringify({ nickname, servings, dietary }));

  closeProfile();
  showToast(`${escapeHtml(nickname)}님, 프로필이 저장됐어요! 🎉`);

  // 레시피 탭에 있을 때 재생성 유도
  lastIngKey = null;
});

// ─── 첫 실행 시 프로필 모달 자동 표시 ──────────────────────
if (!localStorage.getItem('fridge_user_profile')) {
  openProfile();
}
