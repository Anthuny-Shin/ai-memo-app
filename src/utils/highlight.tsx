import { Fragment } from 'react'

/**
 * 텍스트에서 검색어를 찾아 <mark> 태그로 감싼 ReactNode를 반환합니다.
 * 검색어가 없으면 원본 문자열을 그대로 반환합니다.
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-accent/25 text-foreground rounded-[2px] px-0.5 not-italic"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
