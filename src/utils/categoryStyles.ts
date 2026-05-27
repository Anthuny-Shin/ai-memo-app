import type { CSSProperties } from 'react'

export type CategoryKey = 'personal' | 'work' | 'study' | 'idea' | 'other'

const CATEGORY_KEYS: CategoryKey[] = ['personal', 'work', 'study', 'idea', 'other']

function toKey(category: string): CategoryKey {
  return CATEGORY_KEYS.includes(category as CategoryKey)
    ? (category as CategoryKey)
    : 'other'
}

/**
 * 카테고리 CSS 변수를 인라인 style로 반환.
 * globals.css 의 --cat-{key}-{bg|fg|bar} 변수를 사용하므로
 * 라이트/다크 모두 별도 분기 없이 자동 전환됩니다.
 */
export function categoryVars(category: string): CSSProperties {
  const key = toKey(category)
  return {
    '--cat-bg': `var(--cat-${key}-bg)`,
    '--cat-fg': `var(--cat-${key}-fg)`,
    '--cat-bar': `var(--cat-${key}-bar)`,
  } as CSSProperties
}

/** 카테고리 뱃지 Tailwind 클래스 (CSS 변수 활용) */
export const categoryBadgeClass =
  'bg-[var(--cat-bg)] text-[var(--cat-fg)] px-2.5 py-0.5 rounded-full text-xs font-medium'

/** 카테고리 컬러 띠 Tailwind 클래스 */
export const categoryBarClass =
  'bg-[var(--cat-bar)]'

/** 카테고리 칩 선택 활성 클래스 */
export const categoryChipActiveClass =
  'bg-[var(--cat-bg)] text-[var(--cat-fg)] border-[var(--cat-fg)]'
