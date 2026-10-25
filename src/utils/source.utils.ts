import type { SourceIndent } from '../types/source.types.ts'
import type { ESTree } from '@oxlint/plugins'

const sourceDirective =
  /^\s*(?:\/\s*<(?:reference\b|amd-[\w-]+\b)|@ts-(?:check|ignore|expect-error|nocheck)\b|(?:#|@)__(?:PURE|NO_SIDE_EFFECTS)__\b|@jsx(?:ImportSource|Runtime|Frag)?\b|@vite-ignore\b|(?:[#@]\s*)?sourceMappingURL=|(?:es|ox)lint-(?:disable|enable)|prettier-ignore|biome-ignore|[cv]8 ignore|istanbul ignore|webpack[A-Z])/

export const sourceDisableNextLine = /^(?:eslint|oxlint)-disable-next-line\b/
const sourceLegalBlock = '\0legal-block\0'

export const sourceIndentSchema = {
  anyOf: [
    { type: 'integer', minimum: 0 },
    { type: 'string', enum: ['tab'] },
  ],
}

export function sourceCommentText(comment: Pick<ESTree.Comment, 'type' | 'value'>): string {
  const value = (comment.type === 'Block' ? comment.value.replace(/^\s*\* ?/gm, '') : comment.value).trimStart()
  return comment.type === 'Block' && comment.value.startsWith('!') ? sourceLegalBlock + value : value
}

export function sourceIsDirective(text: string): boolean {
  return text.startsWith(sourceLegalBlock) || sourceDirective.test(text)
}

export function sourceIsWhy(text: string): boolean {
  return text.startsWith('Why: ')
}

export function sourceIsJsdoc(source: string, comment: Pick<ESTree.Comment, 'type' | 'range'>): boolean {
  return comment.type === 'Block' && source.startsWith('/**', comment.range[0])
}

export function sourceLineIndent(text: string, offset: number): string {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1
  return /^[\t ]*/.exec(text.slice(lineStart, offset))?.[0] ?? ''
}

export function sourceIndentUnit(indent: SourceIndent = 2): string {
  return indent === 'tab' ? '\t' : ' '.repeat(indent)
}

export function sourceNewline(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n'
}
