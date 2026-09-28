import type { Context } from '@oxlint/plugins'

export function optionsFirst<T>(context: Context, fallback?: T): T {
  return (context.options[0] ?? fallback) as unknown as T
}

export type OptionsPattern = string | string[]

export const optionsPatternSchema = {
  anyOf: [
    { type: 'string' },
    { type: 'array', items: { type: 'string' }, minItems: 1 },
  ],
}

/** Compiles a regex option that accepts one pattern or a list where any pattern may match. */
export function optionsPatterns(pattern: OptionsPattern | undefined, flags?: string): RegExp[] {
  return pattern === undefined ? [] : [pattern].flat().map(source => new RegExp(source, flags))
}

/** Like `optionsPatterns`, for options where an empty string has always meant "not set". */
export function optionsOptionalPatterns(pattern: OptionsPattern | undefined, flags?: string): RegExp[] {
  return optionsPatterns(pattern === undefined ? undefined : [pattern].flat().filter(source => source !== ''), flags)
}

export function optionsPatternLabel(pattern: OptionsPattern | undefined): string {
  return pattern === undefined ? '' : [pattern].flat().join(' | ')
}

export function optionsPatternsTest(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => {
    // Why: compiled patterns are reused across names, and `g`/`y` flags keep state in `lastIndex`.
    pattern.lastIndex = 0
    return pattern.test(value)
  })
}
