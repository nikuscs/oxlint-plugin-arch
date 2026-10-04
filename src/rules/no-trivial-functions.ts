import { defineRule } from '@oxlint/plugins'
import {
  astDottedName,
  declarationsIsTrivialFunction,
  declarationsPublicServiceMethods,
  declarationsTopLevelUnexportedFunctions,
  exportsCollectFunctions,
  guardsIsGenericHelper,
  trivialExpression,
  trivialIsForwarder,
  trivialUnwrap,
  optionsFirst,
  optionsOptionalPatterns,
  optionsPatternSchema,
  optionsPatternsTest,
} from '../utils/index.ts'
import { trivialBannedNames } from '../constants/trivial.constants.ts'
import type { AstRuntimeFunction, OptionsPattern } from '../utils/index.ts'
import type { ESTree, Scope } from '@oxlint/plugins'

interface NoTrivialFunctionsOptions {
  allowPattern?: OptionsPattern
  allowCallees?: string[]
  allowAsync?: boolean
  mode?: 'legacy' | 'precise'
  checkServiceMethods?: boolean
  bannedNames?: string[]
  checkGenericGuards?: boolean
}

/**
 * Rejects trivial top-level functions; precise mode also rejects named and structurally generic guards at any depth.
 *
 * Example: `loadUser(id) { return fetchUser(id) }` fails; precise mode preserves calls that transform their arguments.
 */
export const noTrivialFunctions = defineRule({
  meta: {
    type: 'problem',
    schema: [{
      type: 'object',
      additionalProperties: false,
      properties: {
        allowPattern: optionsPatternSchema,
        allowCallees: { type: 'array', items: { type: 'string' } },
        allowAsync: { type: 'boolean' },
        checkServiceMethods: { type: 'boolean' },
        mode: { type: 'string', enum: ['legacy', 'precise'] },
        bannedNames: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        checkGenericGuards: { type: 'boolean' },
      },
    }],
    messages: {
      trivial: 'Function {{name}} adds no transformation; inline it or use a value for a constant result. Keep deliberate adapters through an explicit rule exclusion.',
      bannedName: 'Helper {{name}} is forbidden by this policy. Inline the local check, or validate external input at its boundary; renaming the guard does not fix it.',
      genericGuard: 'Helper {{name}} only performs generic runtime type checks or fallback reads. Inline the local check, or validate external input at its boundary; do not add a schema merely to retain this helper.',
    },
  },
  createOnce(context) {
    let allowed: RegExp[] = []
    let allowedCallees: RegExp[] = []
    let allowAsync = false
    let mode: 'legacy' | 'precise' = 'legacy'
    let bannedNames = new Set<string>()
    let checkGenericGuards = false
    let checkServiceMethods = false
    const reported = new Set<number>()
    const checked = new Set<number>()

    function globalArray(node: ESTree.Node): boolean {
      let scope: Scope | null = context.sourceCode.getScope(node)
      while (scope) {
        const variable = scope.set.get('Array')
        if (variable) return variable.defs.length === 0
        scope = scope.upper
      }
      return true
    }

    function checkHelper(node: AstRuntimeFunction): void {
      if (bannedNames.size === 0 && !checkGenericGuards || checked.has(node.start)) return
      checked.add(node.start)
      const parent = node.parent
      const name = node.type !== 'ArrowFunctionExpression' && node.id ? node.id.name
        : parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier' ? parent.id.name
          : parent.type === 'Property' && !parent.computed && parent.key.type === 'Identifier' ? parent.key.name
            : '<anonymous>'
      if (optionsPatternsTest(allowed, name)) return
      if (bannedNames.has(name)) {
        reported.add(node.start)
        context.report({ node, messageId: 'bannedName', data: { name } })
        return
      }
      if (checkGenericGuards && guardsIsGenericHelper(node, globalArray)) {
        reported.add(node.start)
        context.report({ node, messageId: 'genericGuard', data: { name } })
      }
    }

    return {
      before() {
        const options = optionsFirst<NoTrivialFunctionsOptions>(context, {})
        const { allowPattern, allowCallees: calleePatterns = [], allowAsync: asyncAllowed = false } = options
        mode = options.mode ?? 'legacy'
        checkServiceMethods = options.checkServiceMethods ?? false
        bannedNames = new Set(options.bannedNames ?? (mode === 'precise' ? trivialBannedNames : []))
        checkGenericGuards = options.checkGenericGuards ?? mode === 'precise'
        reported.clear()
        checked.clear()
        allowed = optionsOptionalPatterns(allowPattern)
        allowedCallees = calleePatterns.map((pattern) => new RegExp(pattern))
        allowAsync = asyncAllowed
      },
      FunctionDeclaration: checkHelper,
      FunctionExpression: checkHelper,
      ArrowFunctionExpression: checkHelper,
      Program(program) {
        const seen = new Set<string>()

        for (const item of [...exportsCollectFunctions(program), ...declarationsTopLevelUnexportedFunctions(program), ...(checkServiceMethods ? declarationsPublicServiceMethods(program) : [])]) {
          const key = `${item.name}:${item.node.start}:${item.node.end}`

          if (seen.has(key) || optionsPatternsTest(allowed, item.name)) {
            continue
          }

          seen.add(key)
          checkHelper(item.node)
          if (reported.has(item.node.start)) continue
          const expression = trivialExpression(item.node)
          const trivial = mode === 'legacy' ? declarationsIsTrivialFunction(item.node)
            : expression ? trivialIsForwarder(item.node, expression) : declarationsIsTrivialFunction(item.node)
          if (!trivial) continue
          const value = expression && trivialUnwrap(expression)
          const call = value?.type === 'CallExpression' ? value : null
          const path = call && astDottedName(call.callee)
          if (allowAsync && item.node.async && call
            || path && allowedCallees.some((pattern) => pattern.test(path))) {
            continue
          }

          reported.add(item.node.start)
          context.report({
            node: item.node,
            messageId: 'trivial',
            data: { name: item.name },
          })
        }
      },
    }
  },
})
