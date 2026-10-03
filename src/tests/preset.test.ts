import { afterAll, describe, expect, test } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  realpathSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tanstackStartReactModulesPreset } from '../presets/index.ts'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const temporary = realpathSync(mkdtempSync(resolve(tmpdir(), 'arch-preset-')))
const binary = resolve(repository, 'node_modules/oxlint/bin/oxlint')
let sequence = 0

afterAll(() => rmSync(temporary, { recursive: true, force: true }))

function fixture(
  options: string,
  files: Record<string, string>,
  print = false,
) {
  const root = resolve(temporary, String(sequence++))
  mkdirSync(root)
  symlinkSync(
    resolve(repository, 'node_modules'),
    resolve(root, 'node_modules'),
    'dir',
  )
  const allFiles = {
    'package.json': JSON.stringify({ name: '@fixture/workspace', private: true, type: 'module' }),
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ESNext',
        module: 'Preserve',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        skipLibCheck: true,
      },
      include: ['**/*.ts', '**/*.tsx'],
    }),
    'apps/server/package.json': JSON.stringify({
      name: '@fixture/server',
      type: 'module',
    }),
    'oxlint.config.ts': `import preset from ${JSON.stringify(resolve(repository, 'dist/presets/tanstack-start-react-modules-preset.js'))};\nexport default preset({ root: import.meta.dirname, tailwind: false, ${options} });\n`,
    ...files,
  }
  for (const [path, code] of Object.entries(allFiles)) {
    const destination = resolve(root, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, code)
  }
  const result = spawnSync(
    process.execPath,
    [
      binary,
      '-c',
      resolve(root, 'oxlint.config.ts'),
      ...(print
        ? ['--print-config']
        : [
            '--format',
            'json',
            ...Object.keys(files).filter((file) => /\.[cm]?tsx?$/.test(file)),
          ]),
    ],
    { cwd: root, encoding: 'utf8', timeout: 30_000 },
  )
  if (result.error) throw result.error
  if (
    result.stderr.includes('Failed to') ||
    result.stdout.startsWith('Failed to')
  )
    throw new Error(result.stdout + result.stderr)
  return { status: result.status, output: result.stdout + result.stderr, root }
}

