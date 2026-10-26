import { defineRule } from '@oxlint/plugins'
import { basename, resolve } from 'node:path'
import { astIsTypeOnlyImport } from '../../utils/ast.utils.ts'
import {
  boundariesExportVisitors,
  boundariesLiteralSource,
  boundariesMatchesImport,
  boundariesResolveTarget,
} from '../../utils/boundaries.utils.ts'
import { exportsCollect } from '../../utils/exports.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BoundariesImport, BoundariesOptions } from '../../types/boundaries.types.ts'
import type { ESTree } from '@oxlint/plugins'

const boundariesPublicSurface = /\.(?:service|client|server|rsc|utils)$/
const boundariesActionOrQuery = /\/(?:[^/]+)-(?:action|query)\./

function boundariesContains(directory: string, candidate: string): boolean {
  return candidate === directory || candidate.startsWith(`${directory}/`)
}

function boundariesStripExtension(path: string): string {
  return path.replace(/\.[cm]?[jt]sx?$/, '')
}

function boundariesDomain(path: string, appRoot: string): string | undefined {
  const relative = path.slice(appRoot.length + 1)

  if (relative.startsWith('types/') && relative.endsWith('.types.ts')) {
    return relative.slice('types/'.length).split('.')[0]
  }

  if (!relative.startsWith('services/')) {
    return undefined
  }

  const parts = relative.slice('services/'.length).split('/')
  return parts.length > 1 ? parts[0] : parts[0].split('.')[0].replace(/-(?:action|query|driver)$/, '')
}

function boundariesPrivateDomain({ options, file, target, reExport, roots, owner }: BoundariesImport): string | undefined {
  const roles = options.roles

  if (!roles?.length) {
    return undefined
  }

  const targetOwner = roots.find((path) => boundariesContains(path, target))
  const fileDomain = owner ? boundariesDomain(file, owner) : undefined
  const targetDomain = targetOwner ? boundariesDomain(target, targetOwner) : undefined
  const sameDomain = owner && owner === targetOwner && fileDomain && fileDomain === targetDomain
  const targetStem = boundariesStripExtension(target)
  const publicSurface = boundariesPublicSurface.test(targetStem) && !boundariesActionOrQuery.test(targetStem)

  const privateTarget =
    roles.some((role) => targetStem.endsWith(`.${role}`)) ||
    (targetDomain && !publicSurface && !/\.(?:types|constants)$/.test(targetStem))

  if (!privateTarget) {
    return undefined
  }

  if (reExport && /\.(?:service|client|server|rsc|utils)\.ts$/.test(file) && !boundariesActionOrQuery.test(file)) {
    return 'public service and utility surfaces must not re-export private domain internals'
  }

  return sameDomain ? undefined : 'private domain files stay in the same domain and application; use its service API or shared utilities'
}

function boundariesPortableLib(check: BoundariesImport): string | undefined {
  const { options, file, source, target, typeOnly, reExport, roots, web, backendImport } = check

  if (!options.portable || !web || !boundariesContains(`${web}/lib`, file)) {
    return undefined
  }

  const portableTarget = target.startsWith('/') ? resolve(target).replaceAll('\\', '/') : target
  const appService = roots.some((path) => boundariesContains(`${path}/services`, portableTarget))
  const backendTarget = options.backend.some((path) => boundariesContains(path, portableTarget))
  const appPackage = boundariesMatchesImport(options.appPackages, source)

  if (backendImport || backendTarget || appService || appPackage) {
    return 'portable frontend lib does not import application services or application APIs'
  }

  const appType = roots.some((path) => boundariesContains(`${path}/types`, portableTarget))
  const stem = boundariesStripExtension(basename(file)).replace(/\.utils$/, '')
  const ownType = typeOnly && !reExport && boundariesStripExtension(portableTarget) === `${web}/types/${stem}.types`

  if (appType && !ownType) {
    return `portable frontend lib may only type-import its own contract '${web}/types/${stem}.types.ts'; app type re-exports are forbidden`
  }

  return undefined
}

const boundariesImportsDefaults: BoundariesOptions = { web: [], backend: [], packages: [], backendPackages: [], appPackages: [], aliases: {}, entrypoints: [] }

