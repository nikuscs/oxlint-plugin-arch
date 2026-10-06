# Cross-project preset review — 2026-10-04

This is preparation for a 0.6.0 minor release, not a publication record. The candidate is uncommitted and unpublished. The user approved completing the clean assertion-recognition fix. Release/publication remains separate.

## Reproduction

The original `/Users/jon/projects/igerslike` stayed clean at `fc7e20d66595879626b4edc904cabe1adf3e59b6`. Only `/tmp/igerslike-preset-trial.MvQQhB/repo` received a locally packed candidate. The trial had already received standard autofixes with version 0.5.0. No test bodies or application source were changed for this candidate comparison. No tests or typecheck were run for that application, so lint counts do not establish migration correctness.

| Configuration on the same 2,114 files | Diagnostics |
| --- | ---: |
| Published 0.5.0 after autofixes | 6,952 |
| Candidate defaults | 6,627 |
| Explicit migration files + verified payment assertion helper | 6,500 |
| Also recognize existing architecture assertions (first candidate) | 6,486 |
| Final candidate with table-row assertion support | 6,481 |

The configured run uses `modules.migrationFiles: ['apps/server/src/services/database/migrations/**/*.ts']` and `tests.additionalAssertionFunctions: ['expectRejectsWithInternal']`. Inspection confirmed the helper awaits `expect(promise).rejects.toMatchObject(...)`. The final run recognizes `arch.**.to*` through an architecture-test-only `modules/test-assertions` override. The initial candidate used the native rule for that override; the final candidate replaces both native assertion-presence and placement checks with the module rule. No safety rule was disabled. Serial candidate scans took about 10.7–10.8 seconds; these are observations, not a controlled performance benchmark.

## Preset changes and reasons

- `tests.profile` defaults to `fixtures`, preserving the existing backend ban on imports from generic `helpers` folders. `standard` leaves helper-folder organization open. Both preserve assertion, typed-mock, module-mocking and type-safety policies. Profiles do not enforce database choice, kit construction or fixture lifetime.
- Native Oxlint 1.85 assertion checks disagree on extended tests and table callbacks. Registering table-builder names is insufficient and can itself report false missing assertions. The preset now uses one `modules/test-assertions` rule for assertion presence and placement; native `vitest/expect-expect` and `vitest/no-standalone-expect` are off. Conditional assertions, mock restrictions and type safety remain unchanged.
- Register `assert`, its methods, polling/soft assertions and exact consumer assertion helpers. Prefer `assert(result.ok)` followed by unconditional data assertions: runtime failure and TypeScript narrowing, without a cast or an unwrap wrapper. Conditional-expect stays enabled.
- `modules/test-assertions` covers imported and locally extended/custom tests. It follows called local helpers and each statically declared object table row, including named const tables, `as const`, destructured/renamed callbacks and member calls. Every row must assert. Unused callbacks, shadowed expectations, empty rows/tables and standalone assertions still fail. Framework `.extend` fixture setup/teardown assertions remain valid, including Playwright automatic fixtures; they do not satisfy a separate empty test. No parser or cross-file graph was added.
- Framework migrations explicitly opt out of service folder-depth and general service-function/inline-signature rules. This removes 95 false architectural findings. The 48 migration `unknown` findings remain under the chosen strict safety policy. There is no default migration ignore or blanket safety exemption.
- Test titles now recognize `.for` and `.sequential`; custom configured names retain focused/skipped/todo bans.
- An existing Tailwind fixture assumed exit zero meant the next fix pass would be unchanged. Multiple overlapping fixes can still change the next pass. The regression now requires byte-for-byte convergence within eight passes and an unchanged additional pass. No Tailwind rule was disabled or dependency changed.

## Findings that still need consumer decisions

- The five false positives in `wallet-query-list.test.ts` are resolved without rewriting the test or registering `expected` globally. Its two SAFETY diagnostics remain independent policy findings. Dynamically constructed/imported tables and callbacks are not inferred: retain a direct assertion or explicitly register a reviewed imported assertion helper; do not manufacture unused expectations.
- The 14 architecture-test assertion findings are valid custom fluent assertions, resolved by the scoped module-rule assertion pattern above. Keep project-specific assertion DSLs in consumer config, rather than hardcoding their names into the shared preset.
- The main architectural cluster is deliberate policy drift: factory operations under nested `actions`/`queries` versus direct named operations in one domain folder. Preserve stateful factories; do not blindly remove `make`, split every method or dump helpers into utils. Migration files must be classified before any structural codemod.
- Shadcn restyling often reflects an existing component API. For example, `ListTableDot` relies on caller color through `fill-current`. Inventory contracts and repeated appearances before creating variants or deleting classes. Keep the agreed small variant budget.
- Partial mocks cast twice, generic error construction and untyped mocks remain genuine differences from the stricter policy. Do not invent casts, assertions, SAFETY prose or fake complete service implementations merely to silence them.

## Verification and limits

`bun run check` passed: lint, build, TypeScript, 1,208 tests in 52 files and all examples. The per-rule manifest contains positive and negative CLI fixtures for the new enabled rule. Profile tests exercise native and local test functions, custom names, assertion helpers, missing/conditional assertions, type narrowing and customization precedence. Migration fixtures retain safety diagnostics and reject adjacent/deeper services and another app root.

Orbs was checked read-only against the published package and the packed candidate using equivalent configs at the repository root: 290 diagnostics in both, with identical rule/file/message/location tuples. Existing concurrent quote/import/style findings were not edited. The first external `/tmp` config probe was invalid for parity because relative override scopes changed; it was discarded and repeated using a temporary root config, then that scratch file was removed.

Final assertion-check evidence: `/tmp/arch-assertions-final-check.log` and the final packed-candidate scan recorded below. Earlier comparison evidence: `/tmp/arch-profiles-final-gate.log`, `/tmp/arch-060-candidate.taKQLb/{default,configured,architecture,orbs-baseline,orbs-in-root}.json`. Baseline audit: `/tmp/igerslike-preset-trial.MvQQhB/{report,cluster-review}.md`. No commit, push, release, application test run, dev server or browser action was performed in this pass.

Final packed-candidate verification: `/tmp/arch-060-final.I5gn5p/{configured,orbs-baseline,orbs-candidate}.json`. Igerslike: 6,481 total diagnostics, zero assertion-recognition diagnostics; Orbs: 290 in both scans with identical diagnostic tuples. Original igerslike remained clean. Full final gate: `/tmp/arch-assertions-final-check.log` (1,208 tests / 52 files). The trial package stays versioned 0.5.0 only for local packing; no 0.6.0 version bump, commit, push or publication has occurred.