describe('TanStack Start React modules preset', () => {
  test('ships the full default plugin configuration and type-aware mode', () => {
    const result = fixture(
      '',
      {
        'apps/server/src/types/user.types.ts':
          'export interface User { id: string; }\n',
      },
      true,
    )
    expect(result.status, result.output).toBe(0)
    const config = JSON.parse(result.output)
    expect(config.options.typeAware).toBe(true)
    expect(
      config.jsPlugins.some(
        (plugin: string | { name: string }) =>
          typeof plugin !== 'string' && plugin.name === 'react-extra',
      ),
    ).toBe(true)
    expect(config.rules['no-debugger']).toBe('deny')
  })

  test('default React, Tailwind and shadcn plugins lint a real component', () => {
    const result = fixture(
      "tailwind: { entryPoint: 'apps/web/src/application/styles.css' },",
      {
        'apps/web/src/application/styles.css': '@import "tailwindcss";\n',
        'apps/web/src/components/chat/chat-message.tsx':
          "export function ChatMessage() {\n  return <div className='flex'>Hello</div>;\n}\n",
      },
    )
    expect(result.status, result.output).toBe(0)
  })

  test('scripts can use console output and reasoned inline exceptions', () => {
    const result = fixture('', {
      'scripts/report.ts': "console.log('ready');\n",
    })
    expect(result.status, result.output).toBe(0)
    const reasoned = fixture('architecture: { web: false }, banTypes: false,', {
      'apps/server/src/lib/user.ts':
        '// oxlint-disable-next-line modules/shape-suffix -- Matches an external contract.\nexport interface UserShape {\n  id: string;\n}\n',
    })
    expect(reasoned.output).not.toContain('modules(shape-suffix)')
    expect(reasoned.output).not.toContain('reasoned-directives')
  })

  test('a valid backend mini project passes', () => {
    const result = fixture('architecture: { web: false },', {
      'apps/server/src/types/chat.types.ts':
        'export interface ChatSendParams {\n  text: string;\n}\n',
      'apps/server/src/services/chat/chat-action.send.ts':
        "import type { ChatSendParams } from '../../types/chat.types';\n\nexport function chatActionSend(params: ChatSendParams) {\n  if (!params.text) {\n    return 'empty';\n  }\n\n  return params.text.trim();\n}\n",
    })
    expect(result.status, result.output).toBe(0)
  })

  test('banTypes false removes the whole policy without disabling unknown checks', () => {
    const files = {
      'apps/server/src/lib/user.ts':
        'export interface User {\n  id: string;\n}\n',
    }
    expect(fixture('architecture: { web: false },', files).output).toContain(
      'no-type-declarations',
    )
    expect(
      fixture('architecture: { web: false }, banTypes: false,', files).output,
    ).not.toContain('no-type-declarations')
    expect(
      fixture('architecture: { web: false }, banTypes: false,', {
        'apps/server/src/lib/user.ts': 'export type User = unknown;\n',
      }).output,
    ).toContain('no-unknown')
  })

  test('policy callbacks and per-rule exclusions do not leak to other files', () => {
    const files = {
      'apps/server/src/lib/portable.ts':
        'export interface Portable {\n  id: string;\n}\n',
      'apps/server/src/lib/user.ts':
        'export interface User {\n  id: string;\n}\n',
    }
    const result = fixture(
      "architecture: { web: false }, banTypes: (current) => current.map((scope) => ({ ...scope, excludeFiles: [...(scope.excludeFiles ?? []), '**/portable.ts'] })),",
      files,
    )
    const parsed = JSON.parse(result.output)
    const diagnostics = parsed.diagnostics.filter((entry: { code: string }) =>
      entry.code.includes('no-type-declarations'),
    )
    expect(diagnostics).toHaveLength(1)
    expect(JSON.stringify(diagnostics)).toContain('user.ts')
    const excluded = fixture(
      "architecture: { web: false }, exclude: { 'arch/no-type-declarations': ['**/lib/**'] },",
      files,
    )
    expect(excluded.output).not.toContain('no-type-declarations')
  })

  test('warn level keeps options and a configurable architecture', () => {
    const result = fixture(
      "level: 'warn', architecture: { web: false, server: 'backend' },",
      { 'backend/src/lib/user.ts': 'export type User = unknown;\n' },
    )
    expect(result.status, result.output).toBe(0)
    expect(result.output).toContain('no-unknown')
    expect(result.output).not.toContain('"severity": "error"')
  })

  test('rejects deep service folders and extra private helpers', () => {
    const result = fixture('architecture: { web: false },', {
      'apps/server/src/services/chat/messages/chat-action.send.ts':
        'export function chatActionSend() {\n  return 1;\n}\n',
      'apps/server/src/services/chat/chat-action.read.ts':
        'function chatBuild() {\n  return 1;\n}\n\nexport function chatActionRead() {\n  return chatBuild() + 1;\n}\n',
    })
    expect(result.output).toContain('no-restricted-files')
    expect(result.output).toContain('service-functions')
  })

  test('type-only frontend imports cannot bypass backend boundaries', () => {
    const result = fixture('', {
      'apps/web/src/types/user.types.ts':
        "import type { User } from '../../../server/src/types/user.types';\n\nexport type UserId = User['id'];\n",
    })
    expect(result.output).toContain('import-boundaries')
  })

  test('React policies coexist with import boundaries and permit test IDs', () => {
    const result = fixture('', {
      'apps/web/src/components/chat/chat-message.tsx':
        "import { useMemo as cache } from 'react';\n\nexport function ChatMessage() {\n  return <div data-testid='message'>{cache(() => 'hello', [])}</div>;\n}\n",
    })
    expect(result.output).toContain('memoization')
    expect(result.output).not.toContain('Do not use data-testid')
  })

  test('valid shape words are allowed while the Shape suffix is rejected', () => {
    const result = fixture('architecture: { web: false }, banTypes: false,', {
      'apps/server/src/lib/image.ts':
        'export interface ImageShape {\n  width: number;\n}\n\nexport function reshapeImage() {\n  return 1;\n}\n',
    })
    const diagnostics = JSON.parse(result.output).diagnostics.filter(
      (entry: { code: string }) => entry.code.includes('shape-suffix'),
    )
    expect(diagnostics).toHaveLength(1)
  })

  test('native consumer overrides remain available', () => {
    const result = fixture('', {
      'oxlint.config.ts': `import { defineConfig } from 'oxlint';\nimport preset from ${JSON.stringify(resolve(repository, 'dist/presets/tanstack-start-react-modules-preset.js'))};\nexport default defineConfig({ options: { typeAware: true }, extends: [preset({ root: import.meta.dirname, architecture: { web: false }, tailwind: false })], overrides: [{ files: ['**/lib/**'], rules: { 'arch/no-type-declarations': 'off' } }] });\n`,
      'apps/server/src/lib/user.ts':
        'export interface User {\n  id: string;\n}\n',
    })
    expect(result.output).not.toContain('no-type-declarations')
  })

  test('construction does not mutate caller options or earlier results', () => {
    const options = {
      architecture: { web: false as const },
      ignorePatterns: ['vendor/**'],
    }
    const a = tanstackStartReactModulesPreset(options)
    a.ignorePatterns?.push('new/**')
    expect(
      tanstackStartReactModulesPreset(options).ignorePatterns,
    ).not.toContain('new/**')
    expect(options.ignorePatterns).toEqual(['vendor/**'])
  })

  test('the package export is available after building', () => {
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset'; console.log(typeof preset)",
      ],
      { cwd: repository, encoding: 'utf8' },
    )
    expect(output.trim()).toBe('function')
  })

  test('standalone frontend roots apply the same rules', () => {
    const result = fixture(
      "architecture: { web: '.', server: false, packages: false },",
      {
        'src/hooks/use-chat.ts':
          "import { useEffect } from 'react';\n\nexport function useChat() {\n  useEffect(() => {}, []);\n}\n",
      },
    )
    expect(result.output).toContain('empty-effect')
    const disabled = fixture(
      "architecture: { web: '.', server: false }, effects: false,",
      {
        'src/hooks/use-chat.ts':
          "import { useEffect } from 'react';\n\nexport function useChat() {\n  useEffect(() => {}, []);\n}\n",
      },
    )
    expect(disabled.output).not.toContain('empty-effect')
  })

  test('keeps exported props interfaces and rejects component-local aliases', () => {
    const result = fixture('', {
      'apps/web/src/components/chat/chat-message.tsx':
        'export interface ChatMessageProps {\n  text: string;\n}\n\nexport function ChatMessage({ text }: ChatMessageProps) {\n  return <div>{text}</div>;\n}\n',
    })
    expect(result.status, result.output).toBe(0)
    const invalid = fixture('', {
      'apps/web/src/components/chat/chat-message.tsx':
        "type ChatMessageStatus = 'idle' | 'busy';\n\nexport function ChatMessage() {\n  return <div>Hello</div>;\n}\n",
    })
    expect(invalid.output).toContain('local-type-alias')
  })

  test('requires output schemas only in configured public API scopes', () => {
    const code = 'export const chat = rpc.handler(() => 1);\n'
    const result = fixture(
      "architecture: { web: false }, publicApi: ['apps/server/src/rpc/public/**'],",
      {
        'apps/server/src/rpc/public/chat.ts': code,
        'apps/server/src/rpc/internal/chat.ts': code,
      },
    )
    const diagnostics = JSON.parse(result.output).diagnostics.filter(
      (entry: { code: string }) => entry.code.includes('require-orpc-output'),
    )
    expect(diagnostics).toHaveLength(1)
    expect(JSON.stringify(diagnostics)).toContain('public/chat.ts')
  })

  test('Dillon rules load under their attributed namespace', () => {
    const result = fixture('architecture: { web: false },', {
      'apps/server/src/services/chat/chat-action.send.ts':
        'export function chatActionSend() {\n  return Reflect.get({}, "id");\n}\n',
    })
    expect(result.output).toContain('dillon-anti-slop(no-reflect-get)')
  })

  test('custom import aliases preserve boundaries and approved entry points', () => {
    const result = fixture("aliases: { '@backend': 'apps/server/src' },", {
      'apps/web/src/types/chat.types.ts':
        "import type { Chat } from '@backend/types/chat.types';\n\nexport type ChatId = Chat['id'];\n",
      'apps/web/src/types/user.types.ts':
        "import type { User } from '@fixture/server/client';\n\nexport type UserId = User['id'];\n",
    })
    const diagnostics = JSON.parse(result.output).diagnostics.filter(
      (entry: { code: string }) => entry.code.includes('import-boundaries'),
    )
    expect(diagnostics).toHaveLength(1)
    expect(JSON.stringify(diagnostics)).toContain('chat.types.ts')
  })

  test('disabled naming and import policies do not retain their base rules', () => {
    const config = tanstackStartReactModulesPreset({
      naming: false,
      imports: false,
    })
    const rules = {
      ...config.rules,
      ...Object.assign({}, ...config.overrides!.map((entry) => entry.rules)),
    }
    expect(rules['unicorn/filename-case']).toBeUndefined()
    expect(rules['perfectionist/sort-imports']).toBeUndefined()
    expect(rules['perfectionist/sort-named-imports']).toBeUndefined()
  })
})
