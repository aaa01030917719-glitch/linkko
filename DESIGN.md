# Linkko Design System

## 1. Overview

Linkko의 디자인 언어는 아래 두 방향을 균형 있게 참고합니다.

1. Zigzag에서 참고할 강점
- 모바일 퍼스트
- 빠른 스캔
- 카드/칩 기반 탐색
- 가벼운 소비자 앱 감성
- 하얀 배경 중심의 깨끗한 화면

2. Notion에서 참고할 강점
- 구조적인 위계
- 편집적인 명료함
- 단정한 섹션 구성
- 절제된 컬러 사용
- 시스템적인 완성도

중요:
- Notion이나 Zigzag를 그대로 복사하지 않습니다.
- Linkko는 “빠르게 저장하고 다시 여는 개인 링크 컬렉션 앱”이어야 합니다.
- 브랜드의 핵심 신호 색상은 반드시 `보라색`을 유지합니다.

### Product Tone

Linkko는 아래 인상을 목표로 합니다.

- organized
- fast
- personal
- modern
- lightweight
- editorial
- friendly
- useful
- clear
- confident

### Direction Summary

- Primary brand color is the existing Linkko purple `#6C5CE7`
- Do not arbitrarily change the primary color in future UI updates
- Notion reference colors are for structure and supporting tints, not for replacing the primary color

- Primary color는 purple 유지
- White base UI 유지
- 기본 버튼은 8px radius의 직사각형
- 기본 카드는 12px radius
- 모바일 스캔 속도와 빠른 액션 우선
- 필요 시 부드러운 pastel supporting tint 사용
- 지나치게 관리툴처럼 무거워지지 않기

---

## 2. Design Principles

### 2.1 Mobile-first

모든 핵심 플로우는 모바일 기준으로 자연스럽게 동작해야 합니다.

중요 패턴:
- sticky header
- thumb reach가 쉬운 주요 액션
- bottom sheet 기반 선택 흐름
- 카드/리스트 기반 탐색
- 빠른 저장 / 수정 / 즐겨찾기

### 2.2 Fast scanning

사용자는 화면에 들어오자마자 아래를 바로 이해할 수 있어야 합니다.

- 지금 어떤 화면인지
- 어떤 폴더/필터가 선택됐는지
- 어떤 링크가 중요한지
- 어떤 항목이 즐겨찾기인지
- 다음으로 무엇을 하면 되는지

### 2.3 Editorial clarity

레이아웃은 조용하고 구조적이어야 하며, 시끄럽거나 과밀하면 안 됩니다.

사용:
- 명확한 헤드라인
- 깨끗한 섹션 그룹핑
- 제한된 포인트 컬러
- 충분한 여백
- 분명한 시각적 위계

### 2.4 Controlled colorfulness

보조 배경색과 pastel tint는 사용 가능하지만, 주 신호색은 항상 purple입니다.

### 2.5 Soft structure over heavy decoration

선호:
- border
- spacing
- background separation
- light elevation

지양:
- 과한 그림자
- 복잡한 표면 장식
- 너무 많은 강한 색상

---

## 3. Brand Keywords

### Use

- clean
- quick
- organized
- curated
- approachable
- polished
- modern
- mobile
- editorial
- useful

### Avoid

- noisy
- childish
- cluttered
- overly corporate
- dense dashboard
- heavy enterprise admin UI

---

## 4. Color System

### 4.1 Core Brand Colors

```css
:root {
  --color-bg: #ffffff;
  --color-bg-soft: #f7f7fa;
  --color-bg-muted: #f2f3f7;

  --color-surface: #ffffff;
  --color-surface-soft: #f8f8fb;
  --color-surface-section: #f5f6fa;

  --color-text-primary: #111111;
  --color-text-secondary: #4f5562;
  --color-text-muted: #7f8694;
  --color-text-disabled: #b5bac4;

  --color-border: #e7e9ef;
  --color-border-soft: #eef0f4;
  --color-border-strong: #d7dbe3;

  --color-primary: #6C5CE7;
  --color-primary-hover: #5A4BD1;
  --color-primary-pressed: #4A3CBA;
  --color-primary-soft: #F0EEFF;
  --color-primary-soft-hover: #E3DEFE;

  --color-hero-dark: #161b33;
  --color-hero-dark-deep: #101527;
  --color-on-dark: #ffffff;
  --color-on-dark-muted: rgba(255, 255, 255, 0.72);

  --color-link: #2563eb;
  --color-link-hover: #1d4ed8;

  --color-success: #16a34a;
  --color-success-soft: #ecfdf3;

  --color-warning: #f59e0b;
  --color-warning-soft: #fffbeb;

  --color-danger: #ef4444;
  --color-danger-soft: #fef2f2;

  --color-overlay: rgba(17, 17, 17, 0.48);
}
```

### 4.2 Supporting Accent Palette

