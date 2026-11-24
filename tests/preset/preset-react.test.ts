import { describe, expect, it } from 'vitest'
import { testerPreset } from '../utils/tester.utils.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset React', () => {
  const manifest = (name: string, dependencies: Record<string, string>) => JSON.stringify({ name, dependencies })

  const aliasedWeb = JSON.stringify({
    name: 'web',
    dependencies: { '@tanstack/react-start': '1' },
    imports: { '#web/*': './src/*' },
  })

  const workspaces = JSON.stringify({ workspaces: ['apps/*', 'packages/*'] })
  const tailwind = '@import "tailwindcss";'
  const frontend = { 'package.json': workspaces, 'packages/frontend/package.json': manifest('@app/frontend', { react: '1', effect: '1' }), 'packages/frontend/src/link.tsx': '' }
  const pages = { 'package.json': workspaces, 'packages/frontend/package.json': manifest('@app/frontend', { react: '1' }) }
  const kits = { ...frontend, 'packages/ui/package.json': manifest('@app/ui', { react: '1' }), 'packages/ui/src/styles.css': tailwind }
  const web = { 'package.json': workspaces, 'apps/web/package.json': manifest('@app/web', { '@tanstack/react-start': '1', react: '1' }) }
  const vinextDependencies = { vinext: '1', react: '19', effect: '1' }
  const vinext = { 'package.json': workspaces, 'apps/web/package.json': manifest('web', vinextDependencies) }
  const expo = { 'package.json': workspaces, 'apps/mobile/package.json': manifest('mobile', { expo: '1', react: '1' }) }
  const kitTree = ['packages/ui/src/components/']
  const views = ['packages/frontend/src/pages/home/', 'packages/frontend/src/components/order/', 'packages/frontend/src/context/', 'packages/frontend/src/constants/']

  it.each<TesterPresetRow>([
    { name: 'a React package keeps components in TSX', tree: ['packages/frontend/src/pages/', 'packages/frontend/src/components/'], files: pages, folders: {}, file: 'packages/frontend/src/components/card.ts', rule: 'arch/files-restricted', expected: ['error', { message: 'Components use TSX; hooks use .ts files.' }] },
    { name: 'a React package keeps hooks in hooks', tree: ['packages/frontend/src/pages/', 'packages/frontend/src/lib/'], files: pages, folders: {}, file: 'packages/frontend/src/lib/use-cart.ts', rule: 'arch/files-restricted', expected: ['error', { message: 'Hooks belong in src/hooks.' }] },
    { name: 'a UI kit keeps hooks anywhere', tree: kitTree, files: kits, folders: {}, file: 'packages/ui/src/lib/use-mobile.ts', rule: 'arch/files-restricted', expected: undefined },
    { name: 'a React package owns contexts in context', tree: ['packages/frontend/src/pages/'], files: pages, folders: {}, file: 'packages/frontend/src/pages/home-page.tsx', rule: 'arch/boundaries-token-owner', expected: ['error', { restrictions: expect.arrayContaining([{ token: 'createContext', patterns: expect.arrayContaining(['packages/frontend/src/context/']) }]) }] },
    { name: 'a React package names client service exports after the file', tree: ['packages/frontend/src/pages/', 'packages/frontend/src/services/order/'], files: pages, folders: {}, file: 'packages/frontend/src/services/order/order.client.ts', rule: 'arch/naming-exports', expected: ['error', { stem: 'before-first-dot' }] },
    { name: 'a web hook exports the hook its file names', tree: ['apps/web/src/hooks/'], files: web, folders: {}, file: 'apps/web/src/hooks/use-cart.ts', rule: 'arch/naming-exports', expected: ['error', {}, expect.anything(), { mode: 'template', file: 'use-{name}.ts', export: ['use{Name}'] }, { mode: 'template', file: 'use-{name}.{platform}.ts', export: ['use{Name}'] }] },
    { name: 'layout false keeps the hook naming', tree: ['apps/web/src/hooks/'], files: web, folders: { 'apps/web': { layout: false } }, file: 'apps/web/src/hooks/use-cart.ts', rule: 'arch/naming-exports', expected: ['error', {}, expect.anything(), { mode: 'template', file: 'use-{name}.ts' }, expect.anything()] },
    { name: 'layout false drops the hook placement', tree: ['apps/web/src/lib/'], files: web, folders: { 'apps/web': { layout: false } }, file: 'apps/web/src/lib/use-cart.ts', rule: 'arch/files-restricted', expected: undefined },
    { name: 'an Expo hook keeps its platform suffix', tree: ['apps/mobile/src/hooks/'], files: expo, folders: {}, file: 'apps/mobile/src/hooks/use-cart.native.ts', rule: 'arch/naming-file', expected: ['error', { pattern: expect.stringContaining('(?:web|native|ios|android)') }] },
    { name: 'an Expo hook names its export without the platform', tree: ['apps/mobile/src/hooks/'], files: expo, folders: {}, file: 'apps/mobile/src/hooks/use-cart.native.ts', rule: 'arch/naming-exports', expected: expect.arrayContaining([{ mode: 'template', file: 'use-{name}.{platform}.ts', export: ['use{Name}'] }]) },
    { name: 'a UI kit hook may export an is-hook', tree: [...kitTree, 'packages/ui/src/hooks/'], files: kits, folders: {}, file: 'packages/ui/src/hooks/use-mobile.ts', rule: 'arch/naming-exports', expected: ['error', { mode: 'template', file: 'use-{name}.ts', export: ['use{Name}', 'useIs{Name}'] }, expect.anything()] },
    { name: 'a Vinext app page gets no frontend page rules', tree: ['apps/web/src/app/', 'apps/web/src/pages/'], files: vinext, folders: {}, file: 'apps/web/src/pages/index.tsx', rule: 'arch/files-exports', expected: undefined },
    { name: 'a Vinext component keeps its top level open', tree: ['apps/web/src/app/', 'apps/web/src/components/ui/'], files: vinext, folders: {}, file: 'apps/web/src/components/ui/button.tsx', rule: 'arch/files-top-level', expected: undefined },
    { name: 'a Vinext component may call use', tree: ['apps/web/src/app/', 'apps/web/src/components/'], files: vinext, folders: {}, file: 'apps/web/src/components/card.tsx', rule: 'arch/boundaries-deny', expected: ['error', { calls: expect.not.objectContaining({ use: expect.anything(), useContext: expect.anything() }) }] },
    { name: 'a TanStack component may import radix-ui', tree: ['apps/web/src/components/ui/'], files: web, folders: {}, file: 'apps/web/src/components/ui/dialog.tsx', rule: 'arch/boundaries-deny', expected: ['error', { imports: expect.not.objectContaining({ 'radix-ui': expect.anything() }) }] },
    { name: 'a frontend page exports the page its file names', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-exports', expected: ['error', { file: '{area}/{name}-page.tsx', names: ['{Name}Page'], types: true }] },
    { name: 'a frontend page takes prefixed props', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/react-props', expected: ['error', { prefix: true }] },
    { name: 'a frontend page holds only components', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-components-only', expected: ['error', { filename: true, types: true }] },
    { name: 'a frontend page keeps helpers in components', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-helpers', expected: ['error', { components: true, hooks: '^use[A-Z]' }] },
    { name: 'a frontend page takes its folder name as is', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/naming-folder', expected: ['error', { singularize: 'none', separators: ['-'] }] },
    { name: 'a frontend component defines no Schema', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/components/home/home-card.tsx', rule: 'arch/boundaries-deny', expected: ['error', { calls: expect.objectContaining({ 'Schema.Struct': expect.any(String) }) }] },
    { name: 'a frontend package encodes with a Schema', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/services/home.client.ts', rule: 'arch/boundaries-deny', expected: ['error', { calls: expect.objectContaining({ 'JSON.stringify': expect.any(String), parseInt: expect.any(String) }) }] },
    { name: 'a frontend page declares only props types', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/types-declarations', expected: ['error', { allow: 'Props$' }] },
    { name: 'a frontend page locks its top level', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'interface', { kind: 'function', names: '^{Stem}' }] }] },
    { name: 'a frontend page names its props interfaces', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/naming-declarations', expected: ['error', { kinds: ['interface'] }, { kinds: ['type', 'interface'], pattern: 'Props$' }] },
    { name: 'a frontend page is TSX', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home.ts', rule: 'arch/files-restricted', expected: ['error', { message: 'Pages use TSX.' }] },
    { name: 'a frontend component exports the component its file names', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/components/order/order-card.tsx', rule: 'arch/files-exports', expected: ['error', { file: '{area}/{name}.tsx', names: ['{Name}'], types: true }] },
    { name: 'a frontend component locks its top level', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/components/order/order-card.tsx', rule: 'arch/files-top-level', expected: ['error', { file: '{area}/{name}.tsx', allow: ['import', 'interface', { kind: 'function', names: '^{Name}' }, { kind: 'const', names: '^{Name}', from: '^(?:lazy|forwardRef|memo)$' }] }] },
    { name: 'a frontend component names its props interfaces', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/components/order/order-card.tsx', rule: 'arch/naming-declarations', expected: ['error', { kinds: ['interface'] }, { kinds: ['type', 'interface'], pattern: 'Props$' }] },
    { name: 'a frontend component reads context through use and storage through hooks', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/components/order/order-card.tsx', rule: 'arch/boundaries-deny', expected: ['error', { calls: { useContext: expect.any(String), 'localStorage.getItem': expect.any(String), 'localStorage.setItem': expect.any(String), 'sessionStorage.getItem': expect.any(String), 'sessionStorage.setItem': expect.any(String) } }] },
    { name: 'a frontend component may call use', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/components/order/order-card.tsx', rule: 'arch/boundaries-deny', expected: ['error', { calls: expect.not.objectContaining({ use: expect.anything() }) }] },
    { name: 'a frontend page reads context through use', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/boundaries-deny', expected: ['error', { calls: expect.objectContaining({ useContext: 'A page reads a context through its hook in hooks/, not useContext().' }) }] },
    { name: 'a frontend context file exports contexts', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/context/cart.ts', rule: 'arch/files-exports', expected: ['error', { patterns: ['[A-Z]\\w*Context$'], types: true }] },
    { name: 'a frontend context file reads context through use', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/context/cart.ts', rule: 'arch/boundaries-deny', expected: ['error', { calls: { useContext: expect.any(String) } }] },
    { name: 'a frontend context provider declares only props types', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/context/cart-provider.tsx', rule: 'arch/types-declarations', expected: ['error', { allow: 'Props$' }] },
    { name: 'a frontend constants file names its exports after the file', tree: views, files: frontend, folders: {}, file: 'packages/frontend/src/constants/order.constants.ts', rule: 'arch/files-exports', expected: ['error', { patterns: ['{STEM}(?!_{STEM}_)(?:_[A-Z0-9]+)*', '{Stem}(?!{Stem}[A-Z])[A-Z]\\w*'], types: true }] },
    { name: 'a frontend page rule turns off', tree: views, files: frontend, folders: { 'packages/frontend/src/pages/**/*.tsx': { rules: { 'arch/files-exports': 'off' } } }, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-exports', expected: 'off' },
    { name: 'a frontend component call ban turns off with false', tree: views, files: frontend, folders: { 'packages/frontend/src/components': { deny: { calls: { useContext: false } } } }, file: 'packages/frontend/src/components/order/order-card.tsx', rule: 'arch/boundaries-deny', expected: ['error', { calls: expect.not.objectContaining({ useContext: expect.anything() }) }] },
    { name: 'a frontend package without pages gets no page rules', files: frontend, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-exports', expected: undefined },
    { name: 'a React package without Effect gets no frontend page rules', tree: ['packages/frontend/src/pages/home/'], files: pages, folders: {}, file: 'packages/frontend/src/pages/home/home-page.tsx', rule: 'arch/files-exports', expected: undefined },
    {
      name: 'components reach no rpc client',
      tree: ['apps/web/src/components/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'apps/web/src/services/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/components/card.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: { '**/services/rpc.client{,.ts}': 'Components take data through props or hooks; only routes and services reach the rpc client.' } }],
    },
    {
      name: 'components reach no rpc client through the package alias',
      tree: ['apps/web/src/components/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': aliasedWeb, 'apps/web/src/services/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/components/card.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', expect.objectContaining({ imports: expect.objectContaining({ '#web/services/rpc.client{,.ts}': expect.any(String) }) })],
    },
    {
      name: 'routes reach the rpc client',
      tree: ['apps/web/src/components/', 'apps/web/src/routes/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'apps/web/src/services/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/routes/index.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: expect.not.objectContaining({ '**/services/rpc.client{,.ts}': expect.anything() }) }],
    },
    {
      name: 'Vinext app router pages reach the rpc client',
      tree: ['apps/web/src/components/', 'apps/web/src/app/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { vinext: '1', react: '19' }), 'apps/web/src/services/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/app/page.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: expect.not.objectContaining({ '**/services/rpc.client{,.ts}': expect.anything() }) }],
    },
    {
      name: 'Vinext pages router pages reach the rpc client',
      tree: ['apps/web/src/components/', 'apps/web/src/pages/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { vinext: '1', react: '19' }), 'apps/web/src/services/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/pages/index.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: expect.not.objectContaining({ '**/services/rpc.client{,.ts}': expect.anything() }) }],
    },
    {
      name: 'Vinext components reach no rpc client',
      tree: ['apps/web/src/components/', 'apps/web/src/app/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { vinext: '1', react: '19' }), 'apps/web/src/services/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/components/card.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: { '**/services/rpc.client{,.ts}': expect.any(String) } }],
    },
    {
      name: 'a domain rpc client is banned at its own path',
      tree: ['apps/web/src/components/', 'apps/web/src/services/order/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'apps/web/src/services/rpc/rpc.client.ts': '' },
      folders: {},
      file: 'apps/web/src/components/card.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: { '**/services/rpc/rpc.client{,.ts}': expect.any(String) } }],
    },
    {
      name: 'the components rpc client ban turns off with false',
      tree: ['apps/web/src/components/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'apps/web/src/services/rpc.client.ts': '' },
      folders: { 'apps/web/src/components': { deny: { imports: { '**/services/rpc.client{,.ts}': false } } } },
      file: 'apps/web/src/components/card.tsx',
      rule: 'arch/boundaries-deny',
      expected: expect.not.arrayContaining([expect.objectContaining({ imports: expect.objectContaining({ '**/services/rpc.client{,.ts}': expect.any(String) }) })]),
    },
    {
      name: 'a web app without an rpc client bans nothing in components',
      tree: ['apps/web/src/components/'],
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }) },
      folders: {},
      file: 'apps/web/src/components/card.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: expect.not.objectContaining({ '**/services/rpc.client{,.ts}': expect.anything() }) }],
    },
  ])('$name', (row) => {
    expect({ value: testerPreset(row) }).toMatchObject({ value: row.expected })
  })
})
