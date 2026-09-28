export type LayoutIndent = number | 'tab'

export const layoutIndentSchema = {
  anyOf: [
    { type: 'integer', minimum: 0 },
    { type: 'string', enum: ['tab'] },
  ],
}

export function layoutLineIndent(text: string, offset: number): string {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1
  return /^[\t ]*/.exec(text.slice(lineStart, offset))?.[0] ?? ''
}

export function layoutIndentUnit(indent: LayoutIndent = 2): string {
  return indent === 'tab' ? '\t' : ' '.repeat(indent)
}

export function layoutNewline(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n'
}
