'use client'

import { forwardRef, useState } from 'react'
import { Memo, MEMO_CATEGORIES, DEFAULT_CATEGORIES } from '@/types/memo'
import { categoryVars } from '@/utils/categoryStyles'
import MemoItem from './MemoItem'

type SortBy = 'updated' | 'created' | 'title'

interface MemoListProps {
  memos: Memo[]
  loading: boolean
  searchQuery: string
  selectedCategory: string
  sortBy: SortBy
  onSearchChange: (query: string) => void
  onCategoryChange: (category: string) => void
  onSortChange: (sort: SortBy) => void
  onEditMemo: (memo: Memo) => void
  onDeleteMemo: (id: string) => void
  onViewMemo: (memo: Memo) => void
  onTagClick: (tag: string) => void
  onNewMemo: () => void
  stats: {
    total: number
    filtered: number
    byCategory: Record<string, number>
  }
}

const SORT_LABELS: Record<SortBy, string> = {
  updated: '최근 수정',
  created: '최근 생성',
  title: '제목 순',
}

function loadViewMode(): 'grid' | 'list' {
  if (typeof window === 'undefined') return 'grid'
  return (localStorage.getItem('memo:view') as 'grid' | 'list') || 'grid'
}

const MemoList = forwardRef<HTMLInputElement, MemoListProps>(function MemoList(
  {
    memos,
    loading,
    searchQuery,
    selectedCategory,
    sortBy,
    onSearchChange,
    onCategoryChange,
    onSortChange,
    onEditMemo,
    onDeleteMemo,
    onViewMemo,
    onTagClick,
    onNewMemo,
    stats,
  },
  ref,
) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(loadViewMode)

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    try { localStorage.setItem('memo:view', mode) } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-sm text-foreground-muted">불러오는 중...</span>
        </div>
      </div>
    )
  }

  const isFiltered = searchQuery || selectedCategory !== 'all'

  return (
    <div className="space-y-6">
      {/* 검색 & 필터 */}
      <div className="space-y-3">
        {/* 검색바 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={ref}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-surface border border-border text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-accent transition-all"
            placeholder="제목, 내용, 태그로 검색… (/ 또는 Ctrl+K)"
            aria-label="메모 검색"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground-muted hover:text-foreground transition-colors"
              aria-label="검색어 지우기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 카테고리 칩 + 정렬 + 뷰 토글 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 카테고리 칩 */}
          <div className="flex items-center gap-2 flex-wrap flex-1" role="group" aria-label="카테고리 필터">
            <button
              onClick={() => onCategoryChange('all')}
              aria-pressed={selectedCategory === 'all'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedCategory === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-surface border-border text-foreground-muted hover:border-foreground-muted hover:text-foreground'
              }`}
            >
              전체
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                selectedCategory === 'all' ? 'bg-background/20 text-background' : 'bg-surface-muted text-foreground-muted'
              }`}>
                {stats.total}
              </span>
            </button>

            {DEFAULT_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat
              const count = stats.byCategory[cat] || 0
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  style={categoryVars(cat)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? 'bg-[var(--cat-bg)] text-[var(--cat-fg)] border-[var(--cat-fg)]'
                      : 'bg-surface border-border text-foreground-muted hover:bg-[var(--cat-bg)] hover:text-[var(--cat-fg)] hover:border-[var(--cat-fg)]/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cat-bar)]" aria-hidden="true" />
                  {MEMO_CATEGORIES[cat]}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
                    isActive ? 'bg-[var(--cat-fg)]/15 text-[var(--cat-fg)]' : 'bg-surface-muted text-foreground-muted'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}

            {isFiltered && (
              <button
                onClick={() => { onSearchChange(''); onCategoryChange('all') }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-foreground-muted hover:text-foreground border border-dashed border-border hover:border-foreground-muted transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                초기화
              </button>
            )}
          </div>

          {/* 정렬 + 뷰 토글 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as SortBy)}
              className="text-xs border border-border rounded-xl px-2.5 py-1.5 bg-surface text-foreground-muted focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer"
              aria-label="정렬 기준"
            >
              {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            {/* 그리드/리스트 토글 */}
            <div className="flex rounded-xl border border-border overflow-hidden" role="group" aria-label="뷰 전환">
              <button
                onClick={() => handleViewModeChange('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`p-1.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-foreground text-background' : 'bg-surface text-foreground-muted hover:bg-surface-muted'
                }`}
                aria-label="그리드 뷰"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                aria-pressed={viewMode === 'list'}
                className={`p-1.5 transition-colors ${
                  viewMode === 'list' ? 'bg-foreground text-background' : 'bg-surface text-foreground-muted hover:bg-surface-muted'
                }`}
                aria-label="리스트 뷰"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isFiltered && (
          <p className="text-xs text-foreground-muted pl-1">
            {stats.filtered}개 메모 검색됨 (전체 {stats.total}개)
          </p>
        )}
      </div>

      {/* 메모 목록 */}
      {memos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-muted flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1.5">
            {isFiltered ? '검색 결과가 없습니다' : '아직 메모가 없습니다'}
          </h3>
          <p className="text-sm text-foreground-muted mb-6 max-w-xs">
            {isFiltered
              ? '검색어나 카테고리를 바꿔보거나, 전체 목록으로 돌아가세요.'
              : '첫 번째 메모를 작성하고 생각을 기록해보세요.'}
          </p>
          {isFiltered ? (
            <button
              onClick={() => { onSearchChange(''); onCategoryChange('all') }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              조건 초기화하고 전체 보기
            </button>
          ) : (
            <button
              onClick={onNewMemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              첫 메모 작성하기
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'flex flex-col gap-2'
          }
        >
          {memos.map(memo => (
            <MemoItem
              key={memo.id}
              memo={memo}
              onEdit={onEditMemo}
              onDelete={onDeleteMemo}
              onView={onViewMemo}
              onTagClick={onTagClick}
              searchQuery={searchQuery}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export default MemoList
