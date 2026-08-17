---
name: install-oxlint-arch
description: Vendor and configure the oxlint-plugin-arch raw TypeScript plugin in a local TypeScript or JavaScript repository.
---

# Install oxlint-plugin-arch

Install the bundled Oxlint plugin into the current repository while preserving its package manager, tooling layout, lint configuration, and unrelated changes.

## Procedure

1. Inspect the target repository:
   - Read its agent instructions and `git status`.
   - Identify its package manager and Oxlint configuration.
   - Look for an existing local architecture plugin or established tooling directory.

2. Choose the destination:
   - Use the destination the user supplied.
   - Otherwise prefer the repository's existing tooling layout.
   - If more than one location is plausible, ask the user before copying.
   - The fallback is `tools/oxlint/arch`.

3. Copy the bundled source from the target repository root:

   ```bash
   bun <skill-directory>/scripts/install.ts
   bun <skill-directory>/scripts/install.ts packages/tooling/src/oxlint/arch
   bun <skill-directory>/scripts/install.ts --target tools/lint/arch
   ```

   The positional path and `--target` are equivalent and mutually exclusive. Relative paths resolve from the target repository. The installer refuses to replace an existing destination; use `--force` only after backing up and reviewing the existing copy.

4. Query current compatible versions of `oxlint` and `@oxlint/plugins`, then install the same version of both with the repository's existing package manager. Do not change package managers or unrelated dependency ranges.

5. Register the printed entry point in `jsPlugins` using plugin name `arch`. Keep all repository paths and policy in the consumer's config; never edit vendored rule source merely to encode one repository's folders.

6. Read `src/tests/` in this repository to understand required rule options. Enable only rules whose intended globs and options are confirmed with the user. Architecture rules are deliberately configurable and do not have a universal all-rules preset.

7. Ignore the chosen vendored directory in lint/format only when the consumer treats vendored source as third-party. Preserve every existing ignore.

8. Run the repository's lint command and typecheck. Report the copied path, versions installed, config changes, enabled rules, and any findings. Do not suppress or weaken findings without approval.
