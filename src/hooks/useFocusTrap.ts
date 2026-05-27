'use client'

import { useEffect } from 'react'

const TABBABLE = [
  'a[href]:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap(
  containerRef: { current: HTMLElement | null },
  isActive: boolean,
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    const previousFocus = document.activeElement as HTMLElement | null
    const container = containerRef.current

    const handleTab = (e: KeyboardEvent) => {
      // 다른 핸들러(예: 마크다운 textarea Tab 들여쓰기)에서 이미 처리된 경우 무시
      if (e.key !== 'Tab' || e.defaultPrevented) return
      const tabbables = Array.from(
        container.querySelectorAll<HTMLElement>(TABBABLE),
      ).filter(el => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null)

      if (!tabbables.length) {
        e.preventDefault()
        return
      }
      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first || !container.contains(document.activeElement)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last || !container.contains(document.activeElement)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => {
      document.removeEventListener('keydown', handleTab)
      previousFocus?.focus()
    }
  }, [isActive, containerRef])
}