```css
:root {
  --color-tint-peach: #fff1ea;
  --color-tint-rose: #ffeaf2;
  --color-tint-mint: #eaf9f1;
  --color-tint-lavender: #f1ebff;
  --color-tint-sky: #eaf4ff;
  --color-tint-yellow: #fff8d9;
  --color-tint-yellow-bold: #ffe46b;
  --color-tint-cream: #fff8ef;
  --color-tint-gray: #f4f5f7;
}
```

### 4.3 Usage Rules

Primary brand rules:
- Linkko primary color must stay on the existing project purple `#6C5CE7`
- Do not arbitrarily change the primary color in future UI updates
- Notion reference colors are for structure and supporting tints, not for replacing the primary color

Purple 사용처:
- primary CTA
- selected state
- focus ring
- active folder/filter
- favorite highlight

Supporting tint 사용처:
- section card
- onboarding panel
- empty state
- category highlight
- soft badge

하지 말 것:
- 넓은 읽기 면 전체를 purple로 채우기
- 포인트 색상을 동시에 여러 개 과하게 사용하기
- 모든 칩/버튼/아이콘을 purple 처리하기

---

## 5. Typography

### 5.1 Font Family

```css
font-family:
  "Pretendard",
  "Inter",
  -apple-system,
  BlinkMacSystemFont,
  "Apple SD Gothic Neo",
  "Noto Sans KR",
  "Segoe UI",
  sans-serif;
```

### 5.2 Type Scale

```css
--font-size-hero: 48px;
--font-size-display: 36px;
--font-size-title-1: 28px;
--font-size-title-2: 24px;
--font-size-title-3: 20px;
--font-size-title-4: 18px;
--font-size-body-1: 16px;
--font-size-body-2: 15px;
--font-size-body-3: 14px;
--font-size-caption: 12px;
--font-size-micro: 11px;
```

### 5.3 Weight

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-heavy: 800;
```

### 5.4 Rules

- Page title: 24px to 28px / 700
- Section title: 20px to 24px / 700
- Card title: 16px to 18px / 600~700
- Body: 14px to 16px / readable line-height
- Metadata: 12px to 13px / muted
- Button label: 14px / 500~600

---

## 6. Spacing System

4px base system 사용

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

기본 가이드:
- mobile page padding: 16px
- card padding: 16px
- roomy panel padding: 20px~24px
- section rhythm: 24px 이상

---

## 7. Radius System

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 999px;
```

규칙:
- 버튼: 8px
- 입력창: 8px
- 카드: 12px
- 큰 패널/모달: 16px~20px
- 칩: full 또는 8px, 상황에 따라 선택

기본 액션 버튼은 oversized pill 버튼을 기본값으로 삼지 않습니다.

---

## 8. Elevation

```css
--shadow-0: none;
--shadow-1: 0 1px 2px rgba(17, 17, 17, 0.04);
--shadow-2: 0 4px 12px rgba(17, 17, 17, 0.08);
--shadow-3: 0 16px 32px rgba(17, 17, 17, 0.14);
```

사용 원칙:
- 카드: border 우선, shadow는 최소
- dropdown / popover / modal / bottom sheet: shadow-3

---

## 9. Layout

### 9.1 App Layout

- sticky header
- main content area
- optional bottom nav
- safe-area aware spacing
- floating add action or sticky save action

### 9.2 Containers

Mobile
```css
max-width: 480px;
margin: 0 auto;
```

Desktop
```css
max-width: 1120px;
margin: 0 auto;
padding: 32px;
```

---

## 10. Navigation

### 10.1 Recommended App Nav

- 홈
- 링크
- 폴더
- 즐겨찾기
- 마이

최대 5개를 넘기지 않습니다.

### 10.2 Header

지원 요소:
- page title
- search
- add action
- folder selector
- profile/settings entry

스타일:
- white background
- sticky
- subtle bottom border
- compact

### 10.3 Folder Selector

- rounded rectangular trigger
- current folder name
- mobile에서는 bottom sheet 사용
- desktop에서는 popover / dropdown 사용

주의:
- 중복된 folder/filter 컨트롤을 한 화면에 과하게 노출하지 않기

---

## 11. Core Components

### 11.1 Buttons

Primary
```css
.button-primary {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 8px;
  background: var(--color-primary);
  color: #ffffff;
  font-weight: 600;
}
```

Secondary
```css
.button-secondary {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 8px;
  background: #ffffff;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-strong);
  font-weight: 500;
}
```

Ghost
```css
.button-ghost {
  min-height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 500;
}
```

### 11.2 Chips

```css
.chip {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: #ffffff;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.chip-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
```

규칙:
- 모바일에서는 horizontal scroll 허용
- 짧고 빠르게 읽히는 라벨 사용
- selected state는 즉시 인지 가능해야 함

### 11.3 Link Card / Link Row

링코는 화면에 따라 카드형과 리스트형을 함께 쓸 수 있지만, 빠른 스캔이 우선인 화면에서는 텍스트 리스트를 기본으로 둡니다.

