import { defineRule } from '@oxlint/plugins'
import { readdirSync } from 'node:fs'
import { astCallName, astStaticString } from '../../utils/ast.utils.ts'
import { namingCamelCase, namingCaptures, namingCaptureSchemaProperties } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsMessage } from '../../utils/options.utils.ts'
import type { BackendTableOwnerOptions } from '../../types/backend.types.ts'
import type { ESTree } from '@oxlint/plugins'

const backendTableOwnerMethods = ['selectFrom', 'insertInto', 'updateTable', 'deleteFrom', 'replaceInto', 'mergeInto']

const backendTableOwnerFolders = new Map<string, string[]>()

function backendTableOwnerSiblings(filename: string, domain: string): string[] {
  const parts = filename.replaceAll('\\', '/').split('/').slice(0, -1)
  const index = parts.lastIndexOf(domain)

  if (index < 0) {
    return []
  }

  const parent = parts.slice(0, index).join('/') || '/'
  const cached = backendTableOwnerFolders.get(parent)

  if (cached) {
    return cached
  }

  let folders: string[] = []

  try {
    folders = readdirSync(parent, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    folders = []
  }

  backendTableOwnerFolders.set(parent, folders)

  return folders
}

function backendTableOwnerChained(call: ESTree.CallExpression, methods: ReadonlySet<string>): boolean {
  let node: ESTree.Node = call

  while (node.type === 'CallExpression' || node.type === 'MemberExpression') {
    if (node.type === 'CallExpression' && methods.has(astCallName(node) ?? '')) {
      return true
    }

    node = node.type === 'CallExpression' ? node.callee : node.object
  }

  return false
}

function backendTableOwnerNested(node: ESTree.Node, methods: ReadonlySet<string>): boolean {
  let child = node

  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'CallExpression' && parent.callee !== child && backendTableOwnerChained(parent, methods)) {
      return true
    }

    child = parent
  }

  return false
}

function backendTableOwnerPrefixed(table: string, domain: string): boolean {
  const camel = namingCamelCase(domain)
  const rest = table.slice(camel.length)

  return camel !== '' && table.startsWith(camel) && /^(?:e?s)?(?:[A-Z0-9_]|$)/.test(rest)
}

export const backendTableOwner = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          methods: { type: 'array', items: { type: 'string', minLength: 1 } },
          owners: { type: 'object', additionalProperties: { type: 'string' } },
          domains: { type: 'array', items: { type: 'string', minLength: 1 } },
          prefix: { type: 'boolean' },
          message: { type: 'string' },
          ...namingCaptureSchemaProperties,
        },
      },
    ],
    messages: {
      owner: "'{{table}}' belongs to the '{{owner}}' domain; '{{domain}}' reaches it through that domain, not with {{method}}().{{message}}",
    },
  },
  createOnce(context) {
    let options: BackendTableOwnerOptions = {}
    let methods = new Set<string>()
    let domain = ''
    let domains: string[] = []
    let message = ''

    function owner(table: string): string | undefined {
      if (options.owners && Object.hasOwn(options.owners, table)) {
        return options.owners[table]
      }

      if (options.prefix === false) {
        return undefined
      }

      const owners = domains.filter((candidate) => backendTableOwnerPrefixed(table, candidate))

      return owners.toSorted((left, right) => namingCamelCase(right).length - namingCamelCase(left).length)[0]
    }

    return {
      before() {
        options = optionsFirst<BackendTableOwnerOptions>(context, {})
        const captures = namingCaptures(context.filename, options)

        if (!captures?.domain) {
          return false
        }

        domain = captures.domain
        methods = new Set(options.methods ?? backendTableOwnerMethods)
        message = optionsMessage(options.message)
        domains = options.prefix === false ? [] : [...new Set([domain, ...(options.domains ?? []), ...backendTableOwnerSiblings(context.filename, domain)])]
      },
      CallExpression(node) {
        const method = astCallName(node)
        const first = node.arguments.at(0)
        const text = first ? astStaticString(first) : undefined

        if (!first || text === undefined || method === undefined || !methods.has(method) || backendTableOwnerNested(node, methods)) {
          return
        }

        const table = text.replace(/\s+as\s+\S+$/i, '').trim()
        const found = owner(table)

        if (found !== undefined && found !== domain) {
          context.report({
            node: first,
            messageId: 'owner',
            data: { table, owner: found, domain, method, message },
          })
        }
      },
    }
  },
})
