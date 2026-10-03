import { afterAll, beforeAll, expect, test } from 'vitest'
import { mkdtempSync, realpathSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import type { PresetFixtureExpectation, PresetFixtureResult } from './types/preset-fixture.types.ts'
import { presetFixtureRun } from './support/preset-fixture.ts'

const temporary = realpathSync(mkdtempSync(resolve(tmpdir(), 'arch-checked-fixtures-')))

afterAll(() => rmSync(temporary, { recursive: true, force: true }))

test('complete monorepo fixture passes lint and TypeScript', () => {
  const result = presetFixtureRun('valid', temporary)
  expect(result.output.diagnostics).toEqual([])
  expect(result.status).toBe(0)
  expect(result.output.number_of_files).toBe(19)

  const typecheck = spawnSync(process.execPath, [resolve(import.meta.dirname, '../../node_modules/typescript/bin/tsc'), '--noEmit'], { cwd: result.root, encoding: 'utf8', timeout: 30_000 })
  expect(typecheck.status, typecheck.stdout + typecheck.stderr).toBe(0)
}, 60_000)

const expectations: PresetFixtureExpectation[] = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../tests/fixtures/tanstack-start-react-modules/expectations.json'), 'utf8'))
let invalid: PresetFixtureResult

beforeAll(() => {
  invalid = presetFixtureRun('invalid', temporary)
  expect(invalid.status).toBe(1)
  expect(invalid.output.diagnostics.some((diagnostic) => diagnostic.code.startsWith('oxc-parser'))).toBe(false)
}, 60_000)

test.each(expectations)('$name (Q$decisions)', (entry) => {
  const diagnostics = invalid.output.diagnostics.filter((diagnostic) => diagnostic.filename === entry.file)
  const rules = diagnostics.map((diagnostic) => diagnostic.code.replace(/^([^()]+)\(([^)]+)\)$/, '$1/$2'))
  expect(rules, JSON.stringify(diagnostics, null, 2)).toEqual(expect.arrayContaining(entry.rules))

  for (const rule of entry.absent ?? []) {
    expect(rules).not.toContain(rule)
  }
})

test('consumer config keeps callbacks and exclusions narrow, supports false policies and warning level', () => {
  const result = presetFixtureRun('customized', temporary)
  expect(result.status).toBe(0)
  expect(result.output.diagnostics).toHaveLength(1)
  expect(result.output.diagnostics[0]).toMatchObject({
    filename: 'apps/server/src/types/control.types.ts',
    code: 'modules(no-unknown)',
    severity: 'warning',
  })
}, 60_000)
