import type * as PluginsTypes from '@oxlint/plugins'

export function resolveVariable(
  sourceCode: PluginsTypes.SourceCode,
  identifier: PluginsTypes.ESTree.IdentifierReference,
): PluginsTypes.Variable | null {
  let scope: PluginsTypes.Scope | null = sourceCode.getScope(identifier)

  while (scope !== null) {
    const variable = scope.set.get(identifier.name)

    if (variable !== undefined) {
      return variable
    }
    scope = scope.upper
  }

  return null
}
