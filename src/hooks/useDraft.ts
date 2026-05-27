'use client'

import { useCallback, useEffect, useRef } from 'react'
import { MemoFormData } from '@/types/memo'

const DEBOUNCE_MS = 800

function getDraftKey(editingId?: string | null): string {
  return editingId ? `memo:draft:${editingId}` : 'memo:draft:new'
}

export function useDraft(editingId?: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const key = getDraftKey(editingId)

  const saveDraft = useCallback(
    (data: MemoFormData) => {
      if (typeof window === 'undefined') return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(data))
        } catch {
          // storage might be full or unavailable
        }
      }, DEBOUNCE_MS)
    },
    [key],
  )

  const loadDraft = useCallback((): MemoFormData | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as MemoFormData
    } catch {
      return null
    }
  }, [key])

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }, [key])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { saveDraft, loadDraft, clearDraft }
}
