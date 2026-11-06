import type { SourceIndent } from '../types/source.types.ts'
import type * as PluginsTypes from '@oxlint/plugins'

const sourceDirective =
  /^\s*(?:\/\s*<(?:reference\b|amd-[\w-]+\b)|@ts-(?:check|ignore|expect-error|nocheck)\b|(?:#|@)__(?:PURE|NO_SIDE_EFFECTS)__\b|@jsx(?:ImportSource|Runtime|Frag)?\b|@vite-ignore\b|(?:[#@]\s*)?sourceMappingURL=|(?:es|ox)lint-(?:disable|enable)|prettier-ignore|biome-ignore|[cv]8 ignore|istanbul ignore|webpack[A-Z])/

const sourceLegalBlock = '\0legal-block\0'

export const sourceIndentSchema = {
  anyOf: [
    { type: 'integer', minimum: 0 },
    { type: 'string', enum: ['tab'] },
  ],
}

export function sourceCommentText(comment: Pick<PluginsTypes.ESTree.Comment, 'type' | 'value'>): string {
  const value = (comment.type === 'Block' ? comment.value.replace(/^\s*\* ?/gm, '') : comment.value).trimStart()
  return comment.type === 'Block' && comment.value.startsWith('!') ? sourceLegalBlock + value : value
}

export function sourceIsDirective(text: string): boolean {
  return text.startsWith(sourceLegalBlock) || sourceDirective.test(text)
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

export function sourceLineStart(text: string, offset: number): number {
  return text.lastIndexOf('\n', offset - 1) + 1
}

export function sourceLineEnd(text: string, offset: number): number {
  const end = text.indexOf('\n', offset)
  return end === -1 ? text.length : end
}

export function sourceItemGaps(open: number, items: readonly PluginsTypes.Ranged[], close: number): PluginsTypes.Range[] {
  const edges = [open, ...items.flatMap((item) => item.range), close]
  return Array.from({ length: items.length + 1 }, (_, index): PluginsTypes.Range => [edges[index * 2] ?? open, edges[index * 2 + 1] ?? close])
}

export function sourceRespace(
  fixer: PluginsTypes.Fixer,
  text: string,
  gaps: PluginsTypes.Range[],
  spacing: (index: number, last: boolean) => string,
): PluginsTypes.Fix[] | null {
  const matches = gaps.map((gap) => /^\s*(,?)\s*$/.exec(text.slice(...gap)))

  if (matches.some((match) => match === null)) {
    return null
  }

  return gaps.map((gap, index) => fixer.replaceTextRange(gap, `${matches[index]?.[1] ?? ''}${spacing(index, index === gaps.length - 1)}`))
}
