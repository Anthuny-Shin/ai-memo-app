'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import {
  listMemos,
  createMemo as createMemoAction,
  updateMemo as updateMemoAction,
  deleteMemo as deleteMemoAction,
  clearMemos as clearMemosAction,
} from '@/app/actions/memos'

type SortBy = 'updated' | 'created' | 'title'

function loadSortBy(): SortBy {
  if (typeof window === 'undefined') return 'updated'
  return (localStorage.getItem('memo:sort') as SortBy) || 'updated'
}

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>(loadSortBy)

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    listMemos()
      .then(data => setMemos(data))
      .catch(error => {
        console.error('메모 로드 실패:', error)
        setLoadError('메모를 불러오지 못했어요. 새로고침 해주세요.')
      })
      .finally(() => setLoading(false))
  }, [])

  const createMemo = useCallback(async (formData: MemoFormData): Promise<Memo> => {
    const newMemo = await createMemoAction(formData)
    setMemos(prev => [newMemo, ...prev])
    return newMemo
  }, [])

  const updateMemo = useCallback(async (id: string, formData: MemoFormData): Promise<void> => {
    const updated = await updateMemoAction(id, formData)
    setMemos(prev => prev.map(memo => (memo.id === id ? updated : memo)))
  }, [])

  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    await deleteMemoAction(id)
    setMemos(prev => prev.filter(memo => memo.id !== id))
  }, [])

  /** UI에서만 제거 (Undo 삭제 패턴용) */
  const optimisticRemoveMemo = useCallback((id: string): void => {
    setMemos(prev => prev.filter(m => m.id !== id))
  }, [])

  /** UI에 메모 복원 (Undo 삭제 패턴용) */
  const restoreMemo = useCallback((memo: Memo): void => {
    setMemos(prev => {
      if (prev.some(m => m.id === memo.id)) return prev
      return [memo, ...prev]
    })
  }, [])

  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  const setSortByPersisted = useCallback((sort: SortBy): void => {
    setSortBy(sort)
    try { localStorage.setItem('memo:sort', sort) } catch { /* ignore */ }
  }, [])

  const getMemoById = useCallback(
    (id: string): Memo | undefined => memos.find(memo => memo.id === id),
    [memos],
  )

  const filteredMemos = useMemo(() => {
    let filtered = memos

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query)),
      )
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'ko')
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [memos, selectedCategory, searchQuery, sortBy])

  const clearAllMemos = useCallback(async (): Promise<void> => {
    await clearMemosAction()
    setMemos([])
    setSearchQuery('')
    setSelectedCategory('all')
  }, [])

  const stats = useMemo(() => {
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return {
      total: memos.length,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    memos: filteredMemos,
    allMemos: memos,
    loading,
    loadError,
    searchQuery,
    selectedCategory,
    sortBy,
    stats,

    createMemo,
    updateMemo,
    deleteMemo,
    optimisticRemoveMemo,
    restoreMemo,
    getMemoById,

    searchMemos,
    filterByCategory,
    setSortByPersisted,

    clearAllMemos,
  }
}
