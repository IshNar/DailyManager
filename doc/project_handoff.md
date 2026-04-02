# DailyManager 프로젝트 핸드오프 문서

작성일: 2026-04-02
대상: 지금까지 작업 내역을 모르는 AI/개발자가 바로 이어서 작업할 수 있도록 현재 상태를 정리한 문서

## 1. 프로젝트 한 줄 요약

DailyManager는 "시간 블록 기반 일정 관리 + 노트 작성"을 결합하려는 Electron 데스크톱 앱이다.  
현재는 Vite + React + Electron 기반의 UI 프로토타입이 상당 부분 구현되어 있으며, 타임라인/에디터/사이드바/캘린더/인박스 뷰까지 형태가 잡혀 있다. 다만 아직 커밋 정리가 안 되어 있고, 기능 완성도보다 UI/흐름 프로토타이핑이 먼저 진행된 상태다.

## 2. 제품 의도와 기획 배경

기존 기획 문서 기준 핵심 방향은 아래와 같다.

- 노트앱과 캘린더가 분리된 기존 사용 흐름을 하나로 합치기
- "노트 = 시간 블록" 개념을 중심으로 하루를 계획하고 기록하기
- 로컬 우선(Local-first) 구조
- 빠른 캡처, 오프라인, 경량성 지향

관련 참고 문서:

- `doc/implementation_plan.md`
- `doc/note_app_analysis.md`

기획 문서상 원래 방향은 "타임박싱 + 마크다운 노트 앱"인데, 실제 구현은 현재 **순수 Markdown 편집기라기보다 자유 배치형 Rich Text 캔버스 에디터**에 더 가까워졌다.  
이 차이는 이후 방향성 결정에서 가장 중요한 포인트다.

## 3. 현재 저장소 상태

### 브랜치 / 커밋

- 현재 브랜치: `main`
- 확인된 커밋 히스토리: 사실상 `Initial commit` 1개만 존재
- 즉, 최근 구현 내용 대부분은 아직 정식 커밋으로 정리되지 않았다

### 워킹 트리 상태

수정된 파일:

- `src/App.jsx`
- `src/components/Editor.css`
- `src/components/Editor.jsx`
- `src/components/Header.css`
- `src/components/Header.jsx`
- `src/components/TimeBlock.css`
- `src/components/TimeBlock.jsx`
- `src/components/Timeline.css`
- `src/index.css`
- `src/main.jsx`

새로 추가되었지만 아직 추적되지 않는 파일:

- `src/components/CalendarView.css`
- `src/components/CalendarView.jsx`
- `src/components/InboxView.css`
- `src/components/InboxView.jsx`
- `src/components/Sidebar.css`
- `src/components/Sidebar.jsx`
- `src/components/SlashMenu.css`
- `src/components/SlashMenu.jsx`

의미:

- 현재 UI 개편 작업은 대부분 워킹 트리에만 있고 아직 정리/커밋되지 않았다
- 다음 AI는 작업 시작 전 이 변경분을 "현재 기준선"으로 간주해야 한다
- 이 변경분을 모르고 초기 커밋 기준으로 판단하면 현재 상태를 잘못 이해하게 된다

## 4. 기술 스택

- 프론트엔드: React 19 + Vite
- 데스크톱 런타임: Electron
- 아이콘: `lucide-react`
- 날짜 처리: `date-fns`
- 드래그/리사이즈 캔버스 블록: `react-rnd`
- ID 생성: `uuid`
- 상태 관리: React state 중심
- 저장소:
  - Electron 실행 시 파일 시스템 저장
  - 브라우저 실행 시 `localStorage` fallback

## 5. 현재 프로젝트 구조

핵심 구조는 아래와 같다.

```text
doc/
  implementation_plan.md
  note_app_analysis.md
  project_handoff.md
electron/
  main.cjs
  preload.cjs
src/
  App.jsx
  main.jsx
  store.js
  index.css
  components/
    Timeline.jsx / .css
    TimeBlock.jsx / .css
    Editor.jsx / .css
    Header.jsx / .css
    Sidebar.jsx / .css
    CalendarView.jsx / .css
    InboxView.jsx / .css
    SlashMenu.jsx / .css
```

