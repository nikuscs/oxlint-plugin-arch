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
import { optionsEscape, optionsFirst } from '../../utils/options.utils.ts'
import type { BoundariesConventions, BoundariesImport, BoundariesOptions } from '../../types/boundaries.types.ts'
import type { ESTree } from '@oxlint/plugins'

const boundariesSurfaces = ['service', 'client', 'server', 'rsc', 'utils']

const boundariesConventions: Required<BoundariesConventions> = {
  services: 'services',
  registry: 'service',
  types: 'types',
  lib: 'lib',
  contracts: ['types', 'constants'],
  implementations: ['service', 'utils'],
  implementationFolders: ['core'],
  operations: ['action', 'query'],
  operationFolders: ['actions', 'queries'],
  domainFiles: ['action', 'query', 'driver'],
  clients: ['client'],
}

function boundariesAny(values: readonly string[]): string {
  return values.length === 0 ? '(?!)' : `(?:${values.map(optionsEscape).join('|')})`
}

function boundariesIsOperation(conventions: Required<BoundariesConventions>, path: string): boolean {
  return new RegExp(`/[^/]+-${boundariesAny(conventions.operations)}\\.`).test(path)
}

function boundariesContains(directory: string, candidate: string): boolean {
  return candidate === directory || candidate.startsWith(`${directory}/`)
}

function boundariesIsSurface(options: BoundariesOptions, stem: string): boolean {
  return (options.surfaces ?? boundariesSurfaces).some((surface) => stem.endsWith(`.${surface}`))
}

function boundariesStripExtension(path: string): string {
  return path.replace(/\.[cm]?[jt]sx?$/, '')
}

function boundariesConventionsOf(options: BoundariesOptions): Required<BoundariesConventions> {
  return { ...boundariesConventions, ...options.conventions }
}

function boundariesServiceFolder(options: BoundariesOptions, root: string): string {
  const nested = [...options.web, ...options.backend].filter((other) => other.length > root.length && boundariesContains(root, other))

  return (
    options.services?.find((folder) => folder.startsWith(`${root}/`) && !nested.some((other) => boundariesContains(other, folder))) ??
    `${root}/${boundariesConventionsOf(options).services}`
  )
}

function boundariesDomain(conventions: Required<BoundariesConventions>, path: string, appRoot: string, services: string): string | undefined {
  const relative = path.slice(appRoot.length + 1)

  if (relative.startsWith(`${conventions.types}/`) && relative.endsWith(`.${conventions.types}.ts`)) {
    return relative.slice(conventions.types.length + 1).split('.')[0]
  }

  if (!boundariesContains(services, path) || path === services) {
    return undefined
  }

  const parts = path.slice(services.length + 1).split('/')
  return parts.length > 1 ? parts[0] : parts[0].split('.')[0].replace(new RegExp(`-${boundariesAny(conventions.domainFiles)}$`), '')
}

function boundariesPrivateDomain({ options, file, target, reExport, roots, owner }: BoundariesImport): string | undefined {
  const roles = options.roles
  const conventions = boundariesConventionsOf(options)

  if (!roles?.length) {
    return undefined
  }

  const targetOwner = roots.find((path) => boundariesContains(path, target))
  const fileDomain = owner ? boundariesDomain(conventions, file, owner, boundariesServiceFolder(options, owner)) : undefined
  const targetDomain = targetOwner ? boundariesDomain(conventions, target, targetOwner, boundariesServiceFolder(options, targetOwner)) : undefined
  const sameDomain = owner && owner === targetOwner && fileDomain && fileDomain === targetDomain
  const targetStem = boundariesStripExtension(target)
  const publicSurface = boundariesIsSurface(options, targetStem) && !boundariesIsOperation(conventions, targetStem)

  const privateTarget =
    roles.some((role) => targetStem.endsWith(`.${role}`)) ||
    (targetDomain && !publicSurface && !new RegExp(`\\.${boundariesAny(conventions.contracts)}$`).test(targetStem))

  if (!privateTarget) {
    return undefined
  }

  if (reExport && file.endsWith('.ts') && boundariesIsSurface(options, file.slice(0, -'.ts'.length)) && !boundariesIsOperation(conventions, file)) {
    return 'public service and utility surfaces must not re-export private domain internals'
  }

  return sameDomain ? undefined : 'private domain files stay in the same domain and application; use its service API or shared utilities'
}

function boundariesPortableFolder(options: BoundariesOptions): string | undefined {
  if (!options.portable) {
    return undefined
  }

  return typeof options.portable === 'string' ? options.portable : boundariesConventionsOf(options).lib
}

