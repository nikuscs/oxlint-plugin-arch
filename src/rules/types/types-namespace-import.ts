import { defineRule } from '@oxlint/plugins'
import { namingBasename, namingPascalCase } from '../../utils/naming.utils.ts'
import { optionsFirst } from '../../utils/options.utils.ts'
import type * as TypesTypes from '../../types/types.types.ts'
import type { ESTree } from '@oxlint/plugins'

const bindingName = /^[A-Za-z_$][\w$]*$/

const reservedNames = new Set(
  'await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield implements interface let package private protected public static arguments eval'.split(
    ' ',
  ),
)

export const typesNamespaceImport = defineRule({
  meta: {
    type: 'suggestion',
    fixable: 'code',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          max: { type: 'integer', minimum: 0 },
          names: { type: 'object', additionalProperties: { type: 'string', pattern: bindingName.source } },
        },
      },
    ],
    defaultOptions: [{ max: 3, names: {} }],
    messages: {
      namespace: "Use `import type * as {{name}} from '{{source}}'` for {{count}} type imports (max {{max}}); keep exported domain names.{{reason}}",
    },
  },
  createOnce(context) {
    const imports: ESTree.ImportDeclaration[] = []
    return {
      before() {
        imports.length = 0
      },
      ImportDeclaration(node) {
        imports.push(node)
      },
      'Program:exit'() {
        const { max, names } = optionsFirst<TypesTypes.TypesNamespaceImportOptions>(context)

        const candidates = imports.filter(
          (node) =>
            node.specifiers.length > max &&
            node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && (node.importKind === 'type' || specifier.importKind === 'type')),
        )

        if (candidates.length === 0) {
          return
        }

        const sourceCode = context.sourceCode
        const occupied = new Set<string>()

        for (const scope of sourceCode.scopeManager.scopes) {
          for (const variable of scope.variables) {
            occupied.add(variable.name)
          }

          for (const reference of scope.references) {
            occupied.add(reference.identifier.name)
          }
        }

        const proposed = candidates.map((node) => {
          const source = node.source.value

          if (Object.hasOwn(names, source)) {
            return names[source]
          }

          const stem = namingBasename(source).replace(/(?:\.d)?\.[cm]?[jt]sx?$/i, '')
          const name = namingPascalCase(stem.replace(/[^A-Za-z0-9_$.-]/g, '-')) || 'Module'
          const prefixed = /^\d/.test(name) ? `Module${name}` : name
          return prefixed.endsWith('Types') ? prefixed : `${prefixed}Types`
        })

        const reports: TypesTypes.TypesNamespaceCandidate[] = []
        const edits: TypesTypes.TypesNamespaceEdit[] = []

        for (const [index, node] of candidates.entries()) {
          const name = proposed[index]
          const variables = sourceCode.getDeclaredVariables(node)
          const nodeEdits: TypesTypes.TypesNamespaceEdit[] = [{ range: [node.range[0], node.source.range[0]], text: `import type * as ${name} from ` }]

          const skipReasons: [boolean, string][] = [
            [!bindingName.test(name) || reservedNames.has(name), 'invalid namespace binding'],
            [
              imports.some(
                (other) =>
                  other.source.value === node.source.value && other.specifiers.some((specifier) => specifier.type === 'ImportNamespaceSpecifier'),
              ),
              'existing namespace import from this module',
            ],
            [
              occupied.has(name) || proposed.some((other, otherIndex) => otherIndex !== index && other === name),
              'namespace name collides with a binding, reference, or another proposed namespace',
            ],
            [
              sourceCode.getAllComments().some((comment) => comment.range[0] >= node.range[0] && comment.range[1] <= node.range[1]),
              'comment inside import',
            ],
          ]

          let reason = skipReasons.find(([skipped]) => skipped)?.[1] ?? ''

          for (const specifier of node.specifiers) {
            if (reason) {
              break
            }

            if (specifier.type !== 'ImportSpecifier') {
              continue
            }

            const imported = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
            const variable = variables.find((binding) => binding.identifiers.some((id) => id.range[0] === specifier.local.range[0]))

            if (!bindingName.test(imported) || variable?.defs.length !== 1) {
              reason = 'unsupported imported name or binding'
              continue
            }

            const unsupported = variable.references.find(({ identifier }) => {
              let current: ESTree.Node = identifier
              let parent = current.parent

              while (
                (parent.type === 'TSQualifiedName' && parent.left === current) ||
                (parent.type === 'MemberExpression' && !parent.computed && parent.object === current)
              ) {
                current = parent
                parent = current.parent
              }

              return !(
                (parent.type === 'TSTypeReference' && parent.typeName === current) ||
                (parent.type === 'TSTypeQuery' && parent.exprName === current) ||
                ((parent.type === 'TSInterfaceHeritage' || parent.type === 'TSClassImplements') && parent.expression === current)
              )
            })

            if (unsupported) {
              reason = unsupported.identifier.parent.type === 'ExportSpecifier' ? 'local re-export' : 'unsupported reference syntax'
              continue
            }

            nodeEdits.push(...variable.references.map(({ identifier }) => ({ range: identifier.range, text: `${name}.${imported}` })))
          }

          reports.push({
            node,
            name,
            reason,
          })

          if (!reason) {
            edits.push(...nodeEdits)
          }
        }

        for (const { node, name, reason } of reports) {
          context.report({
            node,
            messageId: 'namespace',
            data: { name, source: node.source.value, count: node.specifiers.length, max, reason: reason ? ` Autofix skipped: ${reason}.` : '' },
            fix: reason ? undefined : (fixer) => edits.map((edit) => fixer.replaceTextRange(edit.range, edit.text)),
          })
        }
      },
    }
  },
})
