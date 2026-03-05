# Timeboxing Markdown Note App — 구현 계획

하루를 시간 블록 단위로 설계하고, 각 블록에 마크다운 노트를 연결하는 **타임박싱 GUI 앱**을 Vite + React로 구현합니다.

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 빌드 도구 | **Vite** | 빠른 HMR, 간편한 설정 |
| UI 프레임워크 | **React 19** | 컴포넌트 기반 구조, 풍부한 생태계 |
| 마크다운 에디터 | **@uiw/react-md-editor** | WYSIWYG + 소스 모드, 가벼움, 쉬운 통합 |
| 상태 관리 | **React useState + Context** | 단순 구조에 적합 |
| 데이터 저장 | **localStorage (JSON)** | 별도 서버 불필요, 즉시 사용 가능 |
| 유틸리티 | **uuid**, **date-fns** | 고유 ID 생성, 날짜 처리 |

## Proposed Changes

### 프로젝트 초기화

#### [NEW] Vite + React 프로젝트
- `npx create-vite@latest ./ --template react` 으로 `f:\PythonProjects\DailyManager`에 생성
- `@uiw/react-md-editor`, `uuid`, `date-fns` 패키지 설치

---

### 데이터 모델 & 저장소

#### [NEW] [store.js](file:///f:/PythonProjects/DailyManager/src/store.js)
- `TimeBlock`: `{ id, title, startTime, endTime, color, markdown }`
- `DaySchedule`: 날짜별 TimeBlock 배열
- localStorage 읽기/쓰기 함수
- 자동 저장 (debounce 500ms)

---

### 좌측 패널 — 타임라인

#### [NEW] [Timeline.jsx](file:///f:/PythonProjects/DailyManager/src/components/Timeline.jsx)
- 00:00~24:00 30분 그리드 렌더링 (48칸)
- 빈 슬롯 클릭 → 새 타임블록 생성 (기본 30분)
- 블록 상하 드래그로 시간 이동
- 블록 하단 드래그로 길이 조절
- 현재 시각 빨간 라인 표시 (1분 간격 업데이트)
- 블록 색상 커스터마이징

#### [NEW] [TimeBlock.jsx](file:///f:/PythonProjects/DailyManager/src/components/TimeBlock.jsx)
- 개별 타임블록 컴포넌트
- 선택 상태, 드래그 핸들, 리사이즈 핸들
- 제목 인라인 편집

---

### 우측 패널 — 마크다운 에디터

#### [NEW] [Editor.jsx](file:///f:/PythonProjects/DailyManager/src/components/Editor.jsx)
- `@uiw/react-md-editor` 통합
- 선택된 타임블록의 마크다운 내용 편집
- 미리보기(Preview) / 편집(Edit) / 분할(Split) 모드 토글
- 자동 저장 (500ms debounce)

---

### 상단 네비게이션

#### [NEW] [Header.jsx](file:///f:/PythonProjects/DailyManager/src/components/Header.jsx)
- 앱 로고 + 제목
- 날짜 이동: ◀ 어제 | **2026-02-24 (화)** | 내일 ▶
- 캘린더 팝업 (날짜 선택 → 해당 날짜의 타임라인 로드)
- "오늘로 가기" 버튼

---

### 메인 레이아웃 & 스타일

#### [NEW] [App.jsx](file:///f:/PythonProjects/DailyManager/src/App.jsx)
- 3단 레이아웃: Header + (Timeline | Editor)
- 반응형 flex 레이아웃

#### [NEW] [index.css](file:///f:/PythonProjects/DailyManager/src/index.css)
- 다크 모드 기본 테마
- CSS 변수 기반 디자인 토큰
- 글래스모피즘 효과, 부드러운 그라데이션
- 트랜지션/애니메이션

---

## Verification Plan

### 브라우저 테스트 (자동)
1. `npm run dev`로 개발 서버 실행 후 브라우저에서 아래 항동 검증:
   - 타임라인에 48개 슬롯이 표시되는지
   - 빈 슬롯 클릭하면 새 블록이 생성되는지
   - 블록 클릭 시 우측에 마크다운 에디터가 활성화되는지
   - 마크다운 입력 후 페이지 새로고침해도 데이터가 유지되는지
   - 날짜 이동 시 해당 날짜의 데이터가 표시되는지

### 수동 확인 (사용자)
- 앱을 직접 사용해보시고, 타임블록 생성/이동/삭제, 마크다운 편집, 날짜 이동 등이 자연스러운지 확인해주세요.
