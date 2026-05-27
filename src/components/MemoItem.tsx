'use client'

import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import { categoryVars, categoryBadgeClass, categoryBarClass } from '@/utils/categoryStyles'
import { highlightText } from '@/utils/highlight'

const stripMarkdown = (text: string): string =>
  text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/^\|.+\|$/gm, '')
    .replace(/^[-|:]+$/gm, '')
    .replace(/^[-*+]\s+\[[ x]\]\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

interface MemoItemProps {
  memo: Memo
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onView: (memo: Memo) => void
  onTagClick?: (tag: string) => void
  searchQuery?: string
  compact?: boolean
}

export default function MemoItem({
  memo,
  onEdit,
  onDelete,
  onView,
  onTagClick,
  searchQuery = '',
  compact = false,
}: MemoItemProps) {
  const categoryLabel =
    MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] || memo.category

  if (compact) {
    return (
      <article
        style={categoryVars(memo.category)}
        className="memo-card group relative flex items-center bg-surface rounded-2xl border border-border overflow-hidden transition-all duration-150 hover:shadow-sm"
      >
        {/* 카테고리 컬러 띠 */}
        <div className={`self-stretch w-1 shrink-0 ${categoryBarClass}`} />

        {/* 클릭 가능 영역 */}
        <button
          className="flex-1 flex items-center gap-3 text-left px-4 py-3 min-w-0 cursor-pointer"
          onClick={() => onView(memo)}
          aria-label={`${memo.title} 메모 상세 보기`}
        >
          <span className="flex-1 text-sm font-medium text-foreground truncate">
            {highlightText(memo.title, searchQuery)}
          </span>
          <span style={categoryVars(memo.category)} className={`${categoryBadgeClass} shrink-0 hidden sm:inline-flex`}>
            {categoryLabel}
          </span>
          <span className="text-[11px] text-foreground-muted shrink-0">{formatDate(memo.updatedAt)}</span>
        </button>

        {/* 액션 버튼 */}
        <div className="memo-actions flex items-center gap-1 pr-2 opacity-100 sm:opacity-0 transition-opacity duration-150 shrink-0">
          <button
            onClick={() => onEdit(memo)}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-accent hover:bg-surface-muted transition-colors"
            aria-label="메모 편집"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(memo.id)}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="메모 삭제"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </article>
    )
  }

  const preview = stripMarkdown(memo.content) || '내용 없음'

  return (
    <article
      style={categoryVars(memo.category)}
      className="memo-card group relative bg-surface rounded-3xl border border-border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
    >
      {/* 좌측 카테고리 컬러 띠 */}
      <div className={`absolute left-3 top-5 bottom-5 w-1 rounded-full ${categoryBarClass}`} />

      {/* 주 클릭 영역 (메모 열기) - actions와 tags는 형제 요소로 분리 */}
      <button
        className="block w-full text-left p-6 pl-8 pr-14 cursor-pointer"
        onClick={() => onView(memo)}
        aria-label={`${memo.title} 메모 상세 보기`}
      >
        {/* 제목 */}
        <h3 className="text-[15px] sm:text-base font-semibold text-foreground line-clamp-2 leading-snug mb-2">
          {highlightText(memo.title, searchQuery)}
        </h3>

        {/* 카테고리 뱃지 + 날짜 */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span style={categoryVars(memo.category)} className={categoryBadgeClass}>
            {categoryLabel}
          </span>
          <span className="text-[11px] text-foreground-muted">{formatDate(memo.updatedAt)}</span>
        </div>

        {/* 본문 미리보기 */}
        <p className="text-sm text-foreground-muted leading-relaxed line-clamp-3">
          {highlightText(preview, searchQuery)}
        </p>
      </button>

      {/* 태그 (버튼으로 클릭 가능, button 형제 요소) */}
      {memo.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap px-6 pl-8 pb-4 -mt-1">
          {memo.tags.map((tag, idx) =>
            onTagClick ? (
              <button
                key={idx}
                onClick={() => onTagClick(tag)}
                className="px-2 py-0.5 bg-surface-muted hover:bg-border text-foreground-muted hover:text-foreground text-[11px] rounded-md transition-colors"
              >
                #{tag}
              </button>
            ) : (
              <span
                key={idx}
                className="px-2 py-0.5 bg-surface-muted text-foreground-muted text-[11px] rounded-md"
              >
                #{tag}
              </span>
            ),
          )}
        </div>
      )}

      {/* 액션 버튼 (절대 위치, 주 버튼과 형제) */}
      <div className="memo-actions absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 transition-opacity duration-150">
        <button
          onClick={() => onEdit(memo)}
          className="p-1.5 rounded-lg text-foreground-muted hover:text-accent hover:bg-surface-muted transition-colors"
          aria-label="메모 편집"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(memo.id)}
          className="p-1.5 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          aria-label="메모 삭제"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </article>
  )
}
