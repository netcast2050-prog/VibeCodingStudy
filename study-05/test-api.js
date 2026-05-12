require('dotenv').config();

const API_KEY = process.env.OPENROUTER_API_Key;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(model, messages) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function testText() {
  console.log('\n[텍스트 테스트] 모델: openai/gpt-oss-120b:free');
  const data = await callOpenRouter('openai/gpt-oss-120b:free', [
    { role: 'user', content: '안녕하세요! 한 문장으로 자기소개를 해주세요.' },
  ]);
  const reply = data.choices?.[0]?.message?.content ?? '(응답 없음)';
  console.log('응답:', reply);
  console.log('토큰 사용:', data.usage);
}

async function testImage() {
  console.log('\n[이미지 테스트] 모델: google/gemma-4-31b-it:free');
  // 공개 이미지 URL 사용 (OpenRouter 문서 샘플 이미지)
  const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png';

  const data = await callOpenRouter('google/gemma-4-31b-it:free', [
    {
      role: 'user',
      content: [
        { type: 'text', text: '이 이미지에 무엇이 있는지 한국어로 설명해 주세요.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ]);
  const reply = data.choices?.[0]?.message?.content ?? '(응답 없음)';
  console.log('응답:', reply);
  console.log('토큰 사용:', data.usage);
}

(async () => {
  if (!API_KEY) {
    console.error('오류: .env 파일에서 OPENROUTER_API_Key를 찾을 수 없습니다.');
    process.exit(1);
  }
  console.log('API 키 확인:', API_KEY.slice(0, 12) + '...');

  try {
    await testText();
  } catch (e) {
    console.error('[텍스트 테스트 실패]', e.message);
  }

  try {
    await testImage();
  } catch (e) {
    console.error('[이미지 테스트 실패]', e.message);
  }
})();
