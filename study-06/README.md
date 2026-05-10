# 🛒 쇼핑 리스트 (Shopping List App)

브라우저에서 동작하는 간단한 쇼핑 리스트 웹앱입니다. 외부 라이브러리나 빌드 도구 없이 순수 HTML / CSS / JavaScript로 만들어졌으며, 입력한 항목은 브라우저의 `localStorage`에 저장되어 새로고침해도 유지됩니다.

## ✨ 주요 기능

- ➕ 살 것을 입력하고 리스트에 추가
- ✅ 체크박스로 구매 완료 표시 (취소선 표시)
- ✕ 개별 항목 삭제
- 🧹 체크된 항목 일괄 삭제
- 💾 `localStorage` 기반 자동 저장 (새로고침해도 유지)
- 📊 전체 / 완료 개수 요약 표시
- 📱 모바일 / 데스크톱 모두 대응하는 반응형 UI

## 🚀 실행 방법

별도의 서버나 설치가 필요 없습니다.

1. 이 저장소를 클론하거나 ZIP으로 다운로드합니다.
   ```bash
   git clone https://github.com/netcast2050-prog/shopping-listapp.git
   cd shopping-listapp
   ```
2. `index.html` 파일을 브라우저로 열기만 하면 됩니다.

> 💡 VS Code의 **Live Server** 확장을 사용하면 더 편하게 개발할 수 있습니다.

## 📁 파일 구조

```
shopping-listapp/
├── index.html   # 마크업 (입력 폼, 리스트, 푸터)
├── style.css    # 스타일 (그라디언트 배경, 카드 레이아웃)
└── app.js       # 동작 로직 (추가/삭제/토글, localStorage 저장)
```

## 🔧 사용 기술

- HTML5
- CSS3 (Flexbox, 그라디언트, 트랜지션)
- Vanilla JavaScript (ES6+, DOM API, localStorage)

## 💾 데이터 저장 방식

모든 항목은 브라우저의 `localStorage`에 `shopping-list-items` 키로 JSON 문자열 형태로 저장됩니다. 서버나 데이터베이스 없이 동작하므로, 같은 브라우저에서만 데이터가 유지됩니다.

```js
// 저장 예시
[
  { "id": "abc123", "text": "우유", "checked": false },
  { "id": "def456", "text": "달걀", "checked": true }
]
```

## 📜 라이선스

자유롭게 사용·수정·배포할 수 있습니다.
