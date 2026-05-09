import type { Question } from '../types';

export const questions: Question[] = [
  // ───────── 한국사 (10) ─────────
  {
    id: 'kh-01',
    category: '한국사',
    difficulty: 'easy',
    question: '조선을 건국한 인물은 누구인가?',
    options: ['이성계', '왕건', '주몽', '김춘추'],
    answer: 0,
    explanation: '이성계는 1392년 조선을 건국하고 태조가 되었습니다.',
  },
  {
    id: 'kh-02',
    category: '한국사',
    difficulty: 'easy',
    question: '훈민정음을 창제한 조선의 왕은?',
    options: ['태종', '세종', '성종', '정조'],
    answer: 1,
    explanation:
      '세종대왕은 1443년 훈민정음을 창제하고 1446년에 반포하였습니다.',
  },
  {
    id: 'kh-03',
    category: '한국사',
    difficulty: 'easy',
    question: '임진왜란이 시작된 해는?',
    options: ['1392년', '1592년', '1636년', '1894년'],
    answer: 1,
    explanation:
      '임진왜란은 1592년 일본의 침략으로 시작되어 1598년 종전되었습니다.',
  },
  {
    id: 'kh-04',
    category: '한국사',
    difficulty: 'medium',
    question: '고려를 건국한 인물은?',
    options: ['궁예', '견훤', '왕건', '최영'],
    answer: 2,
    explanation:
      '왕건은 918년 고려를 건국하고 936년 후삼국을 통일하였습니다.',
  },
  {
    id: 'kh-05',
    category: '한국사',
    difficulty: 'medium',
    question: '삼국 중 가장 먼저 멸망한 나라는?',
    options: ['백제', '고구려', '신라', '가야'],
    answer: 0,
    explanation:
      '백제는 660년 나당연합군에 의해 가장 먼저 멸망하였습니다.',
  },
  {
    id: 'kh-06',
    category: '한국사',
    difficulty: 'medium',
    question: '이순신 장군이 전사한 해전은?',
    options: ['한산도대첩', '명량해전', '노량해전', '옥포해전'],
    answer: 2,
    explanation:
      '이순신 장군은 1598년 노량해전에서 일본군을 추격하던 중 전사하였습니다.',
  },
  {
    id: 'kh-07',
    category: '한국사',
    difficulty: 'medium',
    question: '동학농민운동이 일어난 해는?',
    options: ['1884년', '1894년', '1904년', '1919년'],
    answer: 1,
    explanation:
      '1894년 전봉준을 중심으로 동학농민운동이 일어났으며, 갑오개혁의 배경이 되었습니다.',
  },
  {
    id: 'kh-08',
    category: '한국사',
    difficulty: 'hard',
    question: '발해를 건국한 인물은?',
    options: ['대조영', '온조', '박혁거세', '김유신'],
    answer: 0,
    explanation:
      '대조영은 698년 동모산에서 발해를 건국하여 고구려 계승을 표방하였습니다.',
  },
  {
    id: 'kh-09',
    category: '한국사',
    difficulty: 'hard',
    question: '고려 말 원나라에서 목화씨를 들여온 인물은?',
    options: ['정몽주', '이색', '문익점', '최무선'],
    answer: 2,
    explanation:
      '문익점은 1363년 원나라 사신으로 갔다가 목화씨를 가져와 우리나라 의생활에 큰 변화를 일으켰습니다.',
  },
  {
    id: 'kh-10',
    category: '한국사',
    difficulty: 'hard',
    question: '대한민국 임시정부가 처음 수립된 도시는?',
    options: ['상하이', '충칭', '베이징', '도쿄'],
    answer: 0,
    explanation:
      '대한민국 임시정부는 1919년 4월 중국 상하이에서 수립되었습니다.',
  },

  // ───────── 과학 (10) ─────────
  {
    id: 'sc-01',
    category: '과학',
    difficulty: 'easy',
    question: '물의 화학식은?',
    options: ['CO2', 'H2O', 'O2', 'NaCl'],
    answer: 1,
    explanation:
      '물은 수소 원자 2개와 산소 원자 1개로 이루어져 있어 H2O로 표기합니다.',
  },
  {
    id: 'sc-02',
    category: '과학',
    difficulty: 'easy',
    question: '태양계에서 가장 큰 행성은?',
    options: ['지구', '토성', '목성', '천왕성'],
    answer: 2,
    explanation:
      '목성은 태양계에서 가장 큰 행성으로, 지름이 지구의 약 11배에 달합니다.',
  },
  {
    id: 'sc-03',
    category: '과학',
    difficulty: 'easy',
    question: '인체에서 가장 큰 장기는?',
    options: ['간', '심장', '폐', '피부'],
    answer: 3,
    explanation:
      '피부는 표면적과 무게 모두에서 인체의 가장 큰 장기로 분류됩니다.',
  },
  {
    id: 'sc-04',
    category: '과학',
    difficulty: 'medium',
    question: '광합성에 직접적으로 필요한 기체는?',
    options: ['산소', '이산화탄소', '질소', '수소'],
    answer: 1,
    explanation:
      '식물은 이산화탄소와 물을 이용해 광합성을 수행하고, 그 결과로 산소를 방출합니다.',
  },
  {
    id: 'sc-05',
    category: '과학',
    difficulty: 'medium',
    question: '빛이 진공에서 이동하는 속도는 약 얼마인가?',
    options: ['300 m/s', '3,000 km/s', '300,000 km/s', '3,000,000 km/s'],
    answer: 2,
    explanation:
      '빛은 진공에서 약 초당 30만 km(약 3 × 10^8 m/s)의 속도로 이동합니다.',
  },
  {
    id: 'sc-06',
    category: '과학',
    difficulty: 'medium',
    question: '뉴턴의 운동 법칙 중 “관성의 법칙”은 몇 번째 법칙인가?',
    options: ['제1법칙', '제2법칙', '제3법칙', '제4법칙'],
    answer: 0,
    explanation:
      '관성의 법칙은 외부 힘이 없으면 물체의 운동 상태가 유지된다는 뉴턴의 제1법칙입니다.',
  },
  {
    id: 'sc-07',
    category: '과학',
    difficulty: 'medium',
    question: 'DNA 이중나선 구조를 밝힌 과학자는?',
    options: [
      '멘델',
      '왓슨과 크릭',
      '다윈',
      '파스퇴르',
    ],
    answer: 1,
    explanation:
      '제임스 왓슨과 프랜시스 크릭은 1953년 DNA의 이중나선 구조를 발표해 노벨상을 받았습니다.',
  },
  {
    id: 'sc-08',
    category: '과학',
    difficulty: 'hard',
    question: '양자역학에서 “불확정성 원리”를 제안한 학자는?',
    options: ['아인슈타인', '하이젠베르크', '보어', '슈뢰딩거'],
    answer: 1,
    explanation:
      '베르너 하이젠베르크는 1927년 위치와 운동량을 동시에 정확히 알 수 없다는 불확정성 원리를 제시했습니다.',
  },
  {
    id: 'sc-09',
    category: '과학',
    difficulty: 'hard',
    question: '원자번호 79번 원소는?',
    options: ['은(Ag)', '구리(Cu)', '금(Au)', '백금(Pt)'],
    answer: 2,
    explanation:
      '원자번호 79번 원소는 금(Au)으로, 화학적으로 매우 안정한 귀금속입니다.',
  },
  {
    id: 'sc-10',
    category: '과학',
    difficulty: 'hard',
    question: '엔트로피와 관련된 열역학 법칙은?',
    options: ['제0법칙', '제1법칙', '제2법칙', '제3법칙'],
    answer: 2,
    explanation:
      '열역학 제2법칙은 고립계의 엔트로피가 시간이 지남에 따라 증가한다는 법칙입니다.',
  },

  // ───────── 지리 (10) ─────────
  {
    id: 'gg-01',
    category: '지리',
    difficulty: 'easy',
    question: '대한민국의 수도는?',
    options: ['부산', '인천', '대전', '서울'],
    answer: 3,
    explanation:
      '대한민국의 수도는 서울특별시이며, 정치·경제·문화의 중심지입니다.',
  },
  {
    id: 'gg-02',
    category: '지리',
    difficulty: 'easy',
    question: '세계에서 가장 긴 강은?',
    options: ['아마존강', '나일강', '양쯔강', '미시시피강'],
    answer: 1,
    explanation:
      '나일강은 약 6,650km로 세계에서 가장 긴 강으로 일반적으로 알려져 있습니다.',
  },
  {
    id: 'gg-03',
    category: '지리',
    difficulty: 'easy',
    question: '세계에서 가장 큰 사막은?',
    options: ['고비 사막', '칼라하리 사막', '사하라 사막', '아타카마 사막'],
    answer: 2,
    explanation:
      '사하라 사막은 약 900만 km²로 세계 최대의 더운(열대) 사막입니다.',
  },
  {
    id: 'gg-04',
    category: '지리',
    difficulty: 'medium',
    question: '세계에서 가장 높은 산은?',
    options: ['K2', '에베레스트', '킬리만자로', '몽블랑'],
    answer: 1,
    explanation:
      '에베레스트산은 해발 약 8,848m로 세계에서 가장 높은 산입니다.',
  },
  {
    id: 'gg-05',
    category: '지리',
    difficulty: 'medium',
    question: '면적이 가장 넓은 대륙은?',
    options: ['아프리카', '북아메리카', '아시아', '남아메리카'],
    answer: 2,
    explanation:
      '아시아는 약 4,450만 km²로 7대륙 중 면적이 가장 넓습니다.',
  },
  {
    id: 'gg-06',
    category: '지리',
    difficulty: 'medium',
    question: '대한민국에서 면적이 가장 큰 섬은?',
    options: ['거제도', '울릉도', '강화도', '제주도'],
    answer: 3,
    explanation:
      '제주도는 약 1,849km²로 대한민국에서 가장 큰 섬입니다.',
  },
  {
    id: 'gg-07',
    category: '지리',
    difficulty: 'medium',
    question: '적도가 통과하지 않는 나라는?',
    options: ['에콰도르', '인도네시아', '브라질', '이집트'],
    answer: 3,
    explanation:
      '이집트는 북위 22~32도에 위치해 적도가 통과하지 않습니다. 나머지 국가들은 적도가 지나갑니다.',
  },
  {
    id: 'gg-08',
    category: '지리',
    difficulty: 'hard',
    question: '호주의 수도는?',
    options: ['시드니', '멜버른', '캔버라', '브리즈번'],
    answer: 2,
    explanation:
      '호주의 수도는 캔버라이며, 시드니와 멜버른은 가장 큰 도시이지만 수도는 아닙니다.',
  },
  {
    id: 'gg-09',
    category: '지리',
    difficulty: 'hard',
    question: '세계에서 가장 깊은 호수는?',
    options: ['카스피해', '바이칼호', '슈피리어호', '탕가니카호'],
    answer: 1,
    explanation:
      '러시아의 바이칼호는 최대 수심 약 1,642m로 세계에서 가장 깊은 호수입니다.',
  },
  {
    id: 'gg-10',
    category: '지리',
    difficulty: 'hard',
    question: '안데스 산맥이 위치한 대륙은?',
    options: ['북아메리카', '아시아', '남아메리카', '아프리카'],
    answer: 2,
    explanation:
      '안데스 산맥은 남아메리카 서부를 따라 약 7,000km에 걸쳐 뻗어 있는 세계에서 가장 긴 산맥입니다.',
  },

  // ───────── 예술과 문화 (10) ─────────
  {
    id: 'ac-01',
    category: '예술과 문화',
    difficulty: 'easy',
    question: '“모나리자”를 그린 화가는?',
    options: ['미켈란젤로', '레오나르도 다빈치', '라파엘로', '카라바조'],
    answer: 1,
    explanation:
      '레오나르도 다빈치가 16세기 초에 그린 “모나리자”는 루브르 박물관에 소장되어 있습니다.',
  },
  {
    id: 'ac-02',
    category: '예술과 문화',
    difficulty: 'easy',
    question: '“햄릿”, “로미오와 줄리엣”의 작가는?',
    options: ['찰스 디킨스', '마크 트웨인', '윌리엄 셰익스피어', '제인 오스틴'],
    answer: 2,
    explanation:
      '윌리엄 셰익스피어는 영국 르네상스 시대를 대표하는 극작가이자 시인입니다.',
  },
  {
    id: 'ac-03',
    category: '예술과 문화',
    difficulty: 'easy',
    question: '“별이 빛나는 밤”을 그린 화가는?',
    options: ['클로드 모네', '빈센트 반 고흐', '폴 세잔', '에두아르 마네'],
    answer: 1,
    explanation:
      '빈센트 반 고흐는 1889년 “별이 빛나는 밤”을 그렸으며, 후기 인상주의의 대표작으로 평가됩니다.',
  },
  {
    id: 'ac-04',
    category: '예술과 문화',
    difficulty: 'medium',
    question: '베토벤 교향곡 9번의 별칭은?',
    options: ['영웅', '운명', '합창', '전원'],
    answer: 2,
    explanation:
      '베토벤 교향곡 9번은 마지막 악장에 합창이 들어가 “합창” 교향곡으로 불립니다.',
  },
  {
    id: 'ac-05',
    category: '예술과 문화',
    difficulty: 'medium',
    question: '한국의 전통 음악에서 사용되는 5음 음계의 음 개수는?',
    options: ['3개', '5개', '7개', '12개'],
    answer: 1,
    explanation:
      '한국 전통 음악의 5음 음계는 궁·상·각·치·우의 5개 음으로 이루어져 있습니다.',
  },
  {
    id: 'ac-06',
    category: '예술과 문화',
    difficulty: 'medium',
    question: '인상주의 화가에 해당하지 않는 사람은?',
    options: ['클로드 모네', '에드가 드가', '파블로 피카소', '오귀스트 르누아르'],
    answer: 2,
    explanation:
      '파블로 피카소는 입체주의(큐비즘)의 대표 화가로, 인상주의에는 속하지 않습니다.',
  },
  {
    id: 'ac-07',
    category: '예술과 문화',
    difficulty: 'medium',
    question: '오페라 “라 트라비아타”를 작곡한 작곡가는?',
    options: ['모차르트', '베르디', '바그너', '푸치니'],
    answer: 1,
    explanation:
      '주세페 베르디는 1853년 “라 트라비아타”를 작곡했으며, 이는 그의 대표 오페라 중 하나입니다.',
  },
  {
    id: 'ac-08',
    category: '예술과 문화',
    difficulty: 'hard',
    question: '소설 “죄와 벌”을 쓴 작가는?',
    options: ['톨스토이', '체호프', '도스토옙스키', '푸시킨'],
    answer: 2,
    explanation:
      '“죄와 벌”은 1866년 표도르 도스토옙스키가 발표한 장편 소설입니다.',
  },
  {
    id: 'ac-09',
    category: '예술과 문화',
    difficulty: 'hard',
    question: '판소리 다섯 마당에 포함되지 않는 것은?',
    options: ['춘향가', '심청가', '흥보가', '배비장전'],
    answer: 3,
    explanation:
      '판소리 다섯 마당은 춘향가, 심청가, 흥보가, 수궁가, 적벽가입니다. 배비장전은 판소리계 소설로, 다섯 마당에 포함되지 않습니다.',
  },
  {
    id: 'ac-10',
    category: '예술과 문화',
    difficulty: 'hard',
    question: '유네스코 세계기록유산에 등재된 한국의 기록물은?',
    options: [
      '동의보감',
      '삼국사기',
      '대장경판 색인',
      '경국대전',
    ],
    answer: 0,
    explanation:
      '허준의 “동의보감”은 2009년 유네스코 세계기록유산에 등재되었습니다.',
  },
];
