import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { resolve, basename } from 'node:path'
import { optionsFirst, exportsCollect, boundaryResolveTarget } from '../../utils/index.ts'
import type { ModuleBoundaryOptions } from '../../types/module-policy.types.ts'

/** Reject imports across configured application boundaries, including type-only imports. */
export const importBoundaries = defineRule({
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
          fileRoles: { type: 'array', items: { type: 'string' } },
          portableLib: { type: 'boolean' },
          backendPackages: { type: 'array', items: { type: 'string' } },
          publicEntrypoints: { type: 'array', items: { type: 'string' } },
          appPackages: { type: 'array', items: { type: 'string' } },
          aliases: { type: 'object', additionalProperties: { type: 'string' } },
        },
        required: ['web', 'backend', 'packages', 'backendPackages', 'publicEntrypoints', 'appPackages', 'aliases'],
      },
    ],
    messages: {
      boundary: '{{source}} violates the module boundary: {{reason}}.',
    },
  },
  createOnce(context) {
    function check(node: ESTree.Node, source: string, typeOnly: boolean, reExport = false) {
      const options = optionsFirst<ModuleBoundaryOptions>(context)
      const file = context.filename.replaceAll('\\', '/')
      const contains = (directory: string, candidate: string) =>
        candidate === directory || candidate.startsWith(`${directory}/`)
      const roots = [...options.web, ...options.backend].sort((a, b) => b.length - a.length)
      const owner = roots.find((path) => contains(path, file))
      const web = owner && options.web.includes(owner) ? owner : undefined
      const target = boundaryResolveTarget(options, file, source)
      const backendImport =
        options.backend.some((path) => contains(path, target)) ||
        options.backendPackages.some((name) => source === name || source.startsWith(`${name}/`))
      let reason: string | undefined
      if (web && backendImport && !options.publicEntrypoints.includes(source)) {
        reason = 'frontend code uses only public backend entry points'
      }
      if (
        (Array.isArray(options.packages) ? options.packages : [options.packages]).some(
          (path) => path && contains(path, file),
        ) &&
        (backendImport ||
          options.web.some((path) => contains(path, target)) ||
          options.appPackages.some((name) => source === name || source.startsWith(`${name}/`)))
      ) {
        reason = 'shared packages do not import app internals'
      }
      if (file.includes('/services/') && /\/services\/service(?:\.ts)?$/.test(target) && !typeOnly) {
        reason = 'service dependencies are injected rather than read from the registry'
      }
      if (
        /\.(?:types|constants)\.ts$/.test(file) &&
        !typeOnly &&
        /\/(?:core\/|services\/.*(?:\.(?:service|utils)|-(?:action|query)\.|\/(?:actions|queries)\/))/.test(target)
      ) {
        reason = 'domain types/constants use type-only imports from implementations'
      }
      if (file.endsWith('.client.ts') && !typeOnly && /^(react|react-dom)(\/|$)/.test(source)) {
        reason = 'client services are React-free; use hooks for React behavior'
      }
      if (options.fileRoles?.length) {
        const targetOwner = roots.find((path) => contains(path, target))
        const domain = (path: string, appRoot: string) => {
          const relative = path.slice(appRoot.length + 1)
          if (relative.startsWith('types/') && relative.endsWith('.types.ts'))
            return relative.slice('types/'.length).split('.')[0]
          if (!relative.startsWith('services/')) return undefined
          const parts = relative.slice('services/'.length).split('/')
          return parts.length > 1 ? parts[0] : parts[0].split('.')[0].replace(/-(?:action|query|driver)$/, '')
        }
        const sameDomain =
          owner &&
          targetOwner &&
          owner === targetOwner &&
          domain(file, owner) &&
          domain(file, owner) === domain(target, targetOwner)
        const targetStem = target.replace(/\.[cm]?[jt]sx?$/, '')
        const concept = options.fileRoles.some((role) => targetStem.endsWith(`.${role}`))
        const publicSurface =
          /\.(?:service|client|server|rsc|utils)$/.test(targetStem) &&
          !/\/(?:[^/]+)-(?:action|query)\./.test(targetStem)
        const privateTarget =
          concept ||
          (targetOwner && domain(target, targetOwner) && !publicSurface && !/\.(?:types|constants)$/.test(targetStem))
        if (privateTarget && !sameDomain) {
          reason =
            'private domain files stay in the same domain and application; use its service API or shared utilities'
        }
        if (
          privateTarget &&
          reExport &&
          /\.(?:service|client|server|rsc|utils)\.ts$/.test(file) &&
          !/\/(?:[^/]+)-(?:action|query)\./.test(file)
        ) {
          reason = 'public service and utility surfaces must not re-export private domain internals'
        }
      }
      if (options.portableLib && web && contains(`${web}/lib`, file)) {
        const portableTarget = target.startsWith('/') ? resolve(target).replaceAll('\\', '/') : target
        const appService = roots.some((path) => contains(`${path}/services`, portableTarget))
        const backendTarget = options.backend.some((path) => contains(path, portableTarget))
        const appPackage = options.appPackages.some((name) => source === name || source.startsWith(`${name}/`))
        const appType = roots.some((path) => contains(`${path}/types`, portableTarget))
        const stem = basename(file)
          .replace(/\.[cm]?[jt]sx?$/, '')
          .replace(/\.utils$/, '')
        const ownType =
          typeOnly && !reExport && portableTarget.replace(/\.[cm]?[jt]sx?$/, '') === `${web}/types/${stem}.types`
        if (backendImport || backendTarget || appService || appPackage) {
          reason = 'portable frontend lib does not import application services or application APIs'
        } else if (appType && !ownType) {
          reason = `portable frontend lib may only type-import its own contract '${web}/types/${stem}.types.ts'; app type re-exports are forbidden`
        }
      }
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
          if (statement.type !== 'ImportDeclaration') continue
          for (const specifier of statement.specifiers) {
            if (exported.has(specifier.local.name))
              check(
                specifier,
                statement.source.value,
                statement.importKind === 'type' ||
                  (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'),
                true,
              )
          }
        }
      },
      ImportDeclaration(node) {
        check(
          node,
          node.source.value,
          node.importKind === 'type' ||
            (node.specifiers.length > 0 &&
              node.specifiers.every((item) => item.type === 'ImportSpecifier' && item.importKind === 'type')),
        )
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node, node.source.value, node.exportKind === 'type', true)
        }
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value, node.exportKind === 'type', true)
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
          check(node, node.source.value, false)
        }
      },
      TSImportType(node) {
        const options = optionsFirst<ModuleBoundaryOptions>(context)
        const file = context.filename.replaceAll('\\', '/')
        if (options.portableLib && options.web.some((path) => file.startsWith(`${path}/lib/`))) {
          check(node, node.source.value, true)
        }
      },
    }
  },
})
