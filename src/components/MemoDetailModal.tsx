'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import { categoryVars, categoryBadgeClass, categoryBarClass } from '@/utils/categoryStyles'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface SummarizeResponse {
  summary?: string
  error?: string
}

function djb2(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i)
    h |= 0
  }
  return (h >>> 0).toString(36)
}

function getCachedSummary(id: string, content: string): string | null {
  if (typeof window === 'undefined') return null
  try { return sessionStorage.getItem(`summary:${id}:${djb2(content)}`) } catch { return null }
}

function setCachedSummary(id: string, content: string, summary: string): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.setItem(`summary:${id}:${djb2(content)}`, summary) } catch { /* ignore */ }
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="text-sm text-foreground leading-relaxed mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside text-sm text-foreground mb-3 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-foreground mb-3 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent hover:underline break-all">{children}</a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-3 italic text-foreground-muted text-sm mb-3">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through text-foreground-muted">{children}</del>,
  code: ({ className, children }) => {
    if (className) return <code className={`${className} text-xs font-mono`}>{children}</code>
    return <code className="bg-surface-muted text-foreground px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
  },
  pre: ({ children }) => (
    <pre className="bg-foreground text-background p-3 rounded-xl overflow-x-auto text-xs mb-3">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3">
      <table className="min-w-full text-sm border border-border rounded-xl overflow-hidden">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-muted">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-foreground border-b border-border/50">{children}</td>,
  input: ({ type, checked, disabled }) => {
    if (type === 'checkbox')
      return <input type="checkbox" checked={checked} disabled={disabled ?? true} readOnly className="mr-2 align-middle" />
    return <input type={type} checked={checked} disabled={disabled} readOnly />
  },
}

interface MemoDetailModalProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onCategoryFilter: (category: string) => void
  onTagClick: (tag: string) => void
  hasPrev: boolean
  hasNext: boolean
  onNavigate: (direction: 'prev' | 'next') => void
}

export default function MemoDetailModal({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCategoryFilter,
  onTagClick,
  hasPrev,
  hasNext,
  onNavigate,
}: MemoDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useFocusTrap(modalRef, isOpen)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  useEffect(() => {
    setSummary(null)
    setSummaryError(null)
    setCopied(false)
  }, [memo?.id])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (!typing) {
        if (e.key === 'ArrowLeft' && hasPrev) onNavigate('prev')
        if (e.key === 'ArrowRight' && hasNext) onNavigate('next')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, hasPrev, hasNext, onNavigate])

  const handleSummarize = useCallback(async () => {
    if (!memo) return
    const cached = getCachedSummary(memo.id, memo.content)
    if (cached) { setSummary(cached); return }
    setIsSummarizing(true)
    setSummary(null)
    setSummaryError(null)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: memo.title, content: memo.content }),
      })
      const data = (await res.json()) as SummarizeResponse
      if (!res.ok || data.error) {
        setSummaryError(data.error ?? 'AI 요약에 실패했습니다.')
      } else {
        const text = data.summary ?? ''
        setSummary(text)
        setCachedSummary(memo.id, memo.content, text)
      }
    } catch {
      setSummaryError('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSummarizing(false)
    }
  }, [memo])

  const handleCopySummary = async () => {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard might be unavailable */ }
  }

  if (!isOpen || !memo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memo-detail-title"
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* 이전 메모 버튼 */}
      {hasPrev && (
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-[1] w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors shadow-md"
          aria-label="이전 메모"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 다음 메모 버튼 */}
      {hasNext && (
        <button
          onClick={() => onNavigate('next')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-[1] w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors shadow-md"
          aria-label="다음 메모"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 모달 */}
      <div
        ref={modalRef}
        style={categoryVars(memo.category)}
        className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-border"
      >
        {/* 카테고리 컬러 띠 (상단) */}
        <div className={`h-1 w-full shrink-0 ${categoryBarClass}`} />

        {/* 헤더 */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex-1 pr-4 space-y-2">
            <h2
              id="memo-detail-title"
              className="text-lg font-semibold text-foreground leading-tight"
            >
              {memo.title}
            </h2>
            {/* 카테고리 뱃지 (클릭 → 필터) */}
            <button
              onClick={() => { onCategoryFilter(memo.category); onClose() }}
              style={categoryVars(memo.category)}
              className={`${categoryBadgeClass} hover:opacity-80 transition-opacity cursor-pointer`}
              aria-label={`${MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] || memo.category} 카테고리로 필터`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cat-bar)] inline-block mr-1" />
              {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] || memo.category}
            </button>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-xl transition-colors shrink-0"
            aria-label="모달 닫기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메타 정보 + 태그 */}
        <div className="px-6 py-2.5 bg-surface-muted border-b border-border shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 text-xs text-foreground-muted">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span>작성일: {formatDate(memo.createdAt)}</span>
              {memo.createdAt !== memo.updatedAt && (
                <span>수정일: {formatDate(memo.updatedAt)}</span>
              )}
            </div>
            {memo.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap sm:ml-auto">
                {memo.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => { onTagClick(tag); onClose() }}
                    className="px-2 py-0.5 bg-surface text-foreground-muted hover:bg-border hover:text-foreground text-[11px] rounded-md border border-border transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 내용 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* AI 요약 인라인 진입점 */}
          {summary === null && !isSummarizing && !summaryError && (
            <div className="mb-4">
              <button
                onClick={handleSummarize}
                disabled={!memo.content.trim()}
                className="inline-flex items-center gap-1.5 text-xs text-foreground-muted/70 hover:text-accent transition-colors disabled:opacity-40"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                AI 한 줄 요약 받기
              </button>
            </div>
          )}
          {isSummarizing && (
            <div className="mb-4 flex items-center gap-2 text-xs text-foreground-muted">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 0116 0" />
              </svg>
              AI가 요약하는 중...
            </div>
          )}

          {/* AI 요약 카드 */}
          {(summary !== null || summaryError !== null) && (
            <div
              className={`mb-5 rounded-2xl border p-4 ${
                summaryError
                  ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20'
                  : 'border-accent/30 bg-accent/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`flex items-center gap-1.5 text-xs font-semibold ${
                  summaryError ? 'text-red-600 dark:text-red-400' : 'text-accent'
                }`}>
                  {!summaryError && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                  {summaryError ? '요약 실패' : 'AI 요약'}
                </p>
                {summary && (
                  <button
                    onClick={handleCopySummary}
                    className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
                    aria-label="요약 복사"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        복사됨
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        복사
                      </>
                    )}
                  </button>
                )}
              </div>
              {summaryError ? (
                <p className="text-sm text-red-700 dark:text-red-300">{summaryError}</p>
              ) : (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
              )}
            </div>
          )}

          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {memo.content}
          </Markdown>
        </div>

        {/* 푸터 */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4 border-t border-border bg-surface-muted shrink-0">
          {/* AI 요약 버튼 */}
          <button
            onClick={handleSummarize}
            disabled={isSummarizing || !memo.content.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="AI로 메모 요약하기"
          >
            {isSummarizing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 0116 0" />
                </svg>
                요약 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                AI 요약
              </>
            )}
          </button>

          {/* 삭제 / 편집 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(memo.id)}
              className="inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-500 bg-surface hover:bg-red-50 dark:hover:bg-red-950/30 border border-border hover:border-red-200 dark:hover:border-red-900/40 rounded-xl transition-colors"
              aria-label="메모 삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              삭제
            </button>
            <button
              onClick={() => { onEdit(memo); onClose() }}
              className="inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
              aria-label="메모 편집"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