## 6. 기능별 현재 구현 상태

### 6.1 앱 셸 / 레이아웃

현재 `src/App.jsx`는 다음 상태를 관리한다.

- `currentDate`: 현재 보고 있는 날짜
- `activeView`: 현재 뷰 (`home`, `calendar`, `inbox`, `settings` 등)
- `blocks`: 해당 날짜의 타임블록 목록
- `selectedBlockId`: 현재 선택된 타임블록

레이아웃은 아래 구조다.

- 좌측: `Sidebar`
- 상단: `Header`
- 메인:
  - `home`일 때 `Timeline + Editor`
  - `calendar`일 때 `CalendarView`
  - `inbox`일 때 `InboxView`
  - 그 외 일부 메뉴는 placeholder

즉, 초기 단일 화면에서 이제 "앱 형태"가 있는 다중 뷰 구조로 확장되었다.

### 6.2 타임라인

`src/components/Timeline.jsx`

현재 구현된 기능:

- 24시간 세로 타임라인
- 현재 시각 라인 표시
- 날짜 변경 시 현재 시간 부근으로 자동 스크롤
- 빈 영역 드래그로 신규 블록 생성
- 생성 직후 카테고리 선택 팝업 표시
- 카테고리 프리셋 기반 블록 생성
- 상단 요약 바:
  - 총 블록 수
  - 총 시간
  - 카테고리 비율 바
  - 카테고리별 범례
- 블록 선택 / 삭제 / 수정 연결

구현 디테일:

- 생성 시 30분 단위로 스냅
- 이동/리사이즈 시 `TimeBlock` 내부 로직으로 5분 단위 스냅
- 블록 겹침 방지 로직은 없음
- 충돌 검사/정렬 로직 없음

### 6.3 개별 타임블록

`src/components/TimeBlock.jsx`

현재 구현된 기능:

- 블록 선택
- 상단 드래그 핸들로 이동
- 하단 리사이즈 핸들로 종료 시각 조절
- 제목 더블클릭 인라인 수정
- 삭제 버튼
- 카테고리 색상 인디케이터

주의 사항:

- `yToTime()`에서 24:00은 `23:59`로 강제 처리된다
- 따라서 하루 끝 표현이 엄밀하지 않다
- 블록 이동/리사이즈 시 매 mouse move마다 상위 저장이 발생한다

### 6.4 에디터

`src/components/Editor.jsx`

현재 구현 상태는 원래 기획의 Markdown 에디터와 많이 달라졌다.

현재 에디터의 실체:

- 자유 배치 캔버스 형태
- 여러 개의 텍스트 블록을 캔버스에 놓을 수 있음
- 각 블록은 `react-rnd`로 드래그/리사이즈 가능
- 텍스트는 `contentEditable` 기반 rich text
- 상단 리본 툴바로 bold/italic/underline/list/alignment/color 적용
- 슬래시(`/`) 입력 시 `SlashMenu` 호출
- 이미지 붙여넣기 / 파일 업로드 지원

현재 지원되는 슬래시 명령:

- 텍스트
- 제목 1 / 제목 2
- 글머리 기호
- 번호 목록
- 체크박스형 TODO
- 인용구
- 코드 블록
- 이미지

중요한 구현 특징:

- 내부 저장 포맷은 Markdown이 아니라 **JSON 배열**
- 각 캔버스 블록은 대략 아래 형태로 저장된다

```json
[
  {
    "id": "...",
    "type": "text",
    "content": "<h1>...</h1>",
    "x": 50,
    "y": 50,
    "width": 700,
    "height": "auto"
  }
]
```

즉 현재는 "Markdown note app"보다는 "HTML 기반 블록 캔버스 에디터" 상태다.

이 점은 반드시 다음 작업자가 인지해야 한다.

### 6.5 헤더

`src/components/Header.jsx`

현재 구현된 기능:

