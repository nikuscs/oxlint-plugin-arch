import { eslintCompatPlugin } from '@oxlint/plugins'
import { backendServiceFunctions } from './rules/backend/backend-service-functions.ts'
import { boundariesImports } from './rules/boundaries/boundaries-imports.ts'
import { boundariesNext } from './rules/boundaries/boundaries-next.ts'
import { boundariesRpcDatabase } from './rules/boundaries/boundaries-rpc-database.ts'
import { boundariesTanstack } from './rules/boundaries/boundaries-tanstack.ts'
import { codeDoubleNegation } from './rules/code/code-double-negation.ts'
import { codeSwitch } from './rules/code/code-switch.ts'
import { commentsDirectives } from './rules/comments/comments-directives.ts'
import { filesDomainConstants } from './rules/files/files-domain-constants.ts'
import { namingShape } from './rules/naming/naming-shape.ts'
import { namingTypes } from './rules/naming/naming-types.ts'
import { reactDynamicClasses } from './rules/react/react-dynamic-classes.ts'
import { reactEmptyEffect } from './rules/react/react-empty-effect.ts'
import { reactMemo } from './rules/react/react-memo.ts'
import { testsAssertions } from './rules/tests/tests-assertions.ts'
import { testsConcurrentDb } from './rules/tests/tests-concurrent-db.ts'
import { testsModifiers } from './rules/tests/tests-modifiers.ts'
import { typesLocalAlias } from './rules/types/types-local-alias.ts'
import { typesService } from './rules/types/types-service.ts'
import { typesUnknown } from './rules/types/types-unknown.ts'

export default eslintCompatPlugin({
  meta: { name: 'modules' },
  rules: {
    'backend-switch': codeSwitch,
    'concurrent-db': testsConcurrentDb,
    'domain-constants': filesDomainConstants,
    'double-negation': codeDoubleNegation,
    'dynamic-classes': reactDynamicClasses,
    'empty-effect': reactEmptyEffect,
    'import-boundaries': boundariesImports,
    'local-type-alias': typesLocalAlias,
    memoization: reactMemo,
    'next-runtime': boundariesNext,
    'no-unknown': typesUnknown,
    'pascal-interface': namingTypes,
    'reasoned-directives': commentsDirectives,
    'rpc-database': boundariesRpcDatabase,
    'service-functions': backendServiceFunctions,
    'service-types': typesService,
    'shape-suffix': namingShape,
    'tanstack-runtime': boundariesTanstack,
    'test-assertions': testsAssertions,
    'test-modifiers': testsModifiers,
  },
})
