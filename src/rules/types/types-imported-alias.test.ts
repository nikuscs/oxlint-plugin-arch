import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { typesImportedAlias } from './types-imported-alias.ts'

describe('arch/types-imported-alias', () => {
  it.each([
    { name: 'a generic derivation passes', code: "import type { Selectable } from 'kysely'\nexport type User = Selectable<UserTable>" },
    { name: 'an intersection passes', code: "import type { UserDto } from './user.types'\nexport type User = UserDto & { status: string }" },
    { name: 'a local alias passes', code: 'type UserDto = { id: string }\nexport type User = UserDto' },
    { name: 'an unexported alias passes', code: "import type { UserDto } from './user.types'\ntype User = UserDto" },
    { name: 'an exported generic alias passes', code: "import type { Pick } from './types.ts'\ntype User = Pick<Account, 'id'>\nexport type { User }" },
    { name: 'an exported local object alias passes', code: 'type LocalDto = { id: string }\nexport type Local = LocalDto' },
    {
      name: 'an imported intersection member passes',
      code: "import type { WorkflowDto } from './dto.ts'\nexport type Workflow = WorkflowDto & { status: string }",
    },
    { name: 'an imported union member passes', code: "import type { WorkflowDto } from './dto.ts'\nexport type Workflow = WorkflowDto | null" },
    { name: 'an exported alias', code: "import type { User } from './user.types'\nexport type Account = User", errors: ['alias'] },
    { name: 'a renamed import', code: "import type { User as UserDto } from './user.types'\nexport type Account = UserDto", errors: ['alias'] },
    { name: 'a default import', code: "import type User from './user.types'\nexport type Account = User", errors: ['alias'] },
    { name: 'an export specifier', code: "import type { User } from './user.types'\ntype Account = User\nexport type { Account }", errors: ['alias'] },
    {
      name: 'an exported summary alias',
      code: "import type { WorkflowSummaryDto } from './dto.ts'\nexport type WorkflowSummary = WorkflowSummaryDto",
      errors: ['alias'],
    },
    {
      name: 'an alias of a renamed summary import',
      code: "import type { WorkflowSummaryDto as SummaryDto } from './dto.ts'\nexport type WorkflowSummary = SummaryDto",
      errors: ['alias'],
    },
    {
      name: 'a value export of an imported alias',
      code: "import type { WorkflowSummaryDto } from './dto.ts'\ntype WorkflowSummary = WorkflowSummaryDto\nexport { WorkflowSummary }",
      errors: ['alias'],
    },
    {
      name: 'a type export of a summary alias',
      code: "import type { WorkflowSummaryDto } from './dto.ts'\ntype WorkflowSummary = WorkflowSummaryDto\nexport type { WorkflowSummary }",
      errors: ['alias'],
    },
    {
      name: 'an alias of a renamed room import',
      code: "import type { Room as BackendRoom } from './room.types'; export type ChatRoom = BackendRoom",
      errors: ['alias'],
    },
  ])('$name', (row) => testerRun(typesImportedAlias, row))
})