- 좌측 breadcrumb 스타일 제목
- 이전 날 / 다음 날 이동
- 날짜 표시
- 네이티브 date input 기반 날짜 선택
- 오늘 버튼
- 우측 액션 아이콘 영역

주의:

- 우측 아이콘(Favorites/Recent/Search/Settings)은 현재 UI만 있고 기능 연결 없음

### 6.6 사이드바

`src/components/Sidebar.jsx`

현재 구현된 기능:

- 홈
- 수신함
- 최근 항목
- 캘린더
- 즐겨찾기
- 워크스페이스 섹션
- 설정

실제 상태:

- `home`, `calendar`, `inbox`, `settings` 정도만 App에서 처리됨
- 나머지 메뉴는 placeholder 수준

### 6.7 캘린더 뷰

`src/components/CalendarView.jsx`

현재 구현 상태:

- 월 단위 날짜 그리드 표시
- 클릭 시 해당 날짜로 이동 후 홈 뷰 복귀

한계:

- 현재 달의 날짜만 단순 나열
- 앞/뒤 빈 칸 정렬이 없음
- `outside` 클래스 로직이 사실상 의미 없음
- 일정 요약/블록 수 표시도 없음

즉, 달력은 아직 매우 초기 단계다.

### 6.8 인박스 뷰

`src/components/InboxView.jsx`

현재 구현 상태:

- 간단한 빠른 입력
- 체크/삭제 가능한 리스트
- 초기 더미 데이터 포함

중요:

- 현재는 완전히 로컬 컴포넌트 state
- 앱 저장소나 파일 시스템과 연결되어 있지 않음
- 실제 "inbox" 기능이 아니라 데모 UI에 가깝다

## 7. 데이터 모델 및 저장 방식

### 7.1 일정 메타데이터

`src/store.js` + `electron/main.cjs`

일정은 날짜별 블록 배열로 관리된다.

블록 기본 구조:

- `id`
- `title`
- `startTime`
- `endTime`
- `color`
- `category`
- `markdown`

실제 Electron 저장 방식:

- `schedule_meta.json`에 날짜별 블록 메타 저장
- 위치: `app.getPath('userData')/TimeData/schedule_meta.json`

브라우저 fallback:

- `localStorage` 키: `daily_manager_state`

### 7.2 노트 파일

Electron 모드에서는 각 블록의 본문을 별도 `.md` 파일로 저장한다.

파일명 규칙:

- `{dateStr}_{blockId}.md`

저장 경로:

- `app.getPath('userData')/TimeData/notes/`

파일 포맷:

- 위쪽에 frontmatter 비슷한 메타데이터
- 본문에는 Markdown 대신 JSON 문자열 저장

즉 파일 확장자는 `.md`지만 실제 내용은 현재 Markdown 문서라기보다는 아래 구조다.

```md
---
id: ...
title: ...
category: ...
startTime: ...
endTime: ...
date: ...
---

[{"id":"...","type":"text","content":"<div>...</div>"}]
```

이 구조는 향후 아래 둘 중 하나를 결정해야 한다.

1. 정말 Markdown 앱으로 되돌릴지
2. 현재 캔버스 JSON 구조를 정식 포맷으로 밀고 갈지

### 7.3 첨부 이미지

이미지 저장 위치:

- `app.getPath('userData')/TimeData/attachments/`

현재 동작:

- 붙여넣기 또는 파일 선택으로 이미지 저장
- 저장 후 `file://...` URL을 에디터 HTML에 삽입

주의:

- 블록 삭제 시 관련 노트 파일/이미지 정리 로직 없음
- orphan file이 누적될 가능성이 높다

## 8. Electron 관련 구현 상태

`electron/main.cjs`

현재 구현:

- 사용자 데이터 디렉터리 생성
- 일정 메타 read/write IPC
- 노트 파일 read/write IPC
- 이미지 저장 IPC
- 개발 모드에서 `http://localhost:5173` 로드
- 프로덕션에서는 `dist/index.html` 로드
- 개발 모드에서 DevTools 자동 오픈
- 드래그된 외부 파일로 앱이 navigation 되는 문제 일부 방지

