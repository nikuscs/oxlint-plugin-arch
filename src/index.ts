import { eslintCompatPlugin } from '@oxlint/plugins'
import { backendOrpcOutput } from './rules/backend/backend-orpc-output.ts'
import { backendSqlLike } from './rules/backend/backend-sql-like.ts'
import { boundariesTokenOwner } from './rules/boundaries/boundaries-token-owner.ts'
import { codeConstructor } from './rules/code/code-constructor.ts'
import { codeLiteralIn } from './rules/code/code-literal-in.ts'
import { codeMutableState } from './rules/code/code-mutable-state.ts'
import { codeObjectParams } from './rules/code/code-object-params.ts'
import { codePairedCall } from './rules/code/code-paired-call.ts'
import { codePromiseMutation } from './rules/code/code-promise-mutation.ts'
import { codeTrivialFunctions } from './rules/code/code-trivial-functions.ts'
import { comments } from './rules/comments/comments.ts'
import { commentsMembers } from './rules/comments/comments-members.ts'
import { filesComponentsOnly } from './rules/files/files-components-only.ts'
import { filesConstantsOnly } from './rules/files/files-constants-only.ts'
import { filesExports } from './rules/files/files-exports.ts'
import { filesFactory } from './rules/files/files-factory.ts'
import { filesFactoryKeys } from './rules/files/files-factory-keys.ts'
import { filesHelpers } from './rules/files/files-helpers.ts'
import { filesNoFunctions } from './rules/files/files-no-functions.ts'
import { filesRestricted } from './rules/files/files-restricted.ts'
import { filesRoute } from './rules/files/files-route.ts'
import { filesTypesOnly } from './rules/files/files-types-only.ts'
import { layoutCallArguments } from './rules/layout/layout-call-arguments.ts'
import { layoutCallArray } from './rules/layout/layout-call-array.ts'
import { layoutChain } from './rules/layout/layout-chain.ts'
import { layoutJsxAttributes } from './rules/layout/layout-jsx-attributes.ts'
import { layoutKeyValue } from './rules/layout/layout-key-value.ts'
import { layoutObject } from './rules/layout/layout-object.ts'
import { layoutPadding } from './rules/layout/layout-padding.ts'
import { layoutTernary } from './rules/layout/layout-ternary.ts'
import { namingDeclarations } from './rules/naming/naming-declarations.ts'
import { namingExportPattern } from './rules/naming/naming-export-pattern.ts'
import { namingExportPrefix } from './rules/naming/naming-export-prefix.ts'
import { namingExportTemplate } from './rules/naming/naming-export-template.ts'
import { namingFile } from './rules/naming/naming-file.ts'
import { namingFolder } from './rules/naming/naming-folder.ts'
import { reactProps } from './rules/react/react-props.ts'
import { schemasInline } from './rules/schemas/schemas-inline.ts'
import { schemasLocal } from './rules/schemas/schemas-local.ts'
import { schemasRederive } from './rules/schemas/schemas-rederive.ts'
import { schemasSingleUse } from './rules/schemas/schemas-single-use.ts'
import { testsTitles } from './rules/tests/tests-titles.ts'
import { typesDeclarations } from './rules/types/types-declarations.ts'
import { typesImportedAlias } from './rules/types/types-imported-alias.ts'
import { typesInline } from './rules/types/types-inline.ts'
import { typesNamespaceImport } from './rules/types/types-namespace-import.ts'

export default eslintCompatPlugin({
  meta: { name: 'arch' },
  rules: {
    'call-arguments-multiline': layoutCallArguments,
    'call-array-multiline': layoutCallArray,
    'chain-newline': layoutChain,
    'component-props': reactProps,
    'declaration-name': namingDeclarations,
    'export-file-prefix': namingExportPrefix,
    'export-name-pattern': namingExportPattern,
    'filename-export-name': namingExportTemplate,
    'filename-match': namingFile,
    'folder-prefix': namingFolder,
    'jsx-attributes-multiline': layoutJsxAttributes,
    'key-value-same-line': layoutKeyValue,
    'no-comments': comments,
    'no-extra-exports': filesExports,
    'no-extra-factory-keys': filesFactoryKeys,
    'no-file-level-helpers': filesHelpers,
    'no-imported-type-alias': typesImportedAlias,
    'no-inline-schema-elements': schemasInline,
    'no-inline-types': typesInline,
    'no-literal-in': codeLiteralIn,
    'no-local-schema-construction': schemasLocal,
    'no-member-comments': commentsMembers,
    'no-module-mutable-state': codeMutableState,
    'no-promise-all-mutation': codePromiseMutation,
    'no-rederive-schema': schemasRederive,
    'no-restricted-constructor': codeConstructor,
    'no-restricted-files': filesRestricted,
    'no-restricted-token': boundariesTokenOwner,
    'no-runtime-in-types': filesTypesOnly,
    'no-single-use-scalar-schema': schemasSingleUse,
    'no-top-level-functions': filesNoFunctions,
    'no-trivial-functions': codeTrivialFunctions,
    'no-type-declarations': typesDeclarations,
    'no-unescaped-like': backendSqlLike,
    'object-multiline': layoutObject,
    'only-export-components': filesComponentsOnly,
    'only-export-constants': filesConstantsOnly,
    'padding-between-statements': layoutPadding,
    'prefer-namespace-type-import': typesNamespaceImport,
    'require-file-factory': filesFactory,
    'require-object-params': codeObjectParams,
    'require-orpc-output': backendOrpcOutput,
    'require-paired-call': codePairedCall,
    'route-surface': filesRoute,
    'ternary-layout': layoutTernary,
    'test-title-pattern': testsTitles,
  },
})
