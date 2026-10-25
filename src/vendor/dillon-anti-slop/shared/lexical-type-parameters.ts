import type { ESTree, SourceCode } from '@oxlint/plugins'

function isNode(value: unknown): value is ESTree.Node {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
}

function collectInferTypeParameterNames(
  node: ESTree.Node,
  visitorKeys: SourceCode['visitorKeys'],
  names: Set<string>,
): void {
  if (node.type === 'TSInferType') {
    names.add(node.typeParameter.name.name)
  }

  for (const key of visitorKeys[node.type] ?? []) {
    const value: unknown = Reflect.get(node, key)

    if (isNode(value)) {
      collectInferTypeParameterNames(value, visitorKeys, names)
      continue
    }

    if (!Array.isArray(value)) {
      continue
    }

    for (const child of value) {
      if (isNode(child)) {
        collectInferTypeParameterNames(child, visitorKeys, names)
      }
    }
  }
}

export function lexicalTypeParametersNames(
  node: ESTree.Node,
  visitorKeys: SourceCode['visitorKeys'],
): ReadonlySet<string> {
  const names = new Set<string>()
  let descendant: ESTree.Node = node
  let current: ESTree.Node = node

  while (current.type !== 'Program') {
    if ('typeParameters' in current) {
      for (const parameter of current.typeParameters?.params ?? []) {
        names.add(parameter.name.name)
      }
    }

    if (current.type === 'TSMappedType' && (descendant === current.nameType || descendant === current.typeAnnotation)) {
      names.add(current.key.name)
    }

    if (current.type === 'TSConditionalType' && descendant === current.trueType) {
      collectInferTypeParameterNames(current.extendsType, visitorKeys, names)
    }
    descendant = current
    current = current.parent
  }

  return names
}
