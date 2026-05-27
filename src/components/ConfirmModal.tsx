'use client'

import { useEffect, useRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = '확인',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useFocusTrap(modalRef, isOpen)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div ref={modalRef} className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-sm border border-border p-6 flex flex-col gap-5">
        <div className="space-y-1.5">
          <h3
            id="confirm-modal-title"
            className="text-base font-semibold text-foreground"
          >
            {title}
          </h3>
          <p className="text-sm text-foreground-muted leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
              isDestructive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
