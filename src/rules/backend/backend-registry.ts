import { defineRule } from '@oxlint/plugins'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { astReturnExpressions, astUnwrap } from '../../utils/ast.utils.ts'
import { declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { namingCamelCase } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type { BackendRegistryOptions } from '../../types/backend.types.ts'
import type { ESTree } from '@oxlint/plugins'

export const backendRegistry = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          registry: { type: 'string', minLength: 1 },
          services: { type: 'string', minLength: 1 },
          skip: { type: 'array', items: { type: 'string' } },
          object: { type: 'string', minLength: 1 },
        },
        required: ['registry', 'services'],
      },
    ],
    messages: {
      unregistered: "Register the {{folder}} service here under '{{key}}'.",
      missing: "Domain folder '{{folder}}' needs {{folder}}.service.ts; add it, or list the folder in skip.",
    },
  },
  createOnce(context) {
    let options: BackendRegistryOptions = { registry: '', services: '' }

    return {
      before() {
        options = optionsFirst<BackendRegistryOptions>(context)

        if (context.filename !== options.registry) {
          return false
        }
      },
      'Program:exit'(program) {
        const keys = new Set<string>()

        for (const statement of program.body) {
          const declaration = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration' ? statement.declaration : statement
          const named: [string | undefined, ESTree.Node | null | undefined][] = []

          if (declaration?.type === 'VariableDeclaration') {
            named.push(...declaration.declarations.map((item): [string | undefined, ESTree.Node | null] => [item.id.type === 'Identifier' ? item.id.name : undefined, item.init]))
          } else if (declaration?.type === 'FunctionDeclaration') {
            named.push([declaration.id?.name, declaration])
          } else if (declaration?.type === 'ObjectExpression') {
            named.push([undefined, declaration])
          }

          for (const [name, declared] of named) {
            const value = declared?.type === 'TSAsExpression' || declared?.type === 'TSSatisfiesExpression' ? astUnwrap(declared) : declared

            if (options.object !== undefined && name !== options.object) {
              continue
            }

            const objects = value?.type === 'ArrowFunctionExpression' || value?.type === 'FunctionExpression' || value?.type === 'FunctionDeclaration'
              ? astReturnExpressions(value).filter((expression) => expression.type === 'ObjectExpression')
              : [value].filter((expression) => expression?.type === 'ObjectExpression')

            for (const property of objects.flatMap((object) => object.properties)) {
              const key = declarationsPropertyName(property)

              if (key !== undefined) {
                keys.add(key)
              }
            }
          }
        }

        const entries = existsSync(options.services) ? readdirSync(options.services, { withFileTypes: true }) : []
        const domains = entries.filter((entry) => entry.isDirectory() && !(options.skip ?? []).includes(entry.name)).map((entry) => entry.name)

        for (const folder of domains) {
          const key = namingCamelCase(folder)

          if (!existsSync(join(options.services, folder, `${folder}.service.ts`))) {
            context.report({
              node: program,
              messageId: 'missing',
              data: { folder },
            })
          } else if (![key, `${key}s`, key.replace(/y$/, 'ies')].some((name) => keys.has(name))) {
            context.report({
              node: program,
              messageId: 'unregistered',
              data: { folder, key },
            })
          }
        }
      },
    }
  },
})
