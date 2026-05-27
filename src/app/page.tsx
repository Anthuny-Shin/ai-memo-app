'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMemos } from '@/hooks/useMemos'
import { useShortcuts } from '@/hooks/useShortcuts'
import { Memo, MemoFormData } from '@/types/memo'
import MemoList from '@/components/MemoList'
import MemoForm from '@/components/MemoForm'
import MemoDetailModal from '@/components/MemoDetailModal'
import ThemeToggle from '@/components/ThemeToggle'
import Toast, { ToastMessage, ToastAction } from '@/components/Toast'
import { deleteMemo as deleteMemoAction } from '@/app/actions/memos'

let toastCounter = 0

export default function Home() {
  const {
    memos,
    allMemos,
    loading,
    loadError,
    searchQuery,
    selectedCategory,
    sortBy,
    stats,
    createMemo,
    updateMemo,
    optimisticRemoveMemo,
    restoreMemo,
    searchMemos,
    filterByCategory,
    setSortByPersisted,
  } = useMemos()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const pendingDeletesRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)

  const addToast = useCallback((
    type: 'success' | 'error',
    message: string,
    options?: { action?: ToastAction; duration?: number },
  ) => {
    const id = String(++toastCounter)
    setToasts(prev => [...prev, { id, type, message, ...options }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // 컴포넌트 언마운트 시 pending 타이머 정리
  useEffect(() => {
    const pendingDeletes = pendingDeletesRef.current
    return () => {
      pendingDeletes.forEach(timer => clearTimeout(timer))
    }
  }, [])

  useShortcuts({
    searchRef: searchInputRef,
    onNewMemo: () => { if (!isFormOpen) setIsFormOpen(true) },
  })

  const handleCreateMemo = async (formData: MemoFormData) => {
    await createMemo(formData)
    addToast('success', '메모가 저장되었어요.')
  }

  const handleUpdateMemo = async (formData: MemoFormData) => {
    if (editingMemo) {
      await updateMemo(editingMemo.id, formData)
      addToast('success', '메모가 수정되었어요.')
    }
  }

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMemo(null)
  }

  const handleViewMemo = (memo: Memo) => setViewingMemo(memo)
  const handleCloseDetailModal = () => setViewingMemo(null)

  const handleEditFromDetail = (memo: Memo) => {
    setViewingMemo(null)
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  /** Undo 삭제 패턴: 즉시 UI에서 제거 → 5초 후 API 호출. Undo 클릭 시 타이머 취소 + 복원 */
  const handleDeleteRequest = useCallback((id: string) => {
    const memoToDelete = allMemos.find(m => m.id === id)
    if (!memoToDelete) return

    if (viewingMemo?.id === id) setViewingMemo(null)
    optimisticRemoveMemo(id)

    const timer = setTimeout(async () => {
      pendingDeletesRef.current.delete(id)
      try {
        await deleteMemoAction(id)
      } catch {
        restoreMemo(memoToDelete)
        addToast('error', '메모를 삭제하지 못했어요.')
      }
    }, 5000)
    pendingDeletesRef.current.set(id, timer)

    addToast('success', '메모가 삭제되었어요.', {
      duration: 5000,
      action: {
        label: '실행 취소',
        onClick: () => {
          const t = pendingDeletesRef.current.get(id)
          if (t) { clearTimeout(t); pendingDeletesRef.current.delete(id) }
          restoreMemo(memoToDelete)
        },
      },
    })
  }, [allMemos, viewingMemo, optimisticRemoveMemo, restoreMemo, addToast])

  const handleTagFilter = useCallback((tag: string) => {
    searchMemos(tag)
  }, [searchMemos])

  const handleCategoryFilter = useCallback((category: string) => {
    filterByCategory(category)
  }, [filterByCategory])

  const handleNavigateDetail = useCallback((direction: 'prev' | 'next') => {
    if (!viewingMemo) return
    const idx = memos.findIndex(m => m.id === viewingMemo.id)
    if (idx === -1) return
    const nextIdx = direction === 'prev' ? idx - 1 : idx + 1
    if (nextIdx >= 0 && nextIdx < memos.length) setViewingMemo(memos[nextIdx])
  }, [viewingMemo, memos])

  const viewingIndex = viewingMemo ? memos.findIndex(m => m.id === viewingMemo.id) : -1
  const hasPrevMemo = viewingIndex > 0
  const hasNextMemo = viewingIndex >= 0 && viewingIndex < memos.length - 1

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-foreground tracking-tight">메모</span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* 데스크톱 새 메모 버튼 */}
              <button
                onClick={() => setIsFormOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-sm"
                aria-label="새 메모 작성 (단축키 N)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                새 메모
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 로드 실패 배너 */}
      {loadError && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-300 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{loadError}</span>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto shrink-0 underline underline-offset-2 hover:no-underline font-medium"
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      {/* 메인 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <MemoList
          ref={searchInputRef}
          memos={memos}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          sortBy={sortBy}
          onSearchChange={searchMemos}
          onCategoryChange={filterByCategory}
          onSortChange={setSortByPersisted}
          onEditMemo={handleEditMemo}
          onDeleteMemo={handleDeleteRequest}
          onViewMemo={handleViewMemo}
          onTagClick={handleTagFilter}
          onNewMemo={() => setIsFormOpen(true)}
          stats={stats}
        />
      </main>

      {/* 모바일 FAB */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="새 메모 작성"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 메모 폼 모달 */}
      <MemoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMemo ? handleUpdateMemo : handleCreateMemo}
        editingMemo={editingMemo}
      />

      {/* 메모 상세 모달 */}
      <MemoDetailModal
        memo={viewingMemo}
        isOpen={viewingMemo !== null}
        onClose={handleCloseDetailModal}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteRequest}
        onCategoryFilter={handleCategoryFilter}
        onTagClick={handleTagFilter}
        hasPrev={hasPrevMemo}
        hasNext={hasNextMemo}
        onNavigate={handleNavigateDetail}
      />

      {/* 토스트 알림 */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
