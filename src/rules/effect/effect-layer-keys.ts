import { defineRule } from '@oxlint/plugins'
import { readFileSync } from 'node:fs'
import { astDottedName } from '../../utils/ast.utils.ts'
import { declarationsPropertyName } from '../../utils/declarations.utils.ts'
import { namingCaptures, namingExpand } from '../../utils/naming.utils.ts'
import { optionsFirst, optionsPatternsTest, optionsWildcards } from '../../utils/options.utils.ts'
import type { EffectLayerKeysFrame, EffectLayerKeysOptions } from '../../types/effect.types.ts'
import type { ESTree } from '@oxlint/plugins'

const effectLayerKeysPairs = new Map([['{', '}'], ['(', ')'], ['[', ']'], ['<', '>']])

function effectLayerKeysDeclared(text: string, declaration: string): string[] | null {
  const code = text.replaceAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, ' ')
  const start = code.indexOf(`${declaration}<`)
  const open = start === -1 ? -1 : code.indexOf('{', start)

  if (open === -1) {
    return null
  }

  const paths: string[] = []
  const frames: EffectLayerKeysFrame[] = [{ open: '{', members: 0 }]
  const key = /\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*(?=[:(<])/y
  let fresh = true

  for (let index = open + 1; index < code.length && frames.length > 0; index += 1) {
    const char = code[index]
    const members = frames.every((frame) => frame.open === '{')

    key.lastIndex = index

    const match = fresh && members ? key.exec(code) : null

    if (match) {
      const rest = code.slice(key.lastIndex).replace(/^:\s*/, '')
      const path = [...frames.flatMap((frame) => frame.key ?? []), match[1]].join('.')
      const parent = frames.at(-1)

      if (parent) {
        parent.members += 1
      }

      if (rest.startsWith('{')) {
        frames.push({
          open: '{',
          key: match[1],
          members: 0,
        })
        index = code.length - rest.length
      } else {
        paths.push(path)
        fresh = false
        index = key.lastIndex - 1
      }

      continue
    }

    if (effectLayerKeysPairs.has(char)) {
      frames.push({ open: char, members: 0 })
    } else if (char === effectLayerKeysPairs.get(frames.at(-1)?.open ?? '') && !(char === '>' && code[index - 1] === '=')) {
      const closed = frames.pop()

      if (closed?.key !== undefined && closed.members === 0) {
        paths.push([...frames.flatMap((frame) => frame.key ?? []), closed.key].join('.'))
      }
    }

    fresh = members && (char === '{' || char === ';' || char === ',' || char === '}' || (fresh && /\s/.test(char)))
  }

  return paths
}

function effectLayerKeysBound(object: ESTree.ObjectExpression, path: string[]): [string, ESTree.Node][] {
  return object.properties.flatMap((property): [string, ESTree.Node][] => {
    const key = declarationsPropertyName(property)

    if (property.type !== 'Property' || key === undefined) {
      return []
    }

    return property.value.type === 'ObjectExpression' ? effectLayerKeysBound(property.value, [...path, key]) : [[[...path, key].join('.'), property]]
  })
}

export const effectLayerKeys = defineRule({
  meta: {
    type: 'problem',
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          service: { type: 'string', minLength: 1 },
          callees: { type: 'array', items: { type: 'string' }, minItems: 1 },
          declaration: { type: 'string', minLength: 1 },
        },
        required: ['service'],
      },
    ],
    messages: {
      extra: "'{{path}}' is not a method of the service declared in {{file}}.",
      missing: 'The service in {{file}} declares {{paths}}, which this layer does not bind.',
    },
  },
  createOnce(context) {
    let declared: string[] | null = null
    let callees: RegExp[] = []
    let file = ''

    return {
      before() {
        const options = optionsFirst<EffectLayerKeysOptions>(context, { service: '' })

        file = namingExpand(options.service, namingCaptures(context.filename) ?? {}, false)
        callees = optionsWildcards(options.callees ?? ['*.of', '*.bind'])

        try {
          declared = effectLayerKeysDeclared(readFileSync(file, 'utf8'), options.declaration ?? 'Context.Service')
        } catch {
          declared = null
        }

        if (!declared) {
          return false
        }
      },
      CallExpression(node) {
        const first = node.arguments.at(0)

        if (!declared || first?.type !== 'ObjectExpression' || !optionsPatternsTest(callees, astDottedName(node.callee) ?? '')) {
          return
        }

        const bound = effectLayerKeysBound(first, [])
        const names = new Set(bound.map(([path]) => path))
        const short = file.split('/').slice(-2).join('/')
        const missing = declared.filter((path) => !names.has(path) && !bound.some(([name]) => name.startsWith(`${path}.`)))

        for (const [path, property] of bound) {
          if (!declared.some((name) => name === path || path.startsWith(`${name}.`))) {
            context.report({
              node: property,
              messageId: 'extra',
              data: { path, file: short },
            })
          }
        }

        if (missing.length > 0) {
          context.report({
            node: first,
            messageId: 'missing',
            data: { paths: missing.map((path) => `'${path}'`).join(', '), file: short },
          })
        }
      },
    }
  },
})
