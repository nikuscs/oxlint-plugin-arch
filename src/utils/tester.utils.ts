import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
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
    const rooted: TesterOption[] = JSON.parse(JSON.stringify([options].flat()).replaceAll('<root>', root))

    valid.options = rooted
  }

  if (!errors) {
    testerTool.run(name, rule, { valid: [valid], invalid: [] })
    return
  }

  const invalid: RuleTester.InvalidTestCase = { ...valid, errors: errors.map((messageId) => ({ messageId })) }

  if (output !== undefined) {
    invalid.output = output
  }

  testerTool.run(name, rule, { valid: [], invalid: [invalid] })
}
