import { afterAll, beforeAll, expect, test } from 'vitest'
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { presetFixtureRun } from './support/preset-fixture.ts'
import { presetCoverageFiles, presetCoverageInventory, presetCoverageRule } from './support/preset-coverage.ts'
import type { PresetFixtureResult, PresetRuleFixture } from './types/preset-fixture.types.ts'

const temporary = realpathSync(mkdtempSync(resolve(tmpdir(), 'arch-rule-coverage-')))
const manifest: PresetRuleFixture[] = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, '../../tests/fixtures/tanstack-start-react-modules/rule-coverage.json'),
    'utf8',
  ),
)
const scanned = new Map<string, Set<string>>()
const projects = new Map<string, PresetFixtureResult>()

afterAll(() => rmSync(temporary, { recursive: true, force: true }))

beforeAll(() => {
  for (const project of new Set(manifest.flatMap((entry) => [entry.pass.project, entry.fail.project]))) {
    const result = presetFixtureRun(project, temporary)
    expect(result.status).toBe(1)
    expect(
      result.output.diagnostics.filter((diagnostic) => !diagnostic.code || diagnostic.code.startsWith('oxc-parser')),
    ).toEqual([])
    projects.set(project, result)
    scanned.set(project, presetCoverageFiles(result.root))
  }
}, 120_000)

test('every enabled rule, including implicit Oxlint defaults, has both fixture assertions', () => {
  const result = projects.get('rules-pass')!
  const inventory = presetCoverageInventory(result.root)
  const covered = manifest.map((entry) => entry.rule).sort()
  expect(covered).toEqual(inventory)
  expect(new Set(covered).size).toBe(covered.length)
})

for (const entry of manifest) {
  for (const kind of ['pass', 'fail'] as const) {
    test(`${entry.rule}: ${kind}`, () => {
      const fixture = entry[kind]
      const result = projects.get(fixture.project)!
      const diagnostics = result.output.diagnostics.filter((diagnostic) => diagnostic.filename === fixture.file)
      const rules = diagnostics.map((diagnostic) => presetCoverageRule(diagnostic.code))
      expect(scanned.get(fixture.project)).toContain(fixture.file)

      if (kind === 'fail') {
        expect(rules, JSON.stringify(diagnostics, null, 2)).toContain(entry.rule)
      } else {
        expect(rules, JSON.stringify(diagnostics, null, 2)).not.toContain(entry.rule)
      }
    })
  }
}
