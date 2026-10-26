import type { OptionsPattern, OptionsSchema } from '../types/options.types.ts'
import type { Context } from '@oxlint/plugins'

class OptionsError extends Error {}

export const optionsPatternSchema: OptionsSchema = {
  anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }],
}

export function optionsFirst<T>(context: Context, fallback?: T): T {
  // SAFETY: Oxlint validates options against meta.schema before create runs.
  return (context.options[0] ?? fallback) as T
}

export function optionsAll<T>(context: Context): T[] {
  // SAFETY: Oxlint validates options against meta.schema before create runs.
  return context.options as T[]
}

export function optionsPatterns(pattern: OptionsPattern | undefined, flags?: string): RegExp[] {
  return optionsPatternsWithEmpty(pattern === undefined ? undefined : [pattern].flat().filter((source) => source !== ''), flags)
}

export function optionsPatternsWithEmpty(pattern: OptionsPattern | undefined, flags?: string): RegExp[] {
  return pattern === undefined ? [] : [pattern].flat().map((source) => new RegExp(source, flags))
}

export function optionsPatternsTest(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => {
    pattern.lastIndex = 0
    return pattern.test(value)
  })
}

export function optionsGlob(pattern: string): RegExp {
  const source = pattern
    .replaceAll(/[.+^$()|[\]\\]/g, '\\$&')
    .replaceAll('?', '[^/]')
    .replaceAll('**/', '\u0000')
    .replaceAll('**', '\u0001')
    .replaceAll('*', '[^/]*')
    .replaceAll('\u0000', '(?:.*/)?')
    .replaceAll('\u0001', '.*')
    .replaceAll(/\{([^}]*)\}/g, (_, options: string) => `(?:${options.split(',').join('|')})`)

  return new RegExp(`^${source}$`)
}

export function optionsPatternLabel(pattern: OptionsPattern | undefined): string {
  return pattern === undefined ? '' : [pattern].flat().filter((source) => source !== '').join(' | ')
}

export function optionsAssertMockingApis(patterns: string[]): void {
  if (patterns.some((pattern) => !/^(?:\*|(?:vi|jest|\*)\.(?:[A-Za-z_$][\w$]*|\*))$/.test(pattern))) {
    throw new OptionsError('Test mocking APIs must be `*` or `<vi|jest|*>.<method|*>`.')
  }
}
