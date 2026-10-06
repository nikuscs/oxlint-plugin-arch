import { eslintCompatPlugin } from '@oxlint/plugins'
import { callArrayMultiline } from './rules/call-array-multiline.ts'
import { chainNewline } from './rules/chain-newline.ts'
import { componentProps } from './rules/component-props.ts'
import { declarationName } from './rules/declaration-name.ts'
import { exportFilePrefix } from './rules/export-file-prefix.ts'
import { exportNamePattern } from './rules/export-name-pattern.ts'
import { filenameExportName } from './rules/filename-export-name.ts'
import { filenameMatch } from './rules/filename-match.ts'
import { folderPrefix } from './rules/folder-prefix.ts'
import { jsxAttributesMultiline } from './rules/jsx-attributes-multiline.ts'
import { keyValueSameLine } from './rules/key-value-same-line.ts'
import { noComments } from './rules/no-comments.ts'
import { noExtraExports } from './rules/no-extra-exports.ts'
import { noExtraFactoryKeys } from './rules/no-extra-factory-keys.ts'
import { noFileLevelHelpers } from './rules/no-file-level-helpers.ts'
import { noImportedTypeAlias } from './rules/no-imported-type-alias.ts'
import { noInlineSchemaElements } from './rules/no-inline-schema-elements.ts'
import { noInlineTypes } from './rules/no-inline-types.ts'
import { noLiteralIn } from './rules/no-literal-in.ts'
import { noLocalSchemaConstruction } from './rules/no-local-schema-construction.ts'
import { noMemberComments } from './rules/no-member-comments.ts'
import { noModuleMutableState } from './rules/no-module-mutable-state.ts'
import { noPromiseAllMutation } from './rules/no-promise-all-mutation.ts'
import { noRederiveSchema } from './rules/no-rederive-schema.ts'
import { noRestrictedConstructor } from './rules/no-restricted-constructor.ts'
import { noRestrictedFiles } from './rules/no-restricted-files.ts'
import { noRestrictedToken } from './rules/no-restricted-token.ts'
import { noRuntimeInTypes } from './rules/no-runtime-in-types.ts'
import { noSingleUseScalarSchema } from './rules/no-single-use-scalar-schema.ts'
import { noTopLevelFunctions } from './rules/no-top-level-functions.ts'
import { noTrivialFunctions } from './rules/no-trivial-functions.ts'
import { noTypeDeclarations } from './rules/no-type-declarations.ts'
import { noUnescapedLike } from './rules/no-unescaped-like.ts'
import { objectMultiline } from './rules/object-multiline.ts'
import { onlyExportComponents } from './rules/only-export-components.ts'
import { onlyExportConstants } from './rules/only-export-constants.ts'
import { paddingBetweenStatements } from './rules/padding-between-statements.ts'
import { preferNamespaceTypeImport } from './rules/prefer-namespace-type-import.ts'
import { requireFileFactory } from './rules/require-file-factory.ts'
import { requireObjectParams } from './rules/require-object-params.ts'
import { requireOrpcOutput } from './rules/require-orpc-output.ts'
import { requirePairedCall } from './rules/require-paired-call.ts'
import { routeSurface } from './rules/route-surface.ts'
import { testTitlePattern } from './rules/test-title-pattern.ts'

export default eslintCompatPlugin({
  meta: { name: 'arch' },
  rules: {
    'call-array-multiline': callArrayMultiline,
    'chain-newline': chainNewline,
    'component-props': componentProps,
    'declaration-name': declarationName,
    'export-file-prefix': exportFilePrefix,
    'export-name-pattern': exportNamePattern,
    'filename-export-name': filenameExportName,
    'filename-match': filenameMatch,
    'folder-prefix': folderPrefix,
    'jsx-attributes-multiline': jsxAttributesMultiline,
    'key-value-same-line': keyValueSameLine,
    'no-comments': noComments,
    'no-extra-exports': noExtraExports,
    'no-extra-factory-keys': noExtraFactoryKeys,
    'no-file-level-helpers': noFileLevelHelpers,
    'no-imported-type-alias': noImportedTypeAlias,
    'no-inline-schema-elements': noInlineSchemaElements,
    'no-inline-types': noInlineTypes,
    'no-literal-in': noLiteralIn,
    'no-local-schema-construction': noLocalSchemaConstruction,
    'no-member-comments': noMemberComments,
    'no-module-mutable-state': noModuleMutableState,
    'no-promise-all-mutation': noPromiseAllMutation,
    'no-rederive-schema': noRederiveSchema,
    'no-restricted-constructor': noRestrictedConstructor,
    'no-restricted-files': noRestrictedFiles,
    'no-restricted-token': noRestrictedToken,
    'no-runtime-in-types': noRuntimeInTypes,
    'no-single-use-scalar-schema': noSingleUseScalarSchema,
    'no-top-level-functions': noTopLevelFunctions,
    'no-trivial-functions': noTrivialFunctions,
    'no-type-declarations': noTypeDeclarations,
    'no-unescaped-like': noUnescapedLike,
    'object-multiline': objectMultiline,
    'only-export-components': onlyExportComponents,
    'only-export-constants': onlyExportConstants,
    'padding-between-statements': paddingBetweenStatements,
    'prefer-namespace-type-import': preferNamespaceTypeImport,
    'require-file-factory': requireFileFactory,
    'require-object-params': requireObjectParams,
    'require-orpc-output': requireOrpcOutput,
    'require-paired-call': requirePairedCall,
    'route-surface': routeSurface,
    'test-title-pattern': testTitlePattern,
  },
})