export const boundariesImports = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          web: { type: 'array', items: { type: 'string' } },
          backend: { type: 'array', items: { type: 'string' } },
          packages: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          roles: { type: 'array', items: { type: 'string' } },
          portable: { type: 'boolean' },
          backendPackages: { type: 'array', items: { type: 'string' } },
          entrypoints: { type: 'array', items: { type: 'string' } },
          appPackages: { type: 'array', items: { type: 'string' } },
          uiPackages: { type: 'array', items: { type: 'string' } },
          aliases: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    ],
    messages: {
      boundary: '{{source}} violates the module boundary: {{reason}}.',
    },
  },
  createOnce(context) {
    function check(node: ESTree.Node, source: string, typeOnly: boolean, reExport = false): void {
      const options = { ...boundariesImportsDefaults, ...optionsFirst<Partial<BoundariesOptions>>(context) }
      const file = context.filename.replaceAll('\\', '/')
      const roots = [...options.web, ...options.backend].sort((a, b) => b.length - a.length)
      const owner = roots.find((path) => boundariesContains(path, file))
      const target = boundariesResolveTarget(options, file, source)
      const web = owner && options.web.includes(owner) ? owner : undefined

      const backendImport =
        options.backend.some((path) => boundariesContains(path, target)) || boundariesMatchesImport(options.backendPackages, source)

      const imported: BoundariesImport = { options, file, source, target, typeOnly, reExport, roots, owner, web, backendImport }
      const inPackage = [options.packages].flat().some((path) => path && boundariesContains(path, file))

      const appTarget =
        backendImport || options.web.some((path) => boundariesContains(path, target)) || boundariesMatchesImport(options.appPackages, source)

      const domainContract =
        /\.(?:types|constants)\.ts$/.test(file) &&
        !typeOnly &&
        /\/(?:core\/|services\/.*(?:\.(?:service|utils)|-(?:action|query)\.|\/(?:actions|queries)\/))/.test(target)

      const reason = [
        web && backendImport && !options.entrypoints.includes(source) ? 'frontend code uses only public backend entry points' : undefined,
        inPackage && appTarget ? 'shared packages do not import app internals' : undefined,
        file.includes('/services/') && /\/services\/service(?:\.ts)?$/.test(target) && !typeOnly
          ? 'service dependencies are injected rather than read from the registry'
          : undefined,
        domainContract ? 'domain types/constants use type-only imports from implementations' : undefined,
        file.endsWith('.client.ts') && !typeOnly && boundariesMatchesImport(options.uiPackages ?? ['react', 'react-dom'], source)
          ? 'client services are React-free; use hooks for React behavior'
          : undefined,
        boundariesPrivateDomain(imported),
        boundariesPortableLib(imported),
      ].findLast((candidate) => candidate !== undefined)

      if (reason) {
        context.report({
          node,
          messageId: 'boundary',
          data: { source, reason },
        })
      }
    }

    return {
      Program(program) {
        const exported = new Set(
          exportsCollect(program)
            .filter((binding) => !binding.reExport)
            .map((binding) => binding.localName),
        )

        for (const statement of program.body) {
          if (statement.type !== 'ImportDeclaration') {
            continue
          }

          for (const specifier of statement.specifiers) {
            if (!exported.has(specifier.local.name)) {
              continue
            }

            const typeOnly = statement.importKind === 'type' || (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
            check(specifier, statement.source.value, typeOnly, true)
          }
        }
      },
      ImportDeclaration(node) {
        check(node, node.source.value, astIsTypeOnlyImport(node))
      },
      ...boundariesExportVisitors(check),
      ImportExpression(node) {
        const source = boundariesLiteralSource(node)

        if (source !== undefined) {
          check(node, source, false)
        }
      },
      TSImportType(node) {
        const { portable: portableLib, web } = { ...boundariesImportsDefaults, ...optionsFirst<Partial<BoundariesOptions>>(context) }
        const file = context.filename.replaceAll('\\', '/')

        if (portableLib && web.some((path) => file.startsWith(`${path}/lib/`))) {
          check(node, node.source.value, true)
        }
      },
    }
  },
})