기본 구조:
- favicon 또는 작은 썸네일
- title
- memo
- domain / date
- folder chip
- favorite
- overflow action

기본 카드형 토큰:
```css
.link-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #ffffff;
}
```

### 11.4 Folder Card

```css
.folder-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #ffffff;
}
```

### 11.5 Search Input

```css
.search-input {
  height: 44px;
  border-radius: 8px;
  padding: 0 14px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
}
```

Focus:
```css
border: 2px solid var(--color-primary);
```

### 11.6 Bottom Sheet

사용처:
- folder choose
- filters
- sorting
- move link
- quick actions

```css
.bottom-sheet {
  border-radius: 20px 20px 0 0;
  background: #ffffff;
  box-shadow: var(--shadow-3);
}
```

### 11.7 Modal

```css
.modal {
  width: min(100% - 32px, 480px);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--shadow-3);
}
```

### 11.8 Empty / Loading / Error

원칙:
- 무슨 문제가 생겼는지
- 계속 진행 가능한지
- 다음 행동이 무엇인지

특히 중요:
- 미리보기 실패가 링크 저장 자체를 막으면 안 됩니다.

좋은 예시:
```text
미리보기를 불러오지 못했어요.
그래도 링크는 저장할 수 있어요.
```

---

## 12. Page Patterns

### 12.1 Home

추천 순서:
1. header
2. search or quick entry
3. quick folder chips
4. summary / onboarding card
5. favorite links
6. recent links

### 12.2 Links

필수:
- folder selector
- search or clear navigation path to search
- filter chips or single filter entry
- link list
- add action

규칙:
- newest first 기본
- 즐겨찾기는 명확히 구분
- duplicated filter UI 지양

### 12.3 Folders

- list 또는 grid
- create folder action
- empty state

### 12.4 Add Link

흐름:
1. URL 입력
2. preview load
3. optional edit
4. folder select
5. save

중요:
- preview failure must not block saving

---

## 13. Interaction Rules

- pressed state는 미세하게
- hover는 데스크톱에서만 subtle
- skeleton loading 사용
- destructive action만 confirm 사용

예시:
```css
.action:active {
  transform: scale(0.98);
}
```

---

## 14. Accessibility

필수 조건:
- visible focus ring
- 44px minimum touch target
- icon-only button에는 label 제공
- color만으로 상태를 구분하지 않기
- modal / bottom sheet focus 처리
- keyboard navigation 고려
- 충분한 contrast

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 15. Responsive Rules

모바일
```css
@media (max-width: 767px) {
  .page {
    padding: 16px;
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
}
```

태블릿 이상에서는 grid 확장 가능하지만, 모바일 구조를 먼저 깨지지 않게 유지합니다.

---

## 16. Motion

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 240ms;
--motion-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
```

사용:
- modal open/close
- bottom sheet
- toast
- subtle card transition
- favorite toggle

---

## 17. Content Tone

한국어 카피는 아래처럼 유지합니다.

- friendly
- short
- practical
- clear
- calm

예시:
- 링크를 저장했어요.
- 폴더를 선택해 주세요.
- 미리보기를 불러오는 중이에요.

---

## 18. Do / Don't

### Do

- Keep the existing Linkko primary color `#6C5CE7`

- primary brand color는 purple 유지
- 빠른 모바일 스캔과 구조적 편집감을 함께 가져가기
- 8px 버튼
- 12px 카드
- white base + pastel supporting tint
- focus / modal / bottom sheet 접근성 챙기기
- 미리보기 실패가 저장을 막지 않게 하기

### Don't

- 외부 브랜드를 그대로 복사하지 않기
- purple을 대면적으로 과사용하지 않기
- 모든 버튼을 oversized pill로 만들지 않기
- folder/filter UI를 중복 노출하지 않기
- raw technical error text를 그대로 노출하지 않기

---

## 19. Implementation Checklist

- [ ] Primary brand color is the existing Linkko purple `#6C5CE7`
- [ ] Buttons use 8px radius
- [ ] Cards use 12px radius
- [ ] Mobile layout works at 360px width
- [ ] Header remains compact
- [ ] Folder/filter UI is not duplicated
- [ ] Empty/loading/error states exist
- [ ] Focus states are visible
- [ ] Bottom sheet and modal are accessible
- [ ] Preview failure does not block saving

---

## 20. Codex Instruction Summary

앞으로 Linkko의 UI 수정은 이 문서를 source of truth로 삼습니다.

우선 적용 기준:
1. mobile-first layout
2. 빠른 스캔이 가능한 card/chip UI
3. 8px radius의 직사각형 버튼
4. 12px radius의 카드
5. white base + purple primary + pastel supporting tint
6. duplicated filter/folder UI 지양
7. accessible focus / bottom sheet / modal
8. preview failure가 저장을 막지 않도록 유지
