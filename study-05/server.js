require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.OPENROUTER_API_Key;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const VISION_MODELS = [
  { id: 'google/gemini-3.1-flash-lite',        name: 'Gemini 3.1 Flash Lite' },
  { id: 'meta-llama/llama-4-maverick:free',    name: 'Llama 4 Maverick' },
  { id: 'meta-llama/llama-4-scout:free',       name: 'Llama 4 Scout' },
  { id: 'qwen/qwen2.5-vl-72b-instruct:free',  name: 'Qwen 2.5 VL 72B' },
];

async function callOpenRouter(model, messages, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/health?model=xxx — 모델 연결 확인
app.get('/api/health', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ ok: false, error: 'API 키가 설정되지 않았습니다.' });

  const model = req.query.model || VISION_MODELS[0].id;
  const start = Date.now();

  try {
    const data = await callOpenRouter(model, [{ role: 'user', content: '연결 확인' }], 10000);

    if (data.error) {
      const code = data.error.code;
      return res.json({
        ok: false,
        error: code === 429 ? '모델 사용량 초과 (rate limit)' : (data.error.message || '모델 오류'),
        code,
      });
    }

    res.json({ ok: true, latency: Date.now() - start, model });
  } catch (e) {
    const msg = e.name === 'AbortError' ? '연결 시간 초과' : 'OpenRouter 연결 실패';
    res.json({ ok: false, error: msg });
  }
});

// GET /api/models — 사용 가능한 비전 모델 목록
app.get('/api/models', (req, res) => {
  res.json({ models: VISION_MODELS });
});

// POST /api/recognize — 이미지 → 재료 인식
app.post('/api/recognize', async (req, res) => {
  const { image, model: reqModel } = req.body;
  if (!image) return res.status(400).json({ error: '이미지가 필요합니다.' });

  const model = VISION_MODELS.some(m => m.id === reqModel) ? reqModel : VISION_MODELS[0].id;

  try {
    const data = await callOpenRouter(model, [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '이 이미지에 보이는 모든 식재료를 한국어로 나열하세요.\n콤마(,)로만 구분하고, 재료명 외 다른 텍스트는 절대 출력하지 마세요.\n예: 달걀, 우유, 당근, 양파, 돼지고기',
          },
          {
            type: 'image_url',
            image_url: { url: image },
          },
        ],
      },
    ]);

    if (data.error) {
      const code = data.error.code;
      if (code === 429) throw Object.assign(new Error('rate_limited'), { code: 429 });
      throw new Error(data.error.message || '모델 오류');
    }

    const raw = data.choices?.[0]?.message?.content ?? '';
    const ingredients = raw
      .split(/[,，、\n]/)
      .map(s => s.trim().replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(s => s.length > 0 && s.length <= 15);

    res.json({ ingredients });
  } catch (e) {
    console.error('[/api/recognize]', e.message);
    const msg =
      e.name === 'AbortError'  ? '요청 시간이 초과됐습니다. 다시 시도해 주세요.' :
      e.code   === 429         ? '무료 모델 사용량이 일시적으로 초과됐습니다. 잠시 후 다시 시도해 주세요.' :
                                 '재료 인식 중 오류가 발생했습니다.';
    if (e.code === 429) {
      res.status(429).json({ error: msg, retryAfter: 15 });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// POST /api/recipe — 재료 → 레시피 생성 (openai/gpt-oss-120b:free)
app.post('/api/recipe', async (req, res) => {
  const { ingredients = [], servings = 2, dietary = [] } = req.body;
  if (ingredients.length === 0) return res.status(400).json({ error: '재료가 필요합니다.' });

  const dietaryNote = dietary.length > 0
    ? `\n- 식이제한: ${dietary.join(', ')} (이에 맞는 재료와 조리법 사용)`
    : '';

  try {
    const data = await callOpenRouter('deepseek/deepseek-v4-flash', [
      {
        role: 'system',
        content: '당신은 한국 가정식 요리 전문가입니다. 반드시 순수 JSON 배열만 출력하세요. 마크다운, 설명, 코드블록 없이 JSON 배열([...])만 출력합니다.',
      },
      {
        role: 'user',
        content: `재료: ${ingredients.join(', ')}\n기본 인분: ${servings}인분${dietaryNote}

위 재료로 만들 수 있는 한국 가정식 레시피 3가지를 아래 JSON 배열 형식으로만 추천해주세요.

[
  {
    "name": "요리 이름",
    "time": "20분",
    "difficulty": "쉬움",
    "servings": "${servings}인분",
    "usedIngredients": ["입력 재료 중 사용하는 것만"],
    "extraIngredients": ["추가로 필요한 재료, 없으면 빈 배열"],
    "steps": ["1. 단계", "2. 단계", "3. 단계"]
  }
]

규칙:
- difficulty는 쉬움/보통/어려움 3가지를 각각 하나씩 사용
- steps는 4~7개
- usedIngredients는 입력된 재료 목록에서만 선택
- 모든 텍스트는 한국어`,
      },
    ], 90000);

    if (data.error) {
      const code = data.error.code;
      if (code === 429) throw Object.assign(new Error('rate_limited'), { code: 429 });
      throw new Error(data.error.message || '모델 오류');
    }

    const raw = data.choices?.[0]?.message?.content ?? '';
    const recipes = extractJSON(raw);
    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      throw new Error('레시피 파싱에 실패했습니다. 다시 시도해 주세요.');
    }

    res.json({ recipes });
  } catch (e) {
    console.error('[/api/recipe]', e.message);
    const msg =
      e.name === 'AbortError' ? '요청 시간이 초과됐습니다. 다시 시도해 주세요.' :
      e.code  === 429         ? '무료 모델 사용량이 일시적으로 초과됐습니다. 잠시 후 다시 시도해 주세요.' :
                                e.message || '레시피 생성 중 오류가 발생했습니다.';
    res.status(e.code === 429 ? 429 : 500).json({ error: msg });
  }
});

function extractJSON(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) { try { return JSON.parse(block[1].trim()); } catch {} }
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) { try { return JSON.parse(arr[0]); } catch {} }
  return null;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧑‍🍳 냉장고 셰프 서버 실행: http://localhost:${PORT}`);
});