function boundariesPortableLib(check: BoundariesImport): string | undefined {
  const { options, file, source, target, typeOnly, reExport, roots, web, backendImport } = check
  const { types } = boundariesConventionsOf(options)
  const lib = boundariesPortableFolder(options)

  if (!lib || !web || !boundariesContains(`${web}/${lib}`, file) || boundariesServiceFolder(options, web) === `${web}/${lib}`) {
    return undefined
  }

  const portableTarget = target.startsWith('/') ? resolve(target).replaceAll('\\', '/') : target
  const appService = roots.some((path) => boundariesContains(boundariesServiceFolder(options, path), portableTarget))
  const backendTarget = options.backend.some((path) => boundariesContains(path, portableTarget))
  const appPackage = boundariesMatchesImport(options.appPackages, source)

  if (backendImport || backendTarget || appService || appPackage) {
    return 'portable frontend lib does not import application services or application APIs'
  }

  const appType = roots.some((path) => boundariesContains(`${path}/${types}`, portableTarget))
  const stem = boundariesStripExtension(basename(file)).replace(/\.utils$/, '')
  const ownType = typeOnly && !reExport && boundariesStripExtension(portableTarget) === `${web}/${types}/${stem}.${types}`

  if (appType && !ownType) {
    return `portable frontend lib may only type-import its own contract '${web}/${types}/${stem}.${types}.ts'; app type re-exports are forbidden`
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
          surfaces: { type: 'array', items: { type: 'string', minLength: 1 }, default: boundariesSurfaces },
          services: { type: 'array', items: { type: 'string' } },
          portable: { anyOf: [{ type: 'boolean' }, { type: 'string', minLength: 1 }] },
          conventions: {
            type: 'object',
            additionalProperties: false,
            properties: {
              services: { type: 'string', minLength: 1 },
              registry: { type: 'string', minLength: 1 },
              types: { type: 'string', minLength: 1 },
              lib: { type: 'string', minLength: 1 },
              contracts: { type: 'array', items: { type: 'string', minLength: 1 } },
              implementations: { type: 'array', items: { type: 'string', minLength: 1 } },
              implementationFolders: { type: 'array', items: { type: 'string', minLength: 1 } },
              operations: { type: 'array', items: { type: 'string', minLength: 1 } },
              operationFolders: { type: 'array', items: { type: 'string', minLength: 1 } },
              domainFiles: { type: 'array', items: { type: 'string', minLength: 1 } },
              clients: { type: 'array', items: { type: 'string', minLength: 1 } },
            },
          },
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
      const conventions = boundariesConventionsOf(options)
      const target = boundariesResolveTarget(options, file, source, conventions.services)
      const web = owner && options.web.includes(owner) ? owner : undefined

      const backendImport =
        options.backend.some((path) => boundariesContains(path, target)) || boundariesMatchesImport(options.backendPackages, source)

      const imported: BoundariesImport = { options, file, source, target, typeOnly, reExport, roots, owner, web, backendImport }
      const inPackage = [options.packages].flat().some((path) => path && boundariesContains(path, file))

      const appTarget =
        backendImport || options.web.some((path) => boundariesContains(path, target)) || boundariesMatchesImport(options.appPackages, source)

      const serviceFolders = roots.map((path) => boundariesServiceFolder(options, path))
      const serviceTarget = serviceFolders.find((folder) => boundariesContains(folder, target))
      const serviceFile = serviceFolders.find((folder) => boundariesContains(folder, file))

      const implementation = `(?:\\.${boundariesAny(conventions.implementations)}|-${boundariesAny(conventions.operations)}\\.|/${boundariesAny(conventions.operationFolders)}/)`
      const services = optionsEscape(conventions.services)

      const domainContract =
        new RegExp(`\\.${boundariesAny(conventions.contracts)}\\.ts$`).test(file) &&
        !typeOnly &&
        (new RegExp(`/(?:${boundariesAny(conventions.implementationFolders)}/|${services}/.*${implementation})`).test(target) ||
          (serviceTarget !== undefined && new RegExp(`/.*${implementation}`).test(target.slice(serviceTarget.length))))

      const registry = `/${optionsEscape(conventions.registry)}(?:\\.ts)?$`

      const reason = [
        web && backendImport && !options.entrypoints.includes(source) ? 'frontend code uses only public backend entry points' : undefined,
        inPackage && appTarget ? 'shared packages do not import app internals' : undefined,
        ((file.includes(`/${conventions.services}/`) && new RegExp(`/${services}${registry}`).test(target)) ||
          (serviceFile !== undefined && new RegExp(`^${registry}`).test(target.slice(serviceFile.length)))) &&
        !typeOnly
          ? 'service dependencies are injected rather than read from the registry'
          : undefined,
        domainContract ? 'domain types/constants use type-only imports from implementations' : undefined,
        conventions.clients.some((client) => file.endsWith(`.${client}.ts`)) && !typeOnly && boundariesMatchesImport(options.uiPackages ?? ['react', 'react-dom'], source)
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
        const options = { ...boundariesImportsDefaults, ...optionsFirst<Partial<BoundariesOptions>>(context) }
        const file = context.filename.replaceAll('\\', '/')

        const lib = boundariesPortableFolder(options)

        if (lib && options.web.some((path) => file.startsWith(`${path}/${lib}/`) && boundariesServiceFolder(options, path) !== `${path}/${lib}`)) {
          check(node, node.source.value, true)
        }
      },
    }
  },
})
