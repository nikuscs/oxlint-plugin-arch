import { test } from 'vitest'
import { filenameExportName } from '../rules/filename-export-name.ts'
import { createRuleTester } from './rule-tester.ts'

const actionOptions = [{
  file: '{domain}-action.{name}.ts',
  export: 'make{Domain}Action{Name}',
}]
const hookOptions = [{
  file: 'use-{name}.ts',
  export: 'use{Name}',
  mode: 'some',
}]
const error = { messageId: 'mismatch' }

test('filename-export-name', () => {
  createRuleTester().run(
    'arch/filename-export-name',
    filenameExportName,
    {
      valid: [
        {
          filename: '/repo/actions/persona-action.identity-sheet-generate.ts',
          code: 'export function makePersonaActionIdentitySheetGenerate() {}',
          options: actionOptions,
        },
        {
          filename: '/repo/hooks/use-realtime-event.ts',
          code: 'export function useRealtimeEvent() {}\nexport function useGenerationEvent() {}',
          options: hookOptions,
        },
        {
          filename: '/repo/hooks/use-theme.ts',
          code: 'export function useTheme() {}\nexport const ThemeContext = {}',
          options: hookOptions,
        },
        {
          filename: '/repo/actions/not-an-action.ts',
          code: 'export function anything() {}',
          options: actionOptions,
        },
      ],
      invalid: [
        {
          filename: '/repo/actions/persona-action.generate.ts',
          code: 'export function makeWrongFactory() {}',
          options: actionOptions,
          errors: [error],
        },
        {
          filename: '/repo/hooks/use-thing.ts',
          code: 'export function useOther() {}',
          options: hookOptions,
          errors: [error],
        },
      ],
    },
  )
})
