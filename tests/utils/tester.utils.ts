import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, matchesGlob, resolve } from 'node:path'
import { RuleTester } from 'oxlint/plugins-dev'
import { preset } from '../../src/preset/preset.ts'
import type * as TesterTypes from '../types/tester.types.ts'
import type { Rule } from '@oxlint/plugins'

const testerTool = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })

export function testerRun(rule: Rule, { name, code, filename = 'file.tsx', files, options, output, errors }: TesterTypes.TesterRow): void {
  const root = files ? mkdtempSync(join(tmpdir(), 'arch-test-')) : ''

  for (const [path, text] of Object.entries(files ? { ...files, [filename]: code } : {})) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text ?? '')
  }

  const valid: RuleTester.ValidTestCase = { code, filename: join(root, filename) }

  if (options !== undefined) {
    const rooted: TesterTypes.TesterOption[] = JSON.parse(JSON.stringify([options].flat()).replaceAll('<root>', JSON.stringify(root).slice(1, -1)))

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

export function testerPreset({ tree, files, symlinks, link, folders, detect, file, rule }: TesterTypes.TesterPresetRow): TesterTypes.TesterPresetValue {
  const base = tree || files ? mkdtempSync(join(tmpdir(), 'arch-preset-')) : resolve(import.meta.dirname, '../..')
  const linked = `${base}-link`

  try {
    for (const path of tree ?? []) {
      mkdirSync(join(base, path), { recursive: true })
    }

    for (const [path, content] of Object.entries(files ?? {})) {
      mkdirSync(dirname(join(base, path)), { recursive: true })
      writeFileSync(join(base, path), content)
    }

    for (const [path, target] of Object.entries(symlinks ?? {})) {
      mkdirSync(dirname(join(base, path)), { recursive: true })
      symlinkSync(target, join(base, path))
    }

    if (link) {
      symlinkSync(base, linked)
    }

    const config = preset({
      root: link ? linked : base,
      folders,
      detect,
    })

    const testerMatches = (globs: string[] | undefined) => (globs ?? []).some((glob) => matchesGlob(file, glob))
    const rules = { ...config.rules }

    for (const override of config.overrides ?? []) {
      if (testerMatches(override.files) && !testerMatches(override.excludeFiles)) {
        Object.assign(rules, override.rules)
      }
    }

    return testerMatches(config.ignorePatterns) ? 'ignored' : rules[rule]
  } finally {
    if (tree || files) {
      rmSync(base, { recursive: true, force: true })
      rmSync(linked, { force: true })
    }
  }
}
