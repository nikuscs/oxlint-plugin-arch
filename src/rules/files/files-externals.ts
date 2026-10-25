import { defineRule } from '@oxlint/plugins'
import { existsSync, readFileSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join } from 'node:path'
import { declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { namingBasename } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsGlob } from '../../utils/options.utils.ts'
import type { FilesExternalsManifest, FilesExternalsOptions } from '../../types/files.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const filesExternals = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          packages: { type: 'array', items: { type: 'string', minLength: 1 } },
        },
      },
    ],
    messages: {
      undeclared: "'{{name}}' is external but not a dependency in package.json, so the server build cannot load it.",
      missing: "Add '{{name}}' to the externals; it breaks when bundled.",
    },
  },
  createOnce(context) {
    function check(list: ESTree.ArrayExpression) {
      let folder = dirname(context.filename)

      while (!existsSync(join(folder, 'package.json')) && dirname(folder) !== folder) {
        folder = dirname(folder)
      }

      let dependencies: string[]

      try {
        const manifest: FilesExternalsManifest = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'))

        dependencies = [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.optionalDependencies ?? {})]
      } catch {
        return
      }

      const listed = new Set<string>()
      let dynamic = false

      for (const element of list.elements) {
        if (element?.type !== 'Literal' || typeof element.value !== 'string') {
          dynamic ||= element !== null
          continue
        }

        const name = element.value
        const root = name.split('/').slice(0, name.startsWith('@') ? 2 : 1).join('/')

        listed.add(name)

        if (!/^(?:node|bun):/.test(name) && !builtinModules.includes(root) && !dependencies.includes(root)) {
          context.report({
            node: element,
            messageId: 'undeclared',
            data: { name },
          })
        }
      }

      if (dynamic) {
        return
      }

      const packages = (optionsFirst<FilesExternalsOptions>(context, {}).packages ?? []).map(optionsGlob)

      for (const name of dependencies) {
        if (!listed.has(name) && packages.some((pattern) => pattern.test(name))) {
          context.report({
            node: list,
            messageId: 'missing',
            data: { name },
          })
        }
      }
    }

    return {
      before() {
        if (!/^(?:vite|next)\.config\.[cm]?[jt]s$/.test(namingBasename(context.filename))) {
          return false
        }
      },
      ObjectExpression(node) {
        for (const property of node.properties) {
          const key = declarationsPropertyName(property)

          if (property.type !== 'Property' || key === undefined) {
            continue
          }

          if (key === 'serverExternalPackages' && property.value.type === 'ArrayExpression') {
            check(property.value)
          }

          if (key !== 'ssr' || property.value.type !== 'ObjectExpression') {
            continue
          }

          const external = property.value.properties.find((candidate) => declarationsPropertyName(candidate) === 'external')

          if (external?.type === 'Property' && external.value.type === 'ArrayExpression') {
            check(external.value)
          }
        }
      },
    }
  },
})
