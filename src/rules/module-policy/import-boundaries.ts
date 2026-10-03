import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { resolve, dirname } from 'node:path'
import { optionsFirst } from '../../utils/index.ts'
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
          packages: { type: 'string' },
          backendPackages: { type: 'array', items: { type: 'string' } },
          publicEntrypoints: { type: 'array', items: { type: 'string' } },
          appPackages: { type: 'array', items: { type: 'string' } },
          aliases: { type: 'object', additionalProperties: { type: 'string' } },
        },
        required: [
          'web',
          'backend',
          'packages',
          'backendPackages',
          'publicEntrypoints',
          'appPackages',
          'aliases',
        ],
      },
    ],
    messages: {
      boundary: '{{source}} violates the module boundary: {{reason}}.',
    },
  },
  createOnce(context) {
    function check(node: ESTree.Node, source: string, typeOnly: boolean) {
      const options = optionsFirst<ModuleBoundaryOptions>(context)
      const file = context.filename.replaceAll('\\', '/')
      const contains = (directory: string, candidate: string) =>
        candidate === directory || candidate.startsWith(`${directory}/`)
      const web = options.web.find((path) => contains(path, file))
      const backend = options.backend.find((path) => contains(path, file))
      const owner = web ?? backend
      const alias = Object.entries(options.aliases)
        .sort(([a], [b]) => b.length - a.length)
        .find(
          ([prefix]) => source === prefix || source.startsWith(`${prefix}/`),
        )
      const target = alias
        ? resolve(
            alias[1],
            source.slice(alias[0].length).replace(/^\//, ''),
          ).replaceAll('\\', '/')
        : source.startsWith('.')
          ? resolve(dirname(file), source).replaceAll('\\', '/')
          : source.startsWith('@/') && web
            ? `${web}/${source.slice(2)}`
            : source.startsWith('#/') && owner
              ? `${owner}/${source.slice(2)}`
              : source.startsWith('#services/') && owner
                ? `${owner}/services/${source.slice(10)}`
                : source
      const backendImport =
        options.backend.some((path) => contains(path, target)) ||
        options.backendPackages.some(
          (name) => source === name || source.startsWith(`${name}/`),
        )
      let reason: string | undefined
      if (web && backendImport && !options.publicEntrypoints.includes(source)) {
        reason = 'frontend code uses only public backend entry points'
      }
      if (
        options.packages &&
        contains(options.packages, file) &&
        (backendImport ||
          options.web.some((path) => contains(path, target)) ||
          options.appPackages.some(
            (name) => source === name || source.startsWith(`${name}/`),
          ))
      ) {
        reason = 'shared packages do not import app internals'
      }
      if (
        file.includes('/services/') &&
        /\/services\/service(?:\.ts)?$/.test(target) &&
        !typeOnly
      ) {
        reason =
          'service dependencies are injected rather than read from the registry'
      }
      if (
        /\.(?:types|constants)\.ts$/.test(file) &&
        !typeOnly &&
        /\/(?:core\/|services\/.*(?:\.(?:service|utils)|-(?:action|query)\.|\/(?:actions|queries)\/))/.test(
          target,
        )
      ) {
        reason =
          'domain types/constants use type-only imports from implementations'
      }
      if (
        file.endsWith('.client.ts') &&
        !typeOnly &&
        /^(react|react-dom)(\/|$)/.test(source)
      ) {
        reason = 'client services are React-free; use hooks for React behavior'
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
      ImportDeclaration(node) {
        check(
          node,
          node.source.value,
          node.importKind === 'type' ||
            (node.specifiers.length > 0 &&
              node.specifiers.every(
                (item) =>
                  item.type === 'ImportSpecifier' && item.importKind === 'type',
              )),
        )
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node, node.source.value, node.exportKind === 'type')
        }
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value, node.exportKind === 'type')
      },
      ImportExpression(node) {
        if (
          node.source.type === 'Literal' &&
          typeof node.source.value === 'string'
        ) {
          check(node, node.source.value, false)
        }
      },
    }
  },
})
