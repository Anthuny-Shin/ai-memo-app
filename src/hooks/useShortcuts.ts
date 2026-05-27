'use client'

import { useEffect, RefObject } from 'react'

interface ShortcutOptions {
  searchRef?: RefObject<HTMLInputElement | null>
  onNewMemo?: () => void
}

function isTyping(): boolean {
  const el = document.activeElement
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  )
}

export function useShortcuts({ searchRef, onNewMemo }: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K: focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef?.current?.focus()
        searchRef?.current?.select()
        return
      }

      if (isTyping()) return

      // /: focus search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        searchRef?.current?.focus()
        return
      }

      // n: new memo
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        onNewMemo?.()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchRef, onNewMemo])
}
