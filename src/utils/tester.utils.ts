import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { RuleTester } from 'oxlint/plugins-dev'
import type { TesterOption, TesterRow } from '../types/tester.types.ts'
import type { Rule } from '@oxlint/plugins'

const testerTool = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })

export function testerRun(rule: Rule, { name, code, filename = 'file.tsx', files, options, output, errors }: TesterRow): void {
  const root = files ? mkdtempSync(join(tmpdir(), 'arch-test-')) : ''

  for (const [path, text] of Object.entries(files ? { ...files, [filename]: code } : {})) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text ?? '')
  }

  const valid: RuleTester.ValidTestCase = { code, filename: join(root, filename) }

  if (options !== undefined) {
    const rooted: TesterOption[] = JSON.parse(JSON.stringify([options].flat()).replaceAll('<root>', JSON.stringify(root).slice(1, -1)))

    valid.options = rooted
  }

  const invalid: RuleTester.InvalidTestCase = {
    ...valid,
    errors: (errors ?? []).map((error) => (/\s/.test(error) ? { message: error } : { messageId: error })),
  }

  if (output !== undefined) {
    invalid.output = output
  }

  try {
    testerTool.run(name, rule, errors ? { valid: [], invalid: [invalid] } : { valid: [valid], invalid: [] })
  } finally {
    if (root) {
      rmSync(root, { recursive: true, force: true })
    }
  }
}
