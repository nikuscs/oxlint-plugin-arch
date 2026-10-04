import { test } from 'vitest'
import { noImportedTypeAlias } from '../rules/no-imported-type-alias.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'alias' }

test('no-imported-type-alias', () => {
  createRuleTester().run('arch/no-imported-type-alias', noImportedTypeAlias, {
    valid: [
      "import type { Selectable } from 'kysely'\nexport type User = Selectable<UserTable>",
      "import type { Pick } from './types.ts'\ntype User = Pick<Account, 'id'>\nexport type { User }",

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
  })
})

test('alias diagnostics point callers at the original imported contract', () => {
  createRuleTester().run('arch/no-imported-type-alias', noImportedTypeAlias, {
    valid: [],
    invalid: [
      {
        code: "import type { Room as BackendRoom } from './room.types'; export type ChatRoom = BackendRoom",
        errors: [
          {
            message:
              "Import 'Room' from './room.types' at the callers instead of exporting alias 'ChatRoom'. Keep genuine derivations; do not substitute an empty interface.",
          },
        ],
      },
    ],
  })
})
