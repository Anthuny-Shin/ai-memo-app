'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Memo,
  MemoFormData,
  MEMO_CATEGORIES,
  DEFAULT_CATEGORIES,
} from '@/types/memo'
import { categoryVars } from '@/utils/categoryStyles'
import { useDraft } from '@/hooks/useDraft'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import MarkdownToolbar from '@/components/MarkdownToolbar'
import {
  wrapInline,
  wrapLink,
  handleTabKey,
  handleEnterKey,
  applyToTextarea,
} from '@/utils/markdownInsert'

const previewComponents: Components = {
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

const EMPTY_FORM: MemoFormData = { title: '', content: '', category: 'personal', tags: [] }

function isDirty(a: MemoFormData, b: MemoFormData): boolean {
  return (
    a.title !== b.title ||
    a.content !== b.content ||
    a.category !== b.category ||
    JSON.stringify(a.tags) !== JSON.stringify(b.tags)
  )
}

interface MemoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MemoFormData) => Promise<void>
  editingMemo?: Memo | null
}

export default function MemoForm({ isOpen, onClose, onSubmit, editingMemo }: MemoFormProps) {
  const [formData, setFormData] = useState<MemoFormData>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [contentTab, setContentTab] = useState<'editor' | 'preview'>('editor')
  const [titleError, setTitleError] = useState('')
  const [contentError, setContentError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const initialDataRef = useRef<MemoFormData>(EMPTY_FORM)

  const { saveDraft, loadDraft, clearDraft } = useDraft(editingMemo?.id)
  useFocusTrap(modalRef, isOpen && !showDiscardConfirm)

  // 폼 열릴 때 초기화 + draft 로드
  useEffect(() => {
    if (!isOpen) return

    const initial: MemoFormData = editingMemo
      ? { title: editingMemo.title, content: editingMemo.content, category: editingMemo.category, tags: editingMemo.tags }
      : EMPTY_FORM

    initialDataRef.current = initial

    const draft = loadDraft()
    if (draft && isDirty(draft, initial)) {
      setFormData(draft)
      setShowDraftBanner(true)
    } else {
      setFormData(initial)
      setShowDraftBanner(false)
    }

    setTagInput('')
    setContentTab('editor')
    setTitleError('')
    setContentError('')
    setSubmitError('')
    setIsSubmitting(false)
    setShowDiscardConfirm(false)

    const focusTimer = setTimeout(() => titleRef.current?.focus(), 50)
    return () => clearTimeout(focusTimer)
  }, [editingMemo, isOpen, loadDraft])

  // draft 자동저장 (800ms 디바운스)
  useEffect(() => {
    if (!isOpen) return
    if (isDirty(formData, initialDataRef.current)) {
      saveDraft(formData)
    }
  }, [formData, isOpen, saveDraft])

  // 스크롤 잠금 + Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !showDiscardConfirm) {
        handleCloseIntent()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSubmitting, showDiscardConfirm])

  const handleCloseIntent = useCallback(() => {
    if (isSubmitting) return
    if (isDirty(formData, initialDataRef.current)) {
      setShowDiscardConfirm(true)
    } else {
      clearDraft()
      onClose()
    }
  }, [isSubmitting, formData, clearDraft, onClose])

  const handleConfirmDiscard = () => {
    clearDraft()
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let hasError = false
    if (!formData.title.trim()) { setTitleError('제목을 입력해주세요.'); hasError = true }
    else setTitleError('')
    if (!formData.content.trim()) { setContentError('내용을 입력해주세요.'); hasError = true }
    else setContentError('')
    if (hasError) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(formData)
      clearDraft()
      onClose()
    } catch {
      setSubmitError('저장하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const applyContent = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, content: value }))
    if (contentError) setContentError('')
  }, [contentError])

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      applyToTextarea(ta, wrapInline(ta, '**'), applyContent)
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault()
      applyToTextarea(ta, wrapInline(ta, '_'), applyContent)
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      applyToTextarea(ta, wrapLink(ta), applyContent)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      applyToTextarea(ta, handleTabKey(ta), applyContent)
      return
    }
    if (e.key === 'Enter') {
      const result = handleEnterKey(ta)
      if (result) {
        e.preventDefault()
        applyToTextarea(ta, result, applyContent)
      }
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }))
  }

  if (!isOpen) return null

  const inputBase =
    'w-full px-4 py-2.5 rounded-xl border bg-surface text-foreground placeholder:text-foreground-muted/70 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-accent transition-all'
  const formId = 'memo-form'
  const headingId = 'memo-form-heading'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleCloseIntent}
        aria-hidden="true"
      />

      {/* 모달 */}
      <div
        ref={modalRef}
        className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-border"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 id={headingId} className="text-base font-semibold text-foreground">
            {editingMemo ? '메모 편집' : '새 메모 작성'}
          </h2>
          <button
            onClick={handleCloseIntent}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-40"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* draft 배너 */}
        {showDraftBanner && (
          <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/8 border border-accent/20 text-sm shrink-0">
            <span className="flex-1 text-foreground-muted">이전에 작성하던 내용이 있어요.</span>
            <button
              type="button"
              onClick={() => setShowDraftBanner(false)}
              className="text-accent font-medium hover:text-accent-hover transition-colors"
            >
              이어쓰기
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => { setFormData(initialDataRef.current); clearDraft(); setShowDraftBanner(false) }}
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              새로 시작
            </button>
          </div>
        )}

        {/* 제출 오류 배너 */}
        {submitError && (
          <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300 text-sm shrink-0">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {submitError}
          </div>
        )}

        {/* 폼 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id={formId} onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* 제목 */}
            <div>
              <label
                htmlFor="memo-title"
                className="block text-xs font-medium text-foreground-muted mb-1.5 uppercase tracking-wide"
              >
                제목 *
              </label>
              <input
                ref={titleRef}
                type="text"
                id="memo-title"
                value={formData.title}
                onChange={e => {
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                  if (titleError) setTitleError('')
                }}
                className={`${inputBase} ${titleError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-border'}`}
                placeholder="메모 제목을 입력하세요"
                aria-describedby={titleError ? 'title-error' : undefined}
                aria-invalid={Boolean(titleError)}
                disabled={isSubmitting}
              />
              {titleError && (
                <p id="title-error" role="alert" className="mt-1.5 text-xs text-red-500">{titleError}</p>
              )}
            </div>

            {/* 카테고리 */}
            <div>
              <p className="text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wide">카테고리</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="카테고리 선택">
                {DEFAULT_CATEGORIES.map(cat => {
                  const isActive = formData.category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                      style={categoryVars(cat)}
                      aria-pressed={isActive}
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-50 ${
                        isActive
                          ? 'bg-[var(--cat-bg)] text-[var(--cat-fg)] border-[var(--cat-fg)]'
                          : 'bg-surface border-border text-foreground-muted hover:bg-[var(--cat-bg)]/60 hover:text-[var(--cat-fg)] hover:border-[var(--cat-fg)]/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--cat-bar)]" aria-hidden="true" />
                      {MEMO_CATEGORIES[cat]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="memo-content"
                  className="block text-xs font-medium text-foreground-muted uppercase tracking-wide"
                >
                  내용 *
                </label>
                <div
                  className="flex rounded-lg border border-border overflow-hidden text-xs"
                  role="group"
                  aria-label="편집 모드 전환"
                >
                  <button
                    type="button"
                    onClick={() => setContentTab('editor')}
                    aria-pressed={contentTab === 'editor'}
                    className={`px-3 py-1 transition-colors ${
                      contentTab === 'editor' ? 'bg-foreground text-background' : 'bg-surface text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    편집
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab('preview')}
                    aria-pressed={contentTab === 'preview'}
                    className={`px-3 py-1 transition-colors ${
                      contentTab === 'preview' ? 'bg-foreground text-background' : 'bg-surface text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    미리보기
                  </button>
                </div>
              </div>

              {contentTab === 'editor' ? (
                <>
                  <MarkdownToolbar
                    textareaRef={contentRef}
                    onChange={applyContent}
                    disabled={isSubmitting}
                  />
                  <div className="mt-1.5">
                    <textarea
                      ref={contentRef}
                      id="memo-content"
                      value={formData.content}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, content: e.target.value }))
                        if (contentError) setContentError('')
                      }}
                      onKeyDown={handleContentKeyDown}
                      className={`${inputBase} resize-none font-mono mt-0 ${contentError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-border'}`}
                      placeholder="메모 내용을 입력하세요 (마크다운 지원)"
                      rows={9}
                      aria-describedby={contentError ? 'content-error' : undefined}
                      aria-invalid={Boolean(contentError)}
                      disabled={isSubmitting}
                    />
                    {contentError && (
                      <p id="content-error" role="alert" className="mt-1.5 text-xs text-red-500">{contentError}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full min-h-[13rem] px-4 py-3 border border-border rounded-xl bg-surface-muted overflow-y-auto">
                  {formData.content.trim() ? (
                    <Markdown remarkPlugins={[remarkGfm]} components={previewComponents}>
                      {formData.content}
                    </Markdown>
                  ) : (
                    <p className="text-foreground-muted text-sm">내용을 입력하면 미리보기가 표시됩니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 태그 */}
            <div>
              <label
                htmlFor="memo-tag-input"
                className="block text-xs font-medium text-foreground-muted mb-1.5 uppercase tracking-wide"
              >
                태그
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  id="memo-tag-input"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                  className={`${inputBase} flex-1 border-border`}
                  placeholder="태그 입력 후 Enter"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-surface-muted text-foreground hover:bg-border transition-colors border border-border disabled:opacity-50"
                >
                  추가
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-muted text-foreground text-xs rounded-lg border border-border"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isSubmitting}
                        className="text-foreground-muted hover:text-foreground transition-colors ml-0.5 disabled:opacity-50"
                        aria-label={`${tag} 태그 제거`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 푸터 */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-surface shrink-0">
          <button
            type="button"
            onClick={handleCloseIntent}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 0116 0" />
                </svg>
                저장 중...
              </>
            ) : (
              editingMemo ? '수정하기' : '저장하기'
            )}
          </button>
        </div>

        {/* 인라인 변경사항 버리기 확인 오버레이 */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 rounded-3xl bg-surface/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5 p-8 z-10">
            <div className="text-center space-y-1.5">
              <p className="text-base font-semibold text-foreground">변경사항을 버릴까요?</p>
              <p className="text-sm text-foreground-muted">저장하지 않은 내용은 복구할 수 없어요.</p>
            </div>
            <div className="flex gap-3 w-full max-w-[260px]">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-surface-muted transition-colors"
                autoFocus
              >
                계속 편집
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                버리기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
