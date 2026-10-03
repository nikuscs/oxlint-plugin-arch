import { spawnSync } from 'node:child_process'
import {
  closeSync,
  cpSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  symlinkSync,
} from 'node:fs'
import { resolve } from 'node:path'
import type { PresetFixtureResult } from '../types/preset-fixture.types.ts'

const repository = resolve(import.meta.dirname, '../../..')
const fixtures = resolve(repository, 'tests/fixtures/tanstack-start-react-modules')

export function presetFixtureRun(project: string, temporary: string): PresetFixtureResult {
  const root = resolve(temporary, project)
  cpSync(resolve(fixtures, 'valid'), root, { recursive: true })

  if (project !== 'valid') {
    cpSync(resolve(fixtures, project), root, { recursive: true })
  }

  mkdirSync(resolve(root, 'node_modules'))

  for (const entry of readdirSync(resolve(repository, 'node_modules'))) {
    symlinkSync(resolve(repository, 'node_modules', entry), resolve(root, 'node_modules', entry), 'dir')
  }

  symlinkSync(repository, resolve(root, 'node_modules/oxlint-plugin-arch'), 'dir')
  mkdirSync(resolve(root, 'node_modules/@fixture'))

  const workspaces = {
    server: 'apps/server',
    web: 'apps/web',
    runner: 'apps/runner',
    logger: 'packages/logger',
  }

  for (const [name, directory] of Object.entries(workspaces)) {
    symlinkSync(resolve(root, directory), resolve(root, 'node_modules/@fixture', name), 'dir')
  }

  const outputPath = resolve(root, 'lint-results.json')
  const outputFile = openSync(outputPath, 'w')
  const result = spawnSync(process.execPath, [
    resolve(repository, 'node_modules/oxlint/bin/oxlint'),
    '-c', 'oxlint.config.ts', '--format', 'json', 'apps', 'packages', 'scripts',
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60_000,
    stdio: ['ignore', outputFile, 'pipe'],
  })

  closeSync(outputFile)
  const output = readFileSync(outputPath, 'utf8')

  if (result.error || !output.trim().startsWith('{')) {
    throw result.error ?? new Error(result.stderr + output)
  }

  return { root, status: result.status, output: JSON.parse(output) }
}
