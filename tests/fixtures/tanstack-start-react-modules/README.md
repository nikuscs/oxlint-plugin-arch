# Preset integration fixtures

Every enabled preset rule, including implicit Oxlint defaults, has a passing counterexample and a failing example checked by the real CLI. `rule-coverage.json` maps every rule to those files. The inventory test checks both the authored preset (including root JavaScript-plugin rules omitted from printed output) and Oxlint's resolved configuration, including overrides, and fails if the manifest omits or duplicates a rule. It also fails when an upgrade adds an enabled default without fixtures.

This measures enabled-rule coverage, not every branch inside third-party rule implementations. Scopes, thresholds and consumer configuration have additional integration cases below.

## Projects

All projects use the built package's public preset export. The runner copies them into temporary directories; the originals stay unchanged.

- `valid/`: a complete workspace with server, web, runner, shared logger and scripts. Its 19 TypeScript/TSX source files must produce zero diagnostics and pass TypeScript. It includes real React, TanStack Router, oRPC, Zod and Tailwind dependencies, a public backend entry, service factory, action, domain types, flat hook, thin route, context and UI primitive. Exported Props interfaces and test IDs are valid here.
- `invalid/`: 120 architecture/policy examples overlaid onto the valid workspace. `expectations.json` specifies each file's required diagnostics and interview decisions. It covers folder depth, role filenames, domain naming, boundaries and the opinionated behavior beyond native defaults.
- `rules-pass/` and `rules-fail/`: per-rule counterexamples and violations, also overlaid onto `valid/`. Each assertion checks the exact rule on its exact file. These are isolated examples, so unrelated diagnostics are allowed; `rules-pass` is not a second globally clean project. Some failing examples reuse `invalid/` files. JavaScript-only rules use `.cjs`; TypeScript, React and Vitest examples use the appropriate scopes and extensions.
- `customized/`: consumer configuration, an explicit CLI entry and three additional source files. It proves `policies: { typePlacement: false }`, a policy callback, a portable-code rule exclusion, a consumer ignore and warning severity. Exactly one warning must remain in an unexcluded control file.

Every per-rule fixture must appear in Oxlint's `--debug=files` output. Parser/plugin failures fail the suite; a diagnostic from another file cannot satisfy a rejection assertion. Fixture source is linted, never executed as application code or tests.

## Run

From the repository root:

```sh
bun run build
bunx vitest run src/tests/preset-coverage.test.ts src/tests/preset-fixtures.test.ts
```

`bun run check` includes these suites. Dependency/workspace links use installed repository dependencies. The fixture runner downloads nothing.

The runners live in `src/tests/preset-coverage.test.ts` and `src/tests/preset-fixtures.test.ts`; shared setup is in `src/tests/support/preset-fixture.ts`.

Additional configuration cases live in `src/tests/preset.test.ts`: standalone/custom architecture roots, aliases, policy switches, callbacks, native overrides, public endpoint scope, plugin loading, type-aware configuration and option isolation. Focused regressions cover exported multiline declaration padding, SQL operator calls and `SAFETY:` comments on exported assertions.

Test-profile regressions cover fixture/standard import conventions, parameterized and custom tests, missing/conditional assertions, typed mocks and forbidden modifiers, assertion-based TypeScript narrowing, exact imported assertion helpers and migration-scope isolation. The shared assertion check covers native/extended tests, every static table-row callback, framework fixture teardown, called versus unused helpers, aliases, recursion and shadowing. Bare assertions and empty tests still fail. The two replaced native checks are no longer active in the preset manifest. Tailwind fix tests require byte-for-byte convergence within eight passes, followed by an unchanged repeat, not merely exit zero: overlapping fixes may finish a command successfully while leaving another fix for the next pass.

## Sources

[Cross-project review](./igerslike-review.md) records the isolated 0.5.0-to-candidate comparison, recognition fixes, migration scopes, remaining policy differences and validation limits.

Native-rule examples were adapted from [Oxlint 1.85.0's rule tests](https://github.com/oxc-project/oxc/tree/oxlint_v1.85.0/crates/oxc_linter/src/rules), then verified with this preset's actual options. The manifest records source references where applicable; `OXC-LICENSE` preserves the upstream MIT license. Other examples exercise this preset's decisions and installed plugin behavior.

Do not format `invalid/`, `rules-pass/` or `rules-fail/`: whitespace, filenames, missing EOF newlines and intentionally invalid patterns are test inputs. Repository-specific CI, Fallow and compiler-policy decisions remain outside the preset's scope.

React Compiler defaults disable the four render-time prop rules. Separate CLI tests cover all four with Compiler enabled and disabled, custom architecture roots, frontend service constants, and narrow consumer exceptions.
