import { defineRule } from '@oxlint/plugins'
import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { astBindings, astDottedName, astModuleName, astUnwrap } from '../../utils/ast.utils.ts'
import { declarationsIsFunctionValue } from '../../utils/declarations.utils.ts'
import { namingCaptures, namingExpand, namingStemModes } from '../../utils/naming.utils.ts'
import { optionsAll, optionsEscape, optionsGlob, optionsPatterns, optionsPatternSchema, optionsPatternsTest, optionsWildcards } from '../../utils/options.utils.ts'
import type * as FilesTypes from '../../types/files.types.ts'
import type { OptionsPattern, OptionsSchema } from '../../types/options.types.ts'
import type { ESTree } from '@oxlint/plugins'

const filesTopLevelKinds: readonly FilesTypes.FilesTopLevelKind[] = [
  'import', 'export', 'reexport', 'default', 'type', 'interface', 'enum', 'class', 'namespace', 'const', 'let', 'var', 'function', 'function-const', 'call', 'statement',
]

const filesTopLevelDeclared = new Map<ESTree.Node['type'], FilesTypes.FilesTopLevelKind>([
  ['FunctionDeclaration', 'function'],
  ['TSDeclareFunction', 'function'],
  ['ClassDeclaration', 'class'],
  ['TSTypeAliasDeclaration', 'type'],
  ['TSInterfaceDeclaration', 'interface'],
  ['TSEnumDeclaration', 'enum'],
  ['TSModuleDeclaration', 'namespace'],
])

const filesTopLevelEntries: OptionsSchema = {
  type: 'array',
  items: {
    anyOf: [
      { type: 'string' },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { anyOf: [{ type: 'string', enum: [...filesTopLevelKinds] }, { type: 'array', items: { type: 'string', enum: [...filesTopLevelKinds] }, minItems: 1 }] },
          names: optionsPatternSchema,
          from: optionsPatternSchema,
          exported: { type: 'boolean' },
          uses: { type: 'integer', minimum: 1 },
          message: { type: 'string' },
        },
        required: ['kind'],
      },
    ],
  },
}

const filesTopLevelValues = new Map<ESTree.Node['type'], string>([
  ['Literal', '<literal>'],
  ['TemplateLiteral', '<literal>'],
  ['ObjectExpression', '<object>'],
  ['ArrayExpression', '<array>'],
  ['FunctionExpression', '<function>'],
  ['ArrowFunctionExpression', '<function>'],
])

function filesTopLevelHead(node: ESTree.Node | null | undefined): string {
  if (!node) {
    return '<none>'
  }

  if (node.type === 'AwaitExpression') {
    return filesTopLevelHead(node.argument)
  }

  if (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'ChainExpression'
  ) {
    return filesTopLevelHead(node.expression)
  }

  if (node.type === 'CallExpression' || node.type === 'NewExpression') {
    return filesTopLevelHead(node.callee)
  }

  if (node.type === 'TaggedTemplateExpression') {
    return filesTopLevelHead(node.tag)
  }

  if (node.type === 'MemberExpression') {
    return astDottedName(node) ?? filesTopLevelHead(node.object)
  }

  return node.type === 'Identifier' ? node.name : (filesTopLevelValues.get(node.type) ?? '<other>')
}

function filesTopLevelItems(statement: ESTree.Program['body'][number]): FilesTypes.FilesTopLevelItem[] {
  const item = (kind: FilesTypes.FilesTopLevelKind, name: string, node: ESTree.Node, from = '', exported = false): FilesTypes.FilesTopLevelItem => ({ kind, name, from, exported, node })

  if (statement.type === 'ExpressionStatement' && statement.directive) {
    return []
  }

  if (statement.type === 'ImportDeclaration') {
    return [item('import', statement.source.value, statement)]
  }

  if (statement.type === 'ExportAllDeclaration') {
    return [item('reexport', statement.source.value, statement, '', true)]
  }

  if (statement.type === 'ExportNamedDeclaration' && !statement.declaration) {
    const kind = statement.source ? 'reexport' : 'export'
    const names = statement.specifiers.map((specifier) => item(kind, astModuleName(specifier.exported), specifier, statement.source?.value ?? '', true))

    return names.length > 0 ? names : [item(kind, '', statement, statement.source?.value ?? '', true)]
  }

  const exported = statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
  const node = exported ? statement.declaration : statement

  if (!node) {
    return []
  }

  if (node.type === 'VariableDeclaration') {
    return node.declarations.flatMap((declarator) => {
      const variable = node.kind === 'using' || node.kind === 'await using' ? 'statement' : node.kind
      const kind = declarationsIsFunctionValue(declarator.init) ? 'function-const' : variable

      return astBindings(declarator.id).map((binding) => item(kind, binding.name, declarator, filesTopLevelHead(declarator.init), exported))
    })
  }

  const declared = filesTopLevelDeclared.get(node.type)

  if (declared) {
    const id = 'id' in node ? node.id : null

    return [item(declared, id && 'name' in id ? id.name : '', node, '', exported)]
  }

  if (statement.type === 'ExportDefaultDeclaration') {
    return [item('default', filesTopLevelHead(node), statement, filesTopLevelHead(node), true)]
  }

  if (statement.type === 'ExpressionStatement') {
    const expression = astUnwrap(statement.expression)

    if (expression.type === 'CallExpression' || expression.type === 'TaggedTemplateExpression') {
      return [item('call', filesTopLevelHead(expression), statement)]
    }
  }

  return [item('statement', statement.type, statement)]
}

