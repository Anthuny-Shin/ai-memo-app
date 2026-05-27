export interface ApplyResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

function getLineStart(value: string, pos: number): number {
  return value.lastIndexOf('\n', pos - 1) + 1
}

/** 선택 영역을 marker로 감쌉니다 (굵게, 기울임 등). 이미 감싸진 경우 해제합니다. */
export function wrapInline(
  textarea: HTMLTextAreaElement,
  marker: string,
  endMarker: string = marker,
): ApplyResult {
  const { selectionStart: s, selectionEnd: e, value } = textarea
  const selected = value.slice(s, e)
  const ml = marker.length
  const eml = endMarker.length

  // 이미 감싸진 경우 해제
  if (
    s >= ml &&
    e + eml <= value.length &&
    value.slice(s - ml, s) === marker &&
    value.slice(e, e + eml) === endMarker
  ) {
    return {
      value: value.slice(0, s - ml) + selected + value.slice(e + eml),
      selectionStart: s - ml,
      selectionEnd: e - ml,
    }
  }

  const placeholder = selected || (marker === '`' ? 'code' : 'text')
  const newValue =
    value.slice(0, s) + marker + placeholder + endMarker + value.slice(e)
  return {
    value: newValue,
    selectionStart: s + ml,
    selectionEnd: s + ml + placeholder.length,
  }
}

/** 링크 삽입 ([선택텍스트](url)) */
export function wrapLink(textarea: HTMLTextAreaElement): ApplyResult {
  const { selectionStart: s, selectionEnd: e, value } = textarea
  const selected = value.slice(s, e)
  if (selected) {
    const inserted = `[${selected}](url)`
    return {
      value: value.slice(0, s) + inserted + value.slice(e),
      selectionStart: s + selected.length + 3,
      selectionEnd: s + selected.length + 6,
    }
  }
  const inserted = '[링크텍스트](url)'
  return {
    value: value.slice(0, s) + inserted + value.slice(e),
    selectionStart: s + 1,
    selectionEnd: s + 6,
  }
}

/** 코드 블록 삽입 */
export function wrapCodeBlock(textarea: HTMLTextAreaElement): ApplyResult {
  const { selectionStart: s, selectionEnd: e, value } = textarea
  const selected = value.slice(s, e) || 'code'
  const prefix = '```\n'
  const suffix = '\n```'
  return {
    value: value.slice(0, s) + prefix + selected + suffix + value.slice(e),
    selectionStart: s + prefix.length,
    selectionEnd: s + prefix.length + selected.length,
  }
}

/** 줄 앞에 prefix를 삽입합니다. 이미 있으면 제거합니다. */
export function insertLinePrefix(
  textarea: HTMLTextAreaElement,
  prefix: string,
): ApplyResult {
  const { selectionStart: s, value } = textarea
  const lineStart = getLineStart(value, s)
  const pl = prefix.length

  if (value.slice(lineStart, lineStart + pl) === prefix) {
    return {
      value: value.slice(0, lineStart) + value.slice(lineStart + pl),
      selectionStart: Math.max(lineStart, s - pl),
      selectionEnd: Math.max(lineStart, s - pl),
    }
  }

  return {
    value: value.slice(0, lineStart) + prefix + value.slice(lineStart),
    selectionStart: s + pl,
    selectionEnd: s + pl,
  }
}

/** Tab 키: 커서 위치에 2칸 들여쓰기 삽입 */
export function handleTabKey(textarea: HTMLTextAreaElement): ApplyResult {
  const { selectionStart: s, selectionEnd: e, value } = textarea
  const indent = '  '
  return {
    value: value.slice(0, s) + indent + value.slice(e),
    selectionStart: s + indent.length,
    selectionEnd: s + indent.length,
  }
}

/** Enter 키: 리스트/체크리스트 자동 이어쓰기. 해당 없으면 null 반환 */
export function handleEnterKey(
  textarea: HTMLTextAreaElement,
): ApplyResult | null {
  const { selectionStart: s, value } = textarea
  const lineStart = getLineStart(value, s)
  const line = value.slice(lineStart, s)

  // 비순서 목록 & 체크리스트
  const ulMatch = line.match(/^(\s*)([-*+] (?:\[[ x]\] )?)/)
  if (ulMatch) {
    const lineContent = line.slice(ulMatch[0].length)
    if (!lineContent.trim()) {
      // 빈 항목 → 목록 종료
      return {
        value: value.slice(0, lineStart) + '\n' + value.slice(s),
        selectionStart: lineStart + 1,
        selectionEnd: lineStart + 1,
      }
    }
    const prefix = ulMatch[1] + (ulMatch[2].includes('[ ]') || ulMatch[2].includes('[x]')
      ? ulMatch[2].replace('[x]', '[ ]')
      : ulMatch[2])
    const insert = '\n' + prefix
    return {
      value: value.slice(0, s) + insert + value.slice(s),
      selectionStart: s + insert.length,
      selectionEnd: s + insert.length,
    }
  }

  // 순서 목록
  const olMatch = line.match(/^(\s*)(\d+)\. /)
  if (olMatch) {
    const lineContent = line.slice(olMatch[0].length)
    if (!lineContent.trim()) {
      return {
        value: value.slice(0, lineStart) + '\n' + value.slice(s),
        selectionStart: lineStart + 1,
        selectionEnd: lineStart + 1,
      }
    }
    const next = parseInt(olMatch[2]) + 1
    const insert = '\n' + olMatch[1] + next + '. '
    return {
      value: value.slice(0, s) + insert + value.slice(s),
      selectionStart: s + insert.length,
      selectionEnd: s + insert.length,
    }
  }

  return null
}

/** textarea에 ApplyResult를 적용하고 포커스/커서를 복원합니다 */
export function applyToTextarea(
  textarea: HTMLTextAreaElement,
  result: ApplyResult,
  onChange: (value: string) => void,
) {
  onChange(result.value)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
  })
}
