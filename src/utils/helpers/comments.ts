import type { ESTree } from '@oxlint/plugins'

// Why: these comments change how other tools compile or lint the next line, so
// deleting one silently re-enables a rule or a type error somewhere else.
const COMMENTS_DIRECTIVE = /^\s*(?:\/\s*<(?:reference\b|amd-[\w-]+\b)|@ts-(?:check|ignore|expect-error|nocheck)\b|(?:#|@)__(?:PURE|NO_SIDE_EFFECTS)__\b|@jsx(?:ImportSource|Runtime|Frag)?\b|@vite-ignore\b|(?:[#@]\s*)?sourceMappingURL=|(?:es|ox)lint-(?:disable|enable)|prettier-ignore|biome-ignore|[cv]8 ignore|istanbul ignore|webpack[A-Z])/
const COMMENTS_DISABLE_NEXT_LINE = /^(?:eslint|oxlint)-disable-next-line\b/
const COMMENTS_LEGAL_BLOCK = '\0legal-block\0'

export function commentsNormalizedValue(comment: Pick<ESTree.Comment, 'type' | 'value'>): string {
  const value = (comment.type === 'Block'
    ? comment.value.replace(/^\s*\* ?/gm, '')
    : comment.value).trimStart()

  // Why: downstream callers only receive the normalized text. Preserve the
  // token-level distinction between legal `/*!` blocks and ordinary `!` text.
  return comment.type === 'Block' && comment.value.startsWith('!')
    ? COMMENTS_LEGAL_BLOCK + value
    : value
}

export function commentsIsDirective(value: string): boolean {
  return value.startsWith(COMMENTS_LEGAL_BLOCK) || COMMENTS_DIRECTIVE.test(value)
}

export function commentsIsDisableNextLine(value: string): boolean {
  return COMMENTS_DISABLE_NEXT_LINE.test(value)
}

export function commentsIsWhy(value: string): boolean {
  return value.startsWith('Why: ')
}

export function commentsIsJsdoc(source: string, comment: Pick<ESTree.Comment, 'type' | 'range'>): boolean {
  return comment.type === 'Block' && source.startsWith('/**', comment.range[0])
}
