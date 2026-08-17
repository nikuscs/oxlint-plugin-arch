import type { Context } from '@oxlint/plugins'

export function optionsFirst<T>(context: Context, fallback?: T): T {
  return (context.options[0] ?? fallback) as unknown as T
}
