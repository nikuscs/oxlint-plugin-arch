# `arch/no-imported-type-alias`

Rejects exported type aliases that only rename an imported type.

## Why

Callers should import the original contract. A rename alias adds no information and hides the source. Generic instantiations, intersections, and unions remain allowed.

## Examples

❌ Incorrect

```ts
import type { WorkflowSummaryDto } from './dto.ts'
export type WorkflowSummary = WorkflowSummaryDto
```

```ts
import type { WorkflowSummaryDto } from './dto.ts'
type WorkflowSummary = WorkflowSummaryDto
export type { WorkflowSummary }
```

✅ Correct

```ts
import type { Selectable } from 'kysely'
export type User = Selectable<UserTable>
```

```ts
import type { WorkflowDto } from './dto.ts'
export type Workflow = WorkflowDto & { status: string }
```

A local type that is not imported may still be aliased. Empty interfaces that only wrap an imported type are not a substitute.

## Options

This rule has no options.

## Preset

Preset: `typeSafety` policy, on app and test files.

## Related

- [`arch/no-runtime-in-types`](./no-runtime-in-types.md)
- [`arch/prefer-namespace-type-import`](./prefer-namespace-type-import.md)
- [`arch/no-rederive-schema`](./no-rederive-schema.md)
