import { PresetError } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'

const presetSetsReserved = ['domain', 'stem', 'file', 'folder', 'parent', 'name', 'key', 'value']

export function presetSets(fragments: PresetTypes.PresetFragment[]): PresetTypes.PresetFolders[] {
  const sets: PresetTypes.PresetSets = Object.assign({}, ...fragments.map((fragment) => fragment.sets))
  const names = Object.keys(sets)
  const reserved = names.find((name) => presetSetsReserved.includes(name) || !/^[a-z][A-Za-z0-9]*$/.test(name))

  if (reserved) {
    throw new PresetError(
      `Set \`${reserved}\` needs another name: start with a lowercase letter, use letters and digits, and avoid ${presetSetsReserved.join(', ')}.`,
    )
  }

  if (names.length === 0) {
    return fragments.map((fragment) => fragment.folders ?? {})
  }

  const token = new RegExp(`\\{(${names.join('|')})\\}`)

  const pairs = (name: string): [string, string][] => {
    if (!Object.hasOwn(sets, name)) {
      throw new PresetError(`Unknown set \`${name}\`.`)
    }

    const set = sets[name]

    return Array.isArray(set) ? set.map((item) => [item, item]) : Object.entries(set)
  }

  const text = (value: string, key: string, item: string) => value.replaceAll('{key}', key).replaceAll('{value}', item)

  const fill = (value: PresetTypes.PresetSetValue, key: string, item: string): PresetTypes.PresetSetValue => {
    if (typeof value === 'string') {
      return text(value, key, item)
    }

    if (Array.isArray(value)) {
      return value.map((entry) => fill(entry, key, item))
    }

    return value instanceof Object ? Object.fromEntries(Object.entries(value).map(([name, entry]) => [text(name, key, item), fill(entry, key, item)])) : value
  }

  const spread = (value: string): string[] => {
    const match = token.exec(value)

    return match ? pairs(match[1]).flatMap(([key]) => spread(value.replace(match[0], key))) : [value]
  }

  const expandEntries = (value: PresetTypes.PresetSetObject): [string, PresetTypes.PresetSetValue][] =>
    Object.entries(value).flatMap(([name, entry]) => {
      const match = token.exec(name)

      return match
        ? pairs(match[1]).flatMap(([key, item]) => expandEntries({ [name.replace(match[0], key)]: fill(entry, key, item) }))
        : [[name, name === 'message' ? entry : expand(entry)]]
    })

  const expand = (value: PresetTypes.PresetSetValue): PresetTypes.PresetSetValue => {
    if (typeof value === 'string') {
      return token.test(value) ? spread(value) : value
    }

    if (!Array.isArray(value)) {
      const marks = value instanceof Object ? Object.getOwnPropertySymbols(value).map((mark) => [mark, Reflect.get(value, mark)]) : []

      return value instanceof Object ? Object.assign(Object.fromEntries(expandEntries(value)), Object.fromEntries(marks)) : value
    }

    return value.flatMap((entry) => {
      if (typeof entry === 'string') {
        return spread(entry)
      }

      if (!(entry instanceof Object) || Array.isArray(entry) || typeof entry.each !== 'string') {
        return [expand(entry)]
      }

      const { each, ...rest } = entry

      return pairs(each).map(([key, item]) => expand(fill(rest, key, item)))
    })
  }

  // SAFETY: folders hold only plain JSON values, and expansion keeps their shape; each folder is validated when it is resolved.
  return fragments.map((fragment) => expand((fragment.folders ?? {}) as PresetTypes.PresetSetValue) as PresetTypes.PresetFolders)
}
