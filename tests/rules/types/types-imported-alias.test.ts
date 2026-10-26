import { describe, it } from 'vitest'
import { typesImportedAlias } from '../../../src/rules/types/types-imported-alias.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/types-imported-alias', () => {
  it.each([
    { name: 'a generic derivation passes', code: "import type { Selectable } from 'kysely'\nexport type User = Selectable<UserTable>" },
    { name: 'an intersection passes', code: "import type { UserDto } from './user.types'\nexport type User = UserDto & { status: string }" },
    { name: 'a local alias passes', code: 'type UserDto = { id: string }\nexport type User = UserDto' },
    { name: 'an unexported alias passes', code: "import type { UserDto } from './user.types'\ntype User = UserDto" },
    { name: 'an exported generic alias passes', code: "import type { Pick } from './types.ts'\ntype User = Pick<Account, 'id'>\nexport type { User }" },
    { name: 'an imported union member passes', code: "import type { WorkflowDto } from './dto.ts'\nexport type Workflow = WorkflowDto | null" },
    { name: 'a type parameter named like an import passes', code: "import type { T } from './domain'\nexport type Identity<T> = T" },
    {
      name: 'a re-export from another module ignores a local alias',
      code: "import type { User } from './domain'\ntype PublicUser = User\nexport type { PublicUser } from './other'",
    },
    { name: 'an exported alias', code: "import type { User } from './user.types'\nexport type Account = User", errors: ['alias'] },
    {
      name: 'a renamed import names the imported type and source',
      code: "import type { User as UserDto } from './user.types'\nexport type Account = UserDto",
      errors: ["Import 'User' from './user.types' at the callers instead of exporting alias 'Account'. Keep genuine derivations; do not substitute an empty interface."],
    },
    { name: 'a default import', code: "import type User from './user.types'\nexport type Account = User", errors: ['alias'] },
    { name: 'an export specifier', code: "import type { User } from './user.types'\ntype Account = User\nexport type { Account }", errors: ['alias'] },
    {
      name: 'a value export of an imported alias',
      code: "import type { WorkflowSummaryDto } from './dto.ts'\ntype WorkflowSummary = WorkflowSummaryDto\nexport { WorkflowSummary }",
      errors: ['alias'],
    },
  ])('$name', (row) => testerRun(typesImportedAlias, row))
})
