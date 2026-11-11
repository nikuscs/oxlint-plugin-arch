import { existsSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { presetRecipes } from './preset-recipes.ts'
import { presetQueryWrites } from './preset.constants.ts'
import { presetFilled, presetIsDirectory, presetMerge, presetSource } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetEffectQueryWrites = Object.fromEntries(presetQueryWrites.map((name) => [name, 'A queries file only reads; write in an actions file.']))

const presetEffectWorkflowCalls = Object.fromEntries(
  ['selectFrom', ...presetQueryWrites].map((name) => [name, 'A workflow reaches data through its domain service, not the database.']),
)

const presetEffectFrameworks = Object.fromEntries(
  ['@tanstack/*', 'react-dom', 'react-dom/**', 'next', 'next/**', 'vite'].map((name) => [name, 'The server imports no web framework.']),
)

function presetEffectDomains(root: string, key: string, value: boolean | PresetTypes.PresetFolder): boolean {
  return value instanceof Object && Boolean(value.effect) && presetIsDirectory(resolve(root, presetSource(root, key, value.source), 'domains'))
}

export function presetEffectServers(root: string, merged: PresetTypes.PresetFolders, units: [string, boolean | PresetTypes.PresetFolder][]): void {
  for (const unit of units) {
    if (presetEffectDomains(root, unit[0], unit[1])) {
      unit[1] = presetMerge({ ...presetRecipes.backend, services: 'domains' }, unit[1])
      merged[unit[0]] = unit[1]
    }
  }
}

export function presetEffectConventions(root: string, key: string, value: PresetTypes.PresetFolder): PresetTypes.PresetFolders {
  const source = posix.relative(key, presetSource(root, key, value.source)) || '.'
  const at = (path: string) => (source === '.' ? path : posix.join(source, path))

  if (!presetEffectDomains(root, key, value)) {
    return {}
  }

  const exists = (path: string) => {
    const segments = path.split('/')
    const wildcard = segments.findIndex((segment) => segment.includes('*'))

    return existsSync(resolve(root, key, ...(wildcard === -1 ? segments : segments.slice(0, wildcard))))
  }

  return presetFilled({
    [at('.')]: {
      deny: { imports: { ...presetEffectFrameworks, 'effect/Config': 'Read config only in application/app.config.ts.' } },
      rules: {
        'arch/types-declarations': ['error', { modules: true }],
        'arch/types-inline': ['error', { variables: true, assertions: true, arguments: true }],
        'arch/types-service': 'off',
      },
    },
    [at('domains')]: {
      layout: {
        files: [
          '*.actions.ts',
          '*.queries.ts',
          '*.layer.ts',
          '*.workflows.ts',
          '*.prompts.ts',
          '*-*.driver.ts',
          '!*.service.ts',
          '!*.client.ts',
          '!*.server.ts',
          '!*.rsc.ts',
          '!*.rsc.tsx',
          '!*.utils.ts',
          '!*.types.ts',
          '!*.handler.ts',
          '!*-action.*.ts',
          '!*-query.*.ts',
        ],
      },
      deny: { imports: { '../*/*.constants{,.ts}': "Another domain's constants stay in that domain." } },
      rules: { 'arch/naming-exports': 'off' },
    },
    [at('domains/*/*.actions.ts')]: {
      limits: { lines: 1000 },
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Action[A-Z]\\w*'], types: true }] },
    },
    [at('domains/*/*.queries.ts')]: {
      limits: { lines: 1000 },
      deny: { calls: presetEffectQueryWrites, imports: { './*.actions{,.ts}': 'A queries file imports no actions.' } },
      rules: { 'arch/files-exports': ['error', { stem: 'folder', patterns: ['{domain}Query[A-Z]\\w*'], types: true }] },
    },
    [at('domains/*/*.layer.ts')]: { rules: { 'arch/effect-layer-file': 'error' } },
    [at('domains/*/*.driver.ts')]: { rules: { 'arch/effect-layer-file': 'error' } },
    [at('domains/*/*.workflows.ts')]: {
      deny: {
        calls: presetEffectWorkflowCalls,
        imports: {
          '**/database': 'A workflow reaches data through its domain service, not the database.',
          './*.{actions,queries}{,.ts}': 'A workflow calls its domain service, not its own actions or queries.',
        },
      },
    },
    [at('application/app.config.ts')]: { deny: { imports: { 'effect/Config': false } } },
    [at('application/app.ts')]: {
      deny: { imports: { '**/domains/*/*.{actions,queries,prompts,constants,driver}{,.ts}': 'The application imports only layer and workflows files.' } },
      rules: { 'arch/boundaries-imports': 'off' },
    },
    [at('**/*.tsx')]: { rules: { 'arch/files-restricted': ['error', { message: 'Mail templates in mails/ are the only JSX on a server.' }] } },
    [at('mails/*.mail.tsx')]: { rules: { 'arch/files-restricted': 'off' } },
    [at('rpc')]: { rules: { 'arch/code-delegate': 'error' } },
  }, exists)
}
