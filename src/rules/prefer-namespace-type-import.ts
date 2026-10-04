import { defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'
import { namingFileBasename, namingPascalCase, optionsFirst } from '../utils/index.ts'

interface NamespaceTypeImportOptions {
  max: number
  names: Record<string, string>
}

const bindingName = /^[A-Za-z_$][\w$]*$/
const reservedNames = new Set(
  'await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield implements interface let package private protected public static arguments eval'.split(
    ' ',
  ),
)

function namespaceName(source: string, names: Record<string, string>): string {
  if (Object.hasOwn(names, source)) {
    return names[source]!
  }

  const stem = namingFileBasename(source).replace(/(?:\.d)?\.[cm]?[jt]sx?$/i, '')
  const name = namingPascalCase(stem.replace(/[^A-Za-z0-9_$.-]/g, '-')) || 'Module'
  const prefixed = /^\d/.test(name) ? `Module${name}` : name
  return prefixed.endsWith('Types') ? prefixed : `${prefixed}Types`
}

function isTypeOnlyNamedImport(node: ESTree.ImportDeclaration): boolean {
  return (
    node.specifiers.length > 0 &&
    node.specifiers.every(
      (specifier) =>
        specifier.type === 'ImportSpecifier' && (node.importKind === 'type' || specifier.importKind === 'type'),
    )
  )
}

function safeReference(node: ESTree.Node): boolean {
  let current = node
  let parent = current.parent
  while (
    (parent?.type === 'TSQualifiedName' && parent.left === current) ||
    (parent?.type === 'MemberExpression' && !parent.computed && parent.object === current)
  ) {
    current = parent
    parent = current.parent
  }

  return (
    (parent?.type === 'TSTypeReference' && parent.typeName === current) ||
    (parent?.type === 'TSTypeQuery' && parent.exprName === current) ||
    ((parent?.type === 'TSInterfaceHeritage' || parent?.type === 'TSClassImplements') && parent.expression === current)
  )
}

/**
 * Replaces long type-only named imports with a namespace and qualifies their references.
 * Example: four names from './room.types' become `import type * as RoomTypes from './room.types'`.
 */
export const preferNamespaceTypeImport = defineRule({
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
      namespace:
        "Use `import type * as {{name}} from '{{source}}'` for {{count}} type imports (max {{max}}); keep exported domain names.{{reason}}",
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
        const { max, names } = optionsFirst<NamespaceTypeImportOptions>(context)
        const candidates = imports.filter((node) => isTypeOnlyNamedImport(node) && node.specifiers.length > max)
        if (candidates.length === 0) {
          return
        }

        const sourceCode = context.sourceCode
        const occupied = new Set<string>()
        for (const scope of sourceCode.scopeManager.scopes) {
          for (const variable of scope.variables) {
            occupied.add(variable.name)
          }
          // Why: a new import must not capture an existing unresolved/global reference either.
          for (const reference of scope.references) {
            occupied.add(reference.identifier.name)
          }
        }
        const proposed = candidates.map((node) => namespaceName(node.source.value, names))
        const comments = sourceCode.getAllComments()
        const reports: { node: ESTree.ImportDeclaration; name: string; reason: string }[] = []
        const edits: { range: [number, number]; text: string }[] = []

        for (const [index, node] of candidates.entries()) {
          const name = proposed[index]!
          let reason = ''
          const replacements = new Map<ESTree.Node, string>()
          if (!bindingName.test(name) || reservedNames.has(name)) {
            reason = 'invalid namespace binding'
          } else if (
            imports.some(
              (other) =>
                other.source.value === node.source.value &&
                other.specifiers.some((specifier) => specifier.type === 'ImportNamespaceSpecifier'),
            )
          ) {
            reason = 'existing namespace import from this module'
          } else if (
            occupied.has(name) ||
            proposed.some((other, otherIndex) => otherIndex !== index && other === name)
          ) {
            reason = 'namespace name collides with a binding, reference, or another proposed namespace'
          } else if (
            comments.some((comment) => comment.range[0] >= node.range[0] && comment.range[1] <= node.range[1])
          ) {
            reason = 'comment inside import'
          } else {
            const variables = sourceCode.getDeclaredVariables(node)
            for (const specifier of node.specifiers) {
              if (specifier.type !== 'ImportSpecifier') {
                continue
              }
              const imported =
                specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
              const variable = variables.find((binding) =>
                binding.identifiers.some((id) => id.range[0] === specifier.local.range[0]),
              )
              if (!bindingName.test(imported) || !variable || variable.defs.length !== 1) {
                reason = 'unsupported imported name or binding'
                break
              }
              for (const reference of variable.references) {
                const identifier = reference.identifier
                if (identifier.parent.type === 'ExportSpecifier') {
                  reason = 'local re-export'
                  break
                }
                if (!safeReference(identifier)) {
                  reason = 'unsupported reference syntax'
                  break
                }
                replacements.set(identifier, `${name}.${imported}`)
              }
              if (reason) {
                break
              }
            }
          }

          reports.push({ node, name, reason })
          if (!reason) {
            edits.push({ range: [node.range[0], node.source.range[0]], text: `import type * as ${name} from ` })
            for (const [identifier, text] of replacements) {
              edits.push({ range: identifier.range, text })
            }
          }
        }

        // Why: Oxlint joins each report's edits into one range. Separate import-to-use
        // fixes overlap; offer the same atomic file-wide fix so one pass fixes them all.
        for (const { node, name, reason } of reports) {
          context.report({
            node,
            messageId: 'namespace',
            data: {
              name,
              source: node.source.value,
              count: node.specifiers.length,
              max,
              reason: reason ? ` Autofix skipped: ${reason}.` : '',
            },
            fix: reason ? undefined : (fixer) => edits.map((edit) => fixer.replaceTextRange(edit.range, edit.text)),
          })
        }
      },
    }
  },
})
