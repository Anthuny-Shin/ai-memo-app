'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const ARIA: Record<Theme, string> = {
  light: '다크 모드로 전환',
  dark: '시스템 기본으로 전환',
  system: '라이트 모드로 전환',
}

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  if (theme === 'system') {
    localStorage.setItem('theme', 'system')
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', dark)
  } else {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t = loadTheme()
    setTheme(t)
    applyTheme(t)
  }, [])

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const toggle = () => {
    const next = NEXT[theme]
    setTheme(next)
    applyTheme(next)
  }

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl" aria-hidden="true" />
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
      title={ARIA[theme]}
      aria-label={ARIA[theme]}
    >
      {theme === 'light' && (
        /* Moon — 다크로 전환 예고 */
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      {theme === 'dark' && (
        /* Monitor — 시스템으로 전환 예고 */
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}
      {theme === 'system' && (
        /* Sun — 라이트로 전환 예고 */
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
          />
        </svg>
      )}
    </button>
  )
}
