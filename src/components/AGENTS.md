# Components - AI Agent 지침서

## 모듈 역할

재사용 가능한 React UI 컴포넌트 집합. 메모 앱의 모든 시각적 요소를 담당한다.

## 의존성 관계

- `@/types/memo` — Memo, MemoFormData 타입
- React hooks — useState, useEffect, useCallback

## 컴포넌트 목록

| 파일 | 역할 |
|------|------|
| `MemoForm.tsx` | 메모 생성/편집 모달 폼 (카테고리 칩 그룹, 마크다운 미리보기) |
| `MemoItem.tsx` | 개별 메모 카드 렌더링 (카테고리 컬러 띠, hover lift) |
| `MemoList.tsx` | 메모 목록 및 칩 필터/검색 UI |
| `MemoDetailModal.tsx` | 메모 상세 보기 모달 (마크다운 렌더링, AI 요약, 카테고리 컬러 띠) |
| `ThemeToggle.tsx` | 라이트/다크 테마 토글 버튼 (localStorage 기반) |

## Implementation Patterns

### 새 컴포넌트 작성 템플릿

```tsx
'use client'

import { useState } from 'react'

interface ComponentNameProps {
  // props 정의
}

export default function ComponentName({ ...props }: ComponentNameProps) {
  // 상태 및 로직

  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}
```

### Props 인터페이스 명명

- `{ComponentName}Props` 형식 사용
- 예: `MemoFormProps`, `MemoListProps`

### 이벤트 핸들러 명명

- `handle{Action}` 형식 (예: `handleSubmit`, `handleDelete`)
- 콜백 props는 `on{Action}` 형식 (예: `onClose`, `onSubmit`)

## Styling Guidelines

### Tailwind 클래스 우선순위

1. 레이아웃: `flex`, `grid`, `block`
2. 간격: `p-*`, `m-*`, `gap-*`
3. 크기: `w-*`, `h-*`, `max-w-*`
4. 색상: `bg-*`, `text-*`, `border-*`
5. 효과: `shadow-*`, `rounded-*`, `transition-*`

### 반응형 디자인

- 모바일 우선: 기본 스타일 -> `sm:` -> `md:` -> `lg:` -> `xl:`
- 공통 브레이크포인트: `sm:640px`, `md:768px`, `lg:1024px`

### 색상 팔레트 (디자인 토큰 기반 — 라이트/다크 자동 전환)

CSS 변수(`globals.css`)를 기준으로, Tailwind 유틸리티로 매핑하여 사용합니다.

| 토큰 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `bg-background` | `#FAF8F4` | `#1B1A18` | 페이지 배경 |
| `bg-surface` | `#FFFFFF` | `#252320` | 카드, 모달 배경 |
| `bg-surface-muted` | `#F3EFE7` | `#2E2B27` | 서브 영역 배경 |
| `text-foreground` | `#2C2A26` | `#EFECE6` | 주요 텍스트 |
| `text-foreground-muted` | `#6B6862` | `#A39E96` | 보조 텍스트 |
| `border-border` | `#E8E3DA` | `#3A3733` | 구분선, 테두리 |
| `bg-accent` | `#C97B5D` | `#E89977` | 주요 CTA, 강조 |

카테고리 컬러는 `src/utils/categoryStyles.ts`의 `categoryVars(category)` 인라인 스타일 + CSS 변수(`--cat-{key}-{bg|fg|bar}`)로 관리합니다.

## Local Golden Rules

### Do's

- 모든 컴포넌트는 `'use client'` 명시
- Props에 대한 TypeScript 인터페이스 정의 필수
- 접근성: 버튼에 aria-label, 폼에 label 태그 연결
- 아이콘은 SVG inline 또는 heroicons 스타일 사용

### Don'ts

- 컴포넌트 내부에서 직접 LocalStorage 접근 금지 (hooks 또는 utils 사용)
- 하드코딩된 문자열 지양 (상수 또는 types에서 import)
- 컴포넌트 파일 500줄 초과 금지 (분리 필요)

## 테스트 고려사항

- Playwright E2E 테스트에서 요소 선택 용이하도록 `data-testid` 속성 추가 권장
- 예: `<button data-testid="submit-memo-btn">`
