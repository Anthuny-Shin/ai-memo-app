'use client'

import { useEffect, useState } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error'
  message: string
  action?: ToastAction
  duration?: number
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:top-auto sm:bottom-4 sm:right-4 z-[100] flex flex-col gap-2 pointer-events-none items-center sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const duration = toast.duration ?? 3500

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 16)
    const exitTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 280)
    }, duration)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
    }
  }, [toast.id, duration, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 280)
  }

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-medium w-[min(88vw,22rem)] transition-all duration-300 ease-out ${
        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 sm:translate-y-1'
      } ${
        toast.type === 'success'
          ? 'bg-surface border-border text-foreground'
          : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-900/40 dark:text-red-300'
      }`}
    >
      {toast.type === 'success' ? (
        <svg
          className="w-4 h-4 text-green-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-red-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <span className="flex-1 leading-snug">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick()
            handleDismiss()
          }}
          className="shrink-0 text-accent font-semibold hover:text-accent-hover transition-colors whitespace-nowrap text-xs"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
        aria-label="알림 닫기"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
