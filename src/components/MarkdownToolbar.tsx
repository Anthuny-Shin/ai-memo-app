'use client'

import { RefObject } from 'react'
import {
  wrapInline,
  wrapLink,
  wrapCodeBlock,
  insertLinePrefix,
  applyToTextarea,
  type ApplyResult,
} from '@/utils/markdownInsert'

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  disabled?: boolean
}

interface ToolDef {
  id: string
  label: string
  ariaLabel: string
  action: (ta: HTMLTextAreaElement) => ApplyResult
  dividerBefore?: boolean
}

const TOOLS: ToolDef[] = [
  {
    id: 'bold',
    label: 'B',
    ariaLabel: '굵게 (Ctrl+B)',
    action: ta => wrapInline(ta, '**'),
  },
  {
    id: 'italic',
    label: 'I',
    ariaLabel: '기울임 (Ctrl+I)',
    action: ta => wrapInline(ta, '_'),
  },
  {
    id: 'strike',
    label: 'S',
    ariaLabel: '취소선',
    action: ta => wrapInline(ta, '~~'),
  },
  {
    id: 'heading',
    label: 'H',
    ariaLabel: '제목',
    action: ta => insertLinePrefix(ta, '## '),
    dividerBefore: true,
  },
  {
    id: 'quote',
    label: '❝',
    ariaLabel: '인용',
    action: ta => insertLinePrefix(ta, '> '),
  },
  {
    id: 'code',
    label: '`',
    ariaLabel: '인라인 코드 (Ctrl+`)',
    action: ta => wrapInline(ta, '`'),
    dividerBefore: true,
  },
  {
    id: 'codeblock',
    label: '{}',
    ariaLabel: '코드 블록',
    action: ta => wrapCodeBlock(ta),
  },
  {
    id: 'link',
    label: '🔗',
    ariaLabel: '링크 (Ctrl+K)',
    action: ta => wrapLink(ta),
    dividerBefore: true,
  },
  {
    id: 'list',
    label: '•',
    ariaLabel: '목록',
    action: ta => insertLinePrefix(ta, '- '),
  },
  {
    id: 'checklist',
    label: '☑',
    ariaLabel: '체크리스트',
    action: ta => insertLinePrefix(ta, '- [ ] '),
  },
]

const btnBase =
  'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none'

const specialStyles: Record<string, string> = {
  bold: 'font-bold',
  italic: 'italic',
  strike: 'line-through',
}

export default function MarkdownToolbar({
  textareaRef,
  onChange,
  disabled,
}: MarkdownToolbarProps) {
  const handleClick = (tool: ToolDef) => {
    const ta = textareaRef.current
    if (!ta) return
    applyToTextarea(ta, tool.action(ta), onChange)
  }

  return (
    <div
      className="flex items-center gap-0.5 px-1 py-1 border border-border rounded-xl bg-surface-muted overflow-x-auto"
      role="toolbar"
      aria-label="마크다운 서식 도구"
    >
      {TOOLS.map(tool => (
        <span key={tool.id} className="flex items-center gap-0.5">
          {tool.dividerBefore && (
            <span className="w-px h-4 bg-border mx-0.5 shrink-0" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => handleClick(tool)}
            disabled={disabled}
            className={`${btnBase} ${specialStyles[tool.id] ?? ''}`}
            aria-label={tool.ariaLabel}
            title={tool.ariaLabel}
          >
            {tool.label}
          </button>
        </span>
      ))}
    </div>
  )
}
