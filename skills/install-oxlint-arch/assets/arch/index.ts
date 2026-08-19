import { eslintCompatPlugin } from '@oxlint/plugins'
import { declarationName } from './rules/declaration-name.ts'
import { exportFilePrefix } from './rules/export-file-prefix.ts'
import { exportNamePattern } from './rules/export-name-pattern.ts'
import { filenameExportName } from './rules/filename-export-name.ts'
import { filenameMatch } from './rules/filename-match.ts'
import { folderPrefix } from './rules/folder-prefix.ts'
import { noExtraExports } from './rules/no-extra-exports.ts'
import { noExtraFactoryKeys } from './rules/no-extra-factory-keys.ts'
import { noFileLevelHelpers } from './rules/no-file-level-helpers.ts'
import { noImportedTypeAlias } from './rules/no-imported-type-alias.ts'
import { noInlineSchemaElements } from './rules/no-inline-schema-elements.ts'
import { noLocalSchemaConstruction } from './rules/no-local-schema-construction.ts'
import { noRederiveSchema } from './rules/no-rederive-schema.ts'
import { noRestrictedFiles } from './rules/no-restricted-files.ts'
import { noRestrictedToken } from './rules/no-restricted-token.ts'
import { noRuntimeInTypes } from './rules/no-runtime-in-types.ts'
import { noSingleUseScalarSchema } from './rules/no-single-use-scalar-schema.ts'
import { noTopLevelFunctions } from './rules/no-top-level-functions.ts'
import { noTrivialFunctions } from './rules/no-trivial-functions.ts'
import { noTypeDeclarations } from './rules/no-type-declarations.ts'
import { noUnescapedLike } from './rules/no-unescaped-like.ts'
import { onlyExportComponents } from './rules/only-export-components.ts'
import { requireFileFactory } from './rules/require-file-factory.ts'
import { requireObjectParams } from './rules/require-object-params.ts'
import { requireOrpcOutput } from './rules/require-orpc-output.ts'
import { requirePairedCall } from './rules/require-paired-call.ts'
import { routeSurface } from './rules/route-surface.ts'

export default eslintCompatPlugin({
  meta: { name: 'arch' },
  rules: {
    'declaration-name': declarationName,
    'export-file-prefix': exportFilePrefix,
    'export-name-pattern': exportNamePattern,
    'filename-export-name': filenameExportName,
    'filename-match': filenameMatch,
    'folder-prefix': folderPrefix,
    'no-extra-exports': noExtraExports,
    'no-extra-factory-keys': noExtraFactoryKeys,
    'no-file-level-helpers': noFileLevelHelpers,
    'no-imported-type-alias': noImportedTypeAlias,
    'no-inline-schema-elements': noInlineSchemaElements,
    'no-local-schema-construction': noLocalSchemaConstruction,
    'no-rederive-schema': noRederiveSchema,
    'no-restricted-files': noRestrictedFiles,
    'no-restricted-token': noRestrictedToken,
    'no-runtime-in-types': noRuntimeInTypes,
    'no-single-use-scalar-schema': noSingleUseScalarSchema,
    'no-top-level-functions': noTopLevelFunctions,
    'no-trivial-functions': noTrivialFunctions,
    'no-type-declarations': noTypeDeclarations,
    'no-unescaped-like': noUnescapedLike,
    'only-export-components': onlyExportComponents,
    'require-file-factory': requireFileFactory,
    'require-object-params': requireObjectParams,
    'require-orpc-output': requireOrpcOutput,
    'require-paired-call': requirePairedCall,
    'route-surface': routeSurface,
  },
})
