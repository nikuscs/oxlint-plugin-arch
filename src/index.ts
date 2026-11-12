import { eslintCompatPlugin } from '@oxlint/plugins'
import { backendOrpcOutput } from './rules/backend/backend-orpc-output.ts'
import { backendRegistry } from './rules/backend/backend-registry.ts'
import { backendServiceFunctions } from './rules/backend/backend-service-functions.ts'
import { backendSqlLike } from './rules/backend/backend-sql-like.ts'
import { boundariesDeny } from './rules/boundaries/boundaries-deny.ts'
import { boundariesImports } from './rules/boundaries/boundaries-imports.ts'
import { boundariesNext } from './rules/boundaries/boundaries-next.ts'
import { boundariesRpcDatabase } from './rules/boundaries/boundaries-rpc-database.ts'
import { boundariesTanstack } from './rules/boundaries/boundaries-tanstack.ts'
import { boundariesTokenOwner } from './rules/boundaries/boundaries-token-owner.ts'
import { codeBranchOnce } from './rules/code/code-branch-once.ts'
import { codeConstructor } from './rules/code/code-constructor.ts'
import { codeDelegate } from './rules/code/code-delegate.ts'
import { codeDoubleNegation } from './rules/code/code-double-negation.ts'
import { codeFunctionNesting } from './rules/code/code-function-nesting.ts'
import { codeInline } from './rules/code/code-inline.ts'
import { codeJustifiedCall } from './rules/code/code-justified-call.ts'
import { codeLiteralIn } from './rules/code/code-literal-in.ts'
import { codeMutableState } from './rules/code/code-mutable-state.ts'
import { codeObjectParams } from './rules/code/code-object-params.ts'
import { codePairedCall } from './rules/code/code-paired-call.ts'
import { codePromiseMutation } from './rules/code/code-promise-mutation.ts'
import { codeSwitch } from './rules/code/code-switch.ts'
import { codeTraced } from './rules/code/code-traced.ts'
import { codeTrivialFunctions } from './rules/code/code-trivial-functions.ts'
import { codeYieldArgument } from './rules/code/code-yield-argument.ts'
import { commentsCode } from './rules/comments/comments-code.ts'
import { commentsDirectives } from './rules/comments/comments-directives.ts'
import { copyDashes } from './rules/copy/copy-dashes.ts'
import { effectLayerFile } from './rules/effect/effect-layer-file.ts'
import { effectLayers } from './rules/effect/effect-layers.ts'
import { effectMergePipe } from './rules/effect/effect-merge-pipe.ts'
import { effectSchemaFirst } from './rules/effect/effect-schema-first.ts'
import { effectValuesFirst } from './rules/effect/effect-values-first.ts'
import { filesComponentsOnly } from './rules/files/files-components-only.ts'
import { filesConstantsOnly } from './rules/files/files-constants-only.ts'
import { filesDomainConstants } from './rules/files/files-domain-constants.ts'
import { filesExports } from './rules/files/files-exports.ts'
import { filesExternals } from './rules/files/files-externals.ts'
import { filesFactoryKeys } from './rules/files/files-factory-keys.ts'
import { filesHelpers } from './rules/files/files-helpers.ts'
import { filesNoFunctions } from './rules/files/files-no-functions.ts'
import { filesRestricted } from './rules/files/files-restricted.ts'
import { filesRoute } from './rules/files/files-route.ts'
import { filesTypesOnly } from './rules/files/files-types-only.ts'
import { layoutArrowBody } from './rules/layout/layout-arrow-body.ts'
import { layoutCallArguments } from './rules/layout/layout-call-arguments.ts'
import { layoutCallArray } from './rules/layout/layout-call-array.ts'
import { layoutCallDepth } from './rules/layout/layout-call-depth.ts'
import { layoutChain } from './rules/layout/layout-chain.ts'
import { layoutItems } from './rules/layout/layout-items.ts'
import { layoutJsxAttributes } from './rules/layout/layout-jsx-attributes.ts'
import { layoutKeyValue } from './rules/layout/layout-key-value.ts'
import { layoutObject } from './rules/layout/layout-object.ts'
import { layoutPadding } from './rules/layout/layout-padding.ts'
import { layoutPipe } from './rules/layout/layout-pipe.ts'
import { layoutTernary } from './rules/layout/layout-ternary.ts'
import { layoutTypeArguments } from './rules/layout/layout-type-arguments.ts'
import { namingDeclarations } from './rules/naming/naming-declarations.ts'
import { namingExports } from './rules/naming/naming-exports.ts'
import { namingFile } from './rules/naming/naming-file.ts'
import { namingFolder } from './rules/naming/naming-folder.ts'
import { namingTypes } from './rules/naming/naming-types.ts'
import { reactDynamicClasses } from './rules/react/react-dynamic-classes.ts'
import { reactEmptyEffect } from './rules/react/react-empty-effect.ts'
import { reactMemo } from './rules/react/react-memo.ts'
import { reactProps } from './rules/react/react-props.ts'
import { reactQueryProps } from './rules/react/react-query-props.ts'
import { schemasInline } from './rules/schemas/schemas-inline.ts'
import { schemasLocal } from './rules/schemas/schemas-local.ts'
import { schemasRederive } from './rules/schemas/schemas-rederive.ts'
import { schemasSingleUse } from './rules/schemas/schemas-single-use.ts'
import { testsAssertions } from './rules/tests/tests-assertions.ts'
import { testsConcurrentDb } from './rules/tests/tests-concurrent-db.ts'
import { testsModifiers } from './rules/tests/tests-modifiers.ts'
import { testsTitles } from './rules/tests/tests-titles.ts'
import { typesDeclarations } from './rules/types/types-declarations.ts'
import { typesDuplicate } from './rules/types/types-duplicate.ts'
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
    'backend-registry': backendRegistry,
    'backend-service-functions': backendServiceFunctions,
    'backend-sql-like': backendSqlLike,
    'boundaries-deny': boundariesDeny,
    'boundaries-imports': boundariesImports,
    'boundaries-next': boundariesNext,
    'boundaries-rpc-database': boundariesRpcDatabase,
    'boundaries-tanstack': boundariesTanstack,
    'boundaries-token-owner': boundariesTokenOwner,
    'code-branch-once': codeBranchOnce,
    'code-constructor': codeConstructor,
    'code-delegate': codeDelegate,
    'code-double-negation': codeDoubleNegation,
    'code-function-nesting': codeFunctionNesting,
    'code-inline': codeInline,
    'code-justified-call': codeJustifiedCall,
    'code-literal-in': codeLiteralIn,
    'code-mutable-state': codeMutableState,
    'code-object-params': codeObjectParams,
    'code-paired-call': codePairedCall,
    'code-promise-mutation': codePromiseMutation,
    'code-switch': codeSwitch,
    'code-traced': codeTraced,
    'code-trivial-functions': codeTrivialFunctions,
    'code-yield-argument': codeYieldArgument,
    'comments-code': commentsCode,
    'comments-directives': commentsDirectives,
    'copy-dashes': copyDashes,
    'effect-layer-file': effectLayerFile,
    'effect-layers': effectLayers,
    'effect-merge-pipe': effectMergePipe,
    'effect-schema-first': effectSchemaFirst,
    'effect-values-first': effectValuesFirst,
    'files-components-only': filesComponentsOnly,
    'files-constants-only': filesConstantsOnly,
    'files-domain-constants': filesDomainConstants,
    'files-exports': filesExports,
    'files-externals': filesExternals,
    'files-factory-keys': filesFactoryKeys,
    'files-helpers': filesHelpers,
    'files-no-functions': filesNoFunctions,
    'files-restricted': filesRestricted,
    'files-route': filesRoute,
    'files-types-only': filesTypesOnly,
    'layout-arrow-body': layoutArrowBody,
    'layout-call-arguments': layoutCallArguments,
    'layout-call-array': layoutCallArray,
    'layout-call-depth': layoutCallDepth,
    'layout-chain': layoutChain,
    'layout-items': layoutItems,
    'layout-jsx-attributes': layoutJsxAttributes,
    'layout-key-value': layoutKeyValue,
    'layout-object': layoutObject,
    'layout-padding': layoutPadding,
    'layout-pipe': layoutPipe,
    'layout-ternary': layoutTernary,
    'layout-type-arguments': layoutTypeArguments,
    'naming-declarations': namingDeclarations,
    'naming-exports': namingExports,
    'naming-file': namingFile,
    'naming-folder': namingFolder,
    'naming-types': namingTypes,
    'react-dynamic-classes': reactDynamicClasses,
    'react-empty-effect': reactEmptyEffect,
    'react-memo': reactMemo,
    'react-props': reactProps,
    'react-query-props': reactQueryProps,
    'schemas-inline': schemasInline,
    'schemas-local': schemasLocal,
    'schemas-rederive': schemasRederive,
    'schemas-single-use': schemasSingleUse,
    'tests-assertions': testsAssertions,
    'tests-concurrent-db': testsConcurrentDb,
    'tests-modifiers': testsModifiers,
    'tests-titles': testsTitles,
    'types-declarations': typesDeclarations,
    'types-duplicate': typesDuplicate,
    'types-imported-alias': typesImportedAlias,
    'types-inline': typesInline,
    'types-local-alias': typesLocalAlias,
    'types-namespace-import': typesNamespaceImport,
    'types-service': typesService,
    'types-unknown': typesUnknown,
  },
})