export const filesTopLevel = defineRule({
  meta: {
    type: 'problem',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          allow: filesTopLevelEntries,
          deny: filesTopLevelEntries,
          message: { type: 'string' },
          when: optionsPatternSchema,
          stem: { type: 'string', enum: [...namingStemModes, 'folder'] },
          singularize: { type: 'string', enum: ['none', 'trailing-s'] },
          roles: { type: 'array', items: { type: 'string' } },
          separators: { type: 'array', items: { type: 'string' } },
          file: { type: 'string' },
          placeholder: { type: 'string' },
        },
        anyOf: [{ required: ['allow'] }, { required: ['deny'] }],
      },
    },
    messages: {
      denied: 'Top-level {{what}} is not allowed in this file.{{message}}',
      unlisted: 'Top-level {{what}} is not allowed in this file; allowed: {{allowed}}.{{message}}',
    },
  },
  createOnce(context) {
    const siblings = (globs: OptionsPattern | undefined, captures: Record<string, string>) => {
      if (globs === undefined) {
        return true
      }

      const patterns = [globs].flat().map((glob) => optionsGlob(namingExpand(glob, captures, false)))

      try {
        return readdirSync(dirname(context.filename)).some((name) => patterns.some((pattern) => pattern.test(name)))
      } catch {
        return false
      }
    }

    const check = (program: ESTree.Program, options: FilesTypes.FilesTopLevelOptions) => {
      const captures = namingCaptures(context.filename, options)

      if (!captures || !siblings(options.when, captures)) {
        return
      }

      const patterns = (pattern: OptionsPattern | undefined) =>
        pattern === undefined ? null : optionsPatterns([pattern].flat().map((source) => namingExpand(source, captures, true, optionsEscape)))

      const matcher = (entry: string | FilesTypes.FilesTopLevelEntry): FilesTypes.FilesTopLevelMatcher => {
        if (typeof entry !== 'string') {
          return {
            kinds: [entry.kind].flat(),
            names: patterns(entry.names),
            from: patterns(entry.from),
            exported: entry.exported,
            uses: entry.uses,
            message: entry.message ?? '',
          }
        }

        const kind = filesTopLevelKinds.find((name) => name === entry)

        return kind ? { kinds: [kind], names: null, from: null, message: '' } : { kinds: ['call'], names: optionsWildcards(entry), from: null, message: '' }
      }

      const reads = (item: FilesTypes.FilesTopLevelItem) => {
        const variable = context.sourceCode.getDeclaredVariables(item.node).find(({ name }) => name === item.name)

        return variable?.references.filter((reference) => !reference.init).length
      }

      const matches = (item: FilesTypes.FilesTopLevelItem) => (entry: FilesTypes.FilesTopLevelMatcher) =>
        entry.kinds.includes(item.kind)
          && (entry.names === null || optionsPatternsTest(entry.names, item.name))
          && (entry.from === null || optionsPatternsTest(entry.from, item.from))
          && (entry.exported === undefined || entry.exported === item.exported)
          && (entry.uses === undefined || (reads(item) ?? entry.uses) >= entry.uses)

      const allow = options.allow?.map(matcher)
      const deny = (options.deny ?? []).map(matcher)

      const label = (entry: FilesTypes.FilesTopLevelEntry) =>
        [
          entry.exported === undefined ? [] : [entry.exported ? 'exported' : 'unexported'],
          [entry.kind].flat().join('/'),
          entry.names === undefined ? [] : ['named', [entry.names].flat().join(' | ')],
          entry.from === undefined ? [] : ['from', [entry.from].flat().join(' | ')],
          entry.uses === undefined ? [] : [`read ${entry.uses}+ times`],
        ].flat().join(' ')

      const allowed = (options.allow ?? []).map((entry) => (typeof entry === 'string' ? entry : label(entry))).join(', ')
      const hint = options.message ? ` ${options.message}` : ''

      for (const item of program.body.flatMap(filesTopLevelItems)) {
        const what = item.name && item.kind !== 'statement' ? `${item.kind} '${item.name}'` : item.kind
        const denied = deny.find(matches(item))

        if (denied) {
          context.report({
            node: item.node,
            messageId: 'denied',
            data: { what, message: denied.message ? ` ${denied.message}` : hint },
          })
        } else if (allow && !allow.some(matches(item))) {
          context.report({
            node: item.node,
            messageId: 'unlisted',
            data: { what, allowed, message: hint },
          })
        }
      }
    }

    return {
      Program(program) {
        for (const options of optionsAll<FilesTypes.FilesTopLevelOptions>(context)) {
          check(program, options)
        }
      },
    }
  },
})