보안/설계 측면에서 눈에 띄는 부분:

- `nodeIntegration: true`
- `contextIsolation: true`
- `webSecurity: false`

프로토타입 단계에서는 빠르지만, 제품화 단계에서는 재검토가 필요하다.

## 9. 디자인/스타일 상태

현재 UI는 기존 기본 Vite 스타일에서 벗어나 다음 방향으로 많이 바뀌었다.

- 다크 톤 기반
- 사이드바 + 상단 헤더 + 분할 레이아웃
- 유리질감/패널형 느낌의 스타일
- 타임라인 요약바
- 블록형 인터랙션 강조
- 캔버스 기반 에디터

하지만 아직 남아 있는 정리 대상도 있다.

- `README.md`는 기본 Vite 템플릿
- `index.html` 제목이 아직 `temp-app`
- `src/App.css`는 사실상 Vite 기본 잔재
- 앱 전반 responsive/mobile 대응 없음

## 10. 실행/검증 상태

2026-04-02 기준 확인 결과:

### 성공

- `npm run build`
  - 성공
  - 프로덕션 번들 생성 가능

### 실패

- `npm run lint`
  - 실패

확인된 에러:

1. `src/App.jsx`
   - `getCurrentDateStr` 미사용 import

2. `src/components/Editor.jsx`
   - `parseAndSetContent`가 선언 전 참조된다는 lint 에러
   - 빈 `catch` 블록 관련 에러
   - 사용되지 않는 `e` 변수 에러

해석:

- 앱이 당장 빌드되지는 막히지 않음
- 그러나 코드 정리/리팩터링 없이 계속 쌓으면 lint 기준선이 무너짐
- 다음 AI가 작업 시작할 때 가장 먼저 정리해도 되는 수준의 오류들이다

### 미검증

- `npm run electron:dev` 실제 GUI 동작 전체
- 실제 사용자 데이터가 만들어지는 런타임 흐름
- 윈도우 패키징 최종 성공 여부

## 11. 과거 패키징 시도 흔적

루트에 아래 로그 파일이 있다.

- `build_output.txt`
- `builder_error.txt`
- `build_error_nsis.txt`

읽어본 결과 핵심 포인트:

- 과거 `electron:build` 또는 `electron-builder` 실행 흔적이 있음
- `winCodeSign` 압축 해제 과정에서 심볼릭 링크 생성 실패 문제가 있었던 것으로 보임
- Windows 환경 권한/개발자 모드/7zip 추출 관련 이슈로 추정됨

즉, 프론트 빌드는 되지만 Windows 패키징은 과거에 막힌 적이 있다.

## 12. 코드/설계상 중요한 관찰 사항

다음 작업자가 반드시 알아야 할 포인트들이다.

### 12.1 가장 큰 구조적 이슈: "Markdown 앱"과 현재 구현의 괴리

기획:

- Markdown note app

현재 구현:

- contentEditable + HTML + JSON canvas blocks

즉, 현재 상태는 마크다운 편집기가 아니라 자유 배치형 문서 캔버스다.  
이 차이를 방치하면 아래 문제가 생긴다.

- 데이터 포맷 일관성 없음
- 순수 `.md` 파일 호환성 약함
- 외부 편집기와의 상호운용성 저하
- 장기적으로 import/export 설계가 복잡해짐

이 부분은 다음 단계에서 반드시 제품 방향을 결정해야 한다.

### 12.2 저장이 너무 자주 발생함

타임블록 이동/리사이즈 시:

- mouse move마다 `onUpdateBlocks`
- 상위에서 매번 `saveSchedule`
- Electron에서는 매번 파일 write

즉, 일정 메타 저장은 debounce가 거의 없다.  
체감 성능/디스크 쓰기/향후 동기화 확장 관점에서 좋지 않다.

### 12.3 삭제 정리 로직 없음

현재 블록 삭제 시:

