import { afterAll, describe, expect, test } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { OxlintOverride } from 'oxlint'
import type { PresetFixtureOutput } from './types/preset-fixture.types.ts'
import { nextReactModulesPreset, reactModulesPreset, tanstackStartReactModulesPreset } from '../presets/index.ts'
import { presetResolveContext } from '../services/preset-context.ts'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const temporary = realpathSync(mkdtempSync(resolve(tmpdir(), 'arch-next-preset-')))
const binary = resolve(repository, 'node_modules/oxlint/bin/oxlint')
let sequence = 0

afterAll(() => rmSync(temporary, { recursive: true, force: true }))

function fixture(files: Record<string, string>, presetOptions = 'tailwind: false') {
  const root = resolve(temporary, String(sequence++))
  mkdirSync(root)
  symlinkSync(resolve(repository, 'node_modules'), resolve(root, 'node_modules'), 'dir')
  const allFiles = {
    'package.json': JSON.stringify({ name: '@fixture/workspace', private: true, type: 'module' }),
    'tsconfig.json': JSON.stringify({
      compilerOptions: { strict: true, target: 'ESNext', module: 'Preserve', moduleResolution: 'Bundler', jsx: 'react-jsx', skipLibCheck: true },
      include: ['**/*.ts', '**/*.tsx'],
    }),
    'oxlint.config.ts': `import preset from ${JSON.stringify(resolve(repository, 'dist/presets/next-react-modules-preset.js'))};\nexport default preset({ root: import.meta.dirname, ${presetOptions}, architecture: { site: 'web' } });\n`,
    ...files,
  }
  for (const [path, code] of Object.entries(allFiles)) {
    const destination = resolve(root, path)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, code)
  }
  const result = spawnSync(
    process.execPath,
    [binary, '-c', resolve(root, 'oxlint.config.ts'), '--format', 'json', ...Object.keys(files)],
    { cwd: root, encoding: 'utf8', timeout: 30_000, env: { ...process.env, FORCE_COLOR: '0' } },
  )
  if (result.error) throw result.error
  const output: PresetFixtureOutput = JSON.parse(result.stdout)
  return (file: string) =>
    output.diagnostics.filter((entry) => entry.filename === file).map((entry) => entry.code)
}

function overridesWith(config: ReturnType<typeof reactModulesPreset>, rule: string): OxlintOverride[] {
  return (config.overrides ?? []).filter((entry) => entry.rules && rule in entry.rules)
}

