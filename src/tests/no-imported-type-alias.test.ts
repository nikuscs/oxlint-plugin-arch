import { test } from 'vitest'
import { noImportedTypeAlias } from '../rules/no-imported-type-alias.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'alias' }

test('no-imported-type-alias', () => {
  createRuleTester().run(
    'arch/no-imported-type-alias',
    noImportedTypeAlias,
    {
      valid: [
        'type LocalDto = { id: string }\nexport type Local = LocalDto',
        "import type { WorkflowDto } from './dto.ts'\nexport type Workflow = WorkflowDto & { status: string }",
        "import type { WorkflowDto } from './dto.ts'\nexport type Workflow = WorkflowDto | null",
      ],
      invalid: [
        {
          code: "import type { WorkflowSummaryDto } from './dto.ts'\nexport type WorkflowSummary = WorkflowSummaryDto",
          errors: [error],
        },
        {
          code: "import type { WorkflowSummaryDto as SummaryDto } from './dto.ts'\nexport type WorkflowSummary = SummaryDto",
          errors: [error],
        },
        {
          code: "import type { WorkflowSummaryDto } from './dto.ts'\ntype WorkflowSummary = WorkflowSummaryDto\nexport { WorkflowSummary }",
          errors: [error],
        },
        {
          code: "import type { WorkflowSummaryDto } from './dto.ts'\ntype WorkflowSummary = WorkflowSummaryDto\nexport type { WorkflowSummary }",
          errors: [error],
        },
      ],
    },
  )
})
