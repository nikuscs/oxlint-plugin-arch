import { eslintCompatPlugin } from '@oxlint/plugins'
import { backendOrpcOutput } from './rules/backend/backend-orpc-output.ts'
import { backendServiceFunctions } from './rules/backend/backend-service-functions.ts'
import { backendSqlLike } from './rules/backend/backend-sql-like.ts'
import { boundariesImports } from './rules/boundaries/boundaries-imports.ts'
import { boundariesNext } from './rules/boundaries/boundaries-next.ts'
import { boundariesRpcDatabase } from './rules/boundaries/boundaries-rpc-database.ts'
import { boundariesTanstack } from './rules/boundaries/boundaries-tanstack.ts'
import { boundariesTokenOwner } from './rules/boundaries/boundaries-token-owner.ts'
import { codeConstructor } from './rules/code/code-constructor.ts'
import { codeDoubleNegation } from './rules/code/code-double-negation.ts'
import { codeLiteralIn } from './rules/code/code-literal-in.ts'
import { codeMutableState } from './rules/code/code-mutable-state.ts'
import { codeObjectParams } from './rules/code/code-object-params.ts'
import { codePairedCall } from './rules/code/code-paired-call.ts'
import { codePromiseMutation } from './rules/code/code-promise-mutation.ts'
import { codeSwitch } from './rules/code/code-switch.ts'
import { codeTrivialFunctions } from './rules/code/code-trivial-functions.ts'
import { commentsDirectives } from './rules/comments/comments-directives.ts'
import { commentsMembers } from './rules/comments/comments-members.ts'
import { comments } from './rules/comments/comments.ts'
import { filesComponentsOnly } from './rules/files/files-components-only.ts'
import { filesConstantsOnly } from './rules/files/files-constants-only.ts'
import { filesDomainConstants } from './rules/files/files-domain-constants.ts'
import { filesExports } from './rules/files/files-exports.ts'
import { filesFactoryKeys } from './rules/files/files-factory-keys.ts'
import { filesFactory } from './rules/files/files-factory.ts'
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
import { namingShape } from './rules/naming/naming-shape.ts'
import { namingTypes } from './rules/naming/naming-types.ts'
import { reactDynamicClasses } from './rules/react/react-dynamic-classes.ts'
import { reactEmptyEffect } from './rules/react/react-empty-effect.ts'
import { reactMemo } from './rules/react/react-memo.ts'
import { reactProps } from './rules/react/react-props.ts'
import { schemasInline } from './rules/schemas/schemas-inline.ts'
import { schemasLocal } from './rules/schemas/schemas-local.ts'
import { schemasRederive } from './rules/schemas/schemas-rederive.ts'
import { schemasSingleUse } from './rules/schemas/schemas-single-use.ts'
import { testsAssertions } from './rules/tests/tests-assertions.ts'
import { testsConcurrentDb } from './rules/tests/tests-concurrent-db.ts'
import { testsModifiers } from './rules/tests/tests-modifiers.ts'
import { testsTitles } from './rules/tests/tests-titles.ts'
import { typesDeclarations } from './rules/types/types-declarations.ts'
import { typesImportedAlias } from './rules/types/types-imported-alias.ts'
import { typesInline } from './rules/types/types-inline.ts'
import { typesLocalAlias } from './rules/types/types-local-alias.ts'
import { typesNamespaceImport } from './rules/types/types-namespace-import.ts'
import { typesService } from './rules/types/types-service.ts'
import { typesUnknown } from './rules/types/types-unknown.ts'

export default eslintCompatPlugin({
  meta: { name: 'arch' },
  rules: {
    'backend-orpc-output': backendOrpcOutput,
    'backend-service-functions': backendServiceFunctions,
    'backend-sql-like': backendSqlLike,
    'boundaries-imports': boundariesImports,
    'boundaries-next': boundariesNext,
    'boundaries-rpc-database': boundariesRpcDatabase,
    'boundaries-tanstack': boundariesTanstack,
    'boundaries-token-owner': boundariesTokenOwner,
    'code-constructor': codeConstructor,
    'code-double-negation': codeDoubleNegation,
    'code-literal-in': codeLiteralIn,
    'code-mutable-state': codeMutableState,
    'code-object-params': codeObjectParams,
    'code-paired-call': codePairedCall,
    'code-promise-mutation': codePromiseMutation,
    'code-switch': codeSwitch,
    'code-trivial-functions': codeTrivialFunctions,
    comments,
    'comments-directives': commentsDirectives,
    'comments-members': commentsMembers,
    'files-components-only': filesComponentsOnly,
    'files-constants-only': filesConstantsOnly,
    'files-domain-constants': filesDomainConstants,
    'files-exports': filesExports,
    'files-factory': filesFactory,
    'files-factory-keys': filesFactoryKeys,
    'files-helpers': filesHelpers,
    'files-no-functions': filesNoFunctions,
    'files-restricted': filesRestricted,
    'files-route': filesRoute,
    'files-types-only': filesTypesOnly,
    'layout-call-arguments': layoutCallArguments,
    'layout-call-array': layoutCallArray,
    'layout-chain': layoutChain,
    'layout-jsx-attributes': layoutJsxAttributes,
    'layout-key-value': layoutKeyValue,
    'layout-object': layoutObject,
    'layout-padding': layoutPadding,
    'layout-ternary': layoutTernary,
    'naming-declarations': namingDeclarations,
    'naming-export-pattern': namingExportPattern,
    'naming-export-prefix': namingExportPrefix,
    'naming-export-template': namingExportTemplate,
    'naming-file': namingFile,
    'naming-folder': namingFolder,
    'naming-shape': namingShape,
    'naming-types': namingTypes,
    'react-dynamic-classes': reactDynamicClasses,
    'react-empty-effect': reactEmptyEffect,
    'react-memo': reactMemo,
    'react-props': reactProps,
    'schemas-inline': schemasInline,
    'schemas-local': schemasLocal,
    'schemas-rederive': schemasRederive,
    'schemas-single-use': schemasSingleUse,
    'tests-assertions': testsAssertions,
    'tests-concurrent-db': testsConcurrentDb,
    'tests-modifiers': testsModifiers,
    'tests-titles': testsTitles,
    'types-declarations': typesDeclarations,
    'types-imported-alias': typesImportedAlias,
    'types-inline': typesInline,
    'types-local-alias': typesLocalAlias,
    'types-namespace-import': typesNamespaceImport,
    'types-service': typesService,
    'types-unknown': typesUnknown,
  },
})