- 일정 메타에서는 삭제
- 노트 `.md` 파일은 남을 수 있음
- 첨부 이미지도 남을 수 있음

데이터 쓰레기 정리 정책이 필요하다.

### 12.4 Frontmatter 안전성 부족

현재 frontmatter 저장은 단순 문자열 연결이다.

문제 가능성:

- 제목에 `:` 포함 시 깨질 수 있음
- 줄바꿈/특수문자 이스케이프 없음
- 정식 YAML serializer 없음

### 12.5 캘린더/인박스는 아직 제품 기능 아님

- 캘린더는 레이아웃 초안
- 인박스는 더미 state UI
- 최근/즐겨찾기/검색/설정은 placeholder 수준

즉, 현재 제품의 실질적 핵심은 여전히 `Timeline + Editor`다.

## 13. 다음 AI가 먼저 읽어야 할 파일

우선순위 순서:

1. `src/App.jsx`
2. `src/store.js`
3. `electron/main.cjs`
4. `src/components/Timeline.jsx`
5. `src/components/TimeBlock.jsx`
6. `src/components/Editor.jsx`
7. `src/components/Header.jsx`
8. `src/components/Sidebar.jsx`
9. `src/components/CalendarView.jsx`
10. `src/components/InboxView.jsx`

문서 참고:

1. `doc/implementation_plan.md`
2. `doc/note_app_analysis.md`
3. 이 문서 `doc/project_handoff.md`

## 14. 지금 당장 손대기 좋은 우선순위

다음 AI가 바로 이어서 작업한다면 아래 순서를 추천한다.

### 우선순위 A: 기준선 안정화

- lint 에러 정리
- `README.md`, `index.html`, `App.css` 등 템플릿 잔재 정리
- 워킹 트리 변경분을 기준으로 기능 단위 커밋 정리

### 우선순위 B: 제품 방향 결정

둘 중 하나를 먼저 결정해야 한다.

1. Markdown 중심으로 되돌리기
2. 캔버스 에디터를 정식 방향으로 채택하기

이 결정을 안 하면 저장 포맷/렌더링/내보내기/검색 설계가 모두 흔들린다.

### 우선순위 C: 핵심 사용자 경험 보완

- 캘린더를 실제 월간 일정 뷰로 고도화
- 인박스를 실제 저장소와 연결
- 최근/검색/즐겨찾기 동작 구현
- 블록 overlap 처리 또는 시각적 충돌 처리
- 블록 삭제 시 note/attachment 정리
- 저장 debounce 적용

### 우선순위 D: 패키징 안정화

- `electron-builder` 재검증
- Windows symlink/권한 문제 재현 및 해결
- 앱 아이콘/메타데이터 정리

## 15. 빠른 작업 제안 3개

빠르게 가시적인 개선을 내려면 아래 3개가 효율적이다.

1. lint 통과시키기
   - 작은 비용으로 품질 기준선 복구 가능

2. 인박스 저장소 연결
   - 현재 UI는 있으나 기능이 가짜라서 체감 개선이 큼

3. Markdown vs Canvas 방향 확정
   - 앞으로의 모든 구현 비용을 줄여줌

## 16. 현재 코드베이스에서 주의할 점

- 최근 구현물 대부분이 아직 커밋되지 않았다
- 새 컴포넌트 8개는 untracked 상태다
- 현재 동작만 보고 "완성된 구조"라고 판단하면 안 된다
- 데이터는 repo 안이 아니라 Electron userData 경로에 저장된다
- 실제 사용자 데이터는 이 저장소만 읽어서는 파악되지 않는다
- 현재 저장 포맷은 `.md` 확장자이지만 실질적으로 JSON/HTML 기반이다

## 17. 한 문장 결론

이 프로젝트는 현재 "타임라인 기반 하루 계획 앱"의 골격은 꽤 잘 올라와 있지만,  
제품 방향(Markdown 앱 vs 캔버스 에디터), 저장 포맷, 패키징 안정화, placeholder 기능의 실제화가 아직 남아 있는 **프로토타입 후반부 상태**다.