describe('Next React modules preset', () => {
  test('the TanStack preset and the generic default stay identical to the TanStack framework', () => {
    const options = { root: repository, tailwind: false } as const
    expect(tanstackStartReactModulesPreset(options)).toEqual(reactModulesPreset(options))
    expect(reactModulesPreset(options)).toEqual(reactModulesPreset({ ...options, framework: 'tanstack-start' }))
  })

  test('Next roots get App Router route policies and the Next runtime rule instead of TanStack ones', () => {
    const config = nextReactModulesPreset({ root: repository, tailwind: false, architecture: { 'apps/site': 'web', 'apps/api': 'server' } })
    expect(overridesWith(config, 'modules/tanstack-runtime')).toEqual([])
    expect(overridesWith(config, 'modules/next-runtime').flatMap((entry) => entry.files)).toEqual([
      'apps/site/src/services/**/*.{ts,tsx}',
      'apps/site/src/lib/**/*.{ts,tsx}',
    ])
    expect(overridesWith(config, 'arch/route-surface').flatMap((entry) => entry.files)).toEqual([
      'apps/site/src/app/**/{page,template,default,not-found,forbidden,unauthorized,loading}.tsx',
      'apps/site/src/app/**/{layout,global-not-found}.tsx',
      'apps/site/src/app/not-found.tsx',
      'apps/site/src/app/**/route.ts',
    ])
    expect(config.ignorePatterns).toEqual(expect.arrayContaining(['**/.next/**', '**/next-env.d.ts']))
  })

  test('a monorepo can mix frameworks per web root', () => {
    const config = reactModulesPreset({
      root: repository,
      tailwind: false,
      architecture: {
        'apps/dashboard': { role: 'web', framework: 'tanstack-start' },
        'apps/site': { role: 'web', framework: 'next' },
        'apps/api': 'server',
      },
    })
    expect(overridesWith(config, 'modules/tanstack-runtime').flatMap((entry) => entry.files)).toEqual([
      'apps/dashboard/src/services/**/*.{ts,tsx}',
      'apps/dashboard/src/lib/**/*.{ts,tsx}',
    ])
    expect(overridesWith(config, 'modules/next-runtime').flatMap((entry) => entry.files)).toEqual([
      'apps/site/src/services/**/*.{ts,tsx}',
      'apps/site/src/lib/**/*.{ts,tsx}',
    ])
    expect(overridesWith(config, 'arch/route-surface').flatMap((entry) => entry.files)).toEqual(
      expect.arrayContaining(['apps/dashboard/src/routes/**/*.{ts,tsx}', 'apps/site/src/app/**/route.ts']),
    )
  })

  test('framework validation and the default stylesheet follow each root', () => {
    expect(() => reactModulesPreset({ root: repository, architecture: { api: { role: 'server', framework: 'next' } } })).toThrow(
      'Only web architecture roots accept a framework.',
    )
    expect(() =>
      reactModulesPreset({ root: repository, architecture: { site: { role: 'web', framework: 'remix' as 'next' } } }),
    ).toThrow('Unknown framework: remix')
    const context = presetResolveContext({
      root: repository,
      architecture: { site: { role: 'web', framework: 'next' }, admin: 'web' },
    })
    expect(context.css).toEqual({
      'site/src': resolve(repository, 'site/src/app/globals.css'),
      'admin/src': resolve(repository, 'admin/src/application/styles.css'),
    })
  })

  test('App Router files and services are checked by the real CLI', () => {
    const page = 'site/src/app/page.tsx'
    const host = 'site/src/app/about/page.tsx'
    const layout = 'site/src/app/layout.tsx'
    const route = 'site/src/app/api/route.ts'
    const feed = 'site/src/app/feed/route.ts'
    const rootNotFound = 'site/src/app/not-found.tsx'
    const nestedNotFound = 'site/src/app/blog/not-found.tsx'
    const client = 'site/src/services/chat/chat.client.ts'
    const server = 'site/src/services/chat/chat.server.ts'
    const diagnostics = fixture({
      [page]:
        "import { HomePage } from '@/components/home-page'\nexport async function generateMetadata() { return { title: 'Home' } }\nexport default function Page() { return <HomePage /> }\n",
      [host]: 'export default function Page() { return <main>About</main> }\n',
      [layout]:
        "import type { ReactNode } from 'react'\ninterface LayoutProps { children: ReactNode }\nexport default function Layout({ children }: LayoutProps) { return <html lang=\"pt\"><body>{children}</body></html> }\n",
      [route]: "function routeHeaders() { return { 'cache-control': 'no-store' } }\nexport function GET() { return Response.json({ ok: true }, { headers: routeHeaders() }) }\n",
      [feed]: "export function generateStaticParams() { return [{ locale: 'pt' }] }\nexport function GET() { return new Response('ok') }\n",
      [rootNotFound]: "export default function NotFound() { return <html lang=\"pt\"><body>Not found</body></html> }\n",
      [nestedNotFound]: 'export default function NotFound() { return <p>Not found</p> }\n',
      [client]: "import { cookies } from 'next/headers'\nexport async function chatSession() { return (await cookies()).get('session') }\n",
      [server]: "import { cookies } from 'next/headers'\nexport async function chatSession() { return (await cookies()).get('session') }\n",
    })
    expect(diagnostics(page)).not.toContain('arch(route-surface)')
    expect(diagnostics(host)).toContain('arch(route-surface)')
    expect(diagnostics(layout)).not.toContain('arch(route-surface)')
    expect(diagnostics(route)).toContain('arch(no-file-level-helpers)')
    expect(diagnostics(feed)).not.toContain('arch(no-file-level-helpers)')
    expect(diagnostics(rootNotFound)).not.toContain('arch(route-surface)')
    expect(diagnostics(nestedNotFound)).toContain('arch(route-surface)')
    expect(diagnostics(client)).toContain('modules(next-runtime)')
    expect(diagnostics(server)).not.toContain('modules(next-runtime)')
  })

  test('web roots without a backend own their schemas in types/', () => {
    const types = 'site/src/types/post.types.ts'
    const service = 'site/src/services/post/post.utils.ts'
    const diagnostics = fixture({
      [types]: "import { z } from 'zod'\nexport const PostSchema = z.object({ title: z.string() })\nexport type Post = z.infer<typeof PostSchema>\n",
      [service]: "import { z } from 'zod'\nexport const postTitle = z.string().parse('Hello')\n",
    })
    expect(diagnostics(types)).not.toContain('arch(no-local-schema-construction)')
    expect(diagnostics(types)).not.toContain('arch(no-runtime-in-types)')
    expect(diagnostics(service)).toContain('arch(no-local-schema-construction)')
  })

  test('illustration files may use palette values but keep the type scale', () => {
    const art = 'site/src/components/promo/promo-scene.illustration.tsx'
    const page = 'site/src/components/promo/promo-banner.tsx'
    const code = (name: string, classes: string) => `export function ${name}() { return <div className="${classes}" /> }\n`
    const diagnostics = fixture({
      'site/src/app/globals.css': '@import "tailwindcss";\n',
      [art]: code('PromoScene', 'bg-[#f2e7da] text-[#435e3d]'),
      [page]: code('PromoBanner', 'bg-[#f2e7da]'),
      'site/src/components/promo/promo-label.illustration.tsx': code('PromoLabel', 'text-[9px]'),
    }, "tailwind: { cssEntryPointsByRoot: { site: 'site/src/app/globals.css' } }")
    expect(diagnostics(art)).not.toContain('shadcn(no-arbitrary-values)')
    expect(diagnostics(art)).not.toContain('arch(only-export-components)')
    expect(diagnostics(page)).toContain('shadcn(no-arbitrary-values)')
    expect(diagnostics('site/src/components/promo/promo-label.illustration.tsx')).toContain('shadcn(no-arbitrary-values)')
  })
})
